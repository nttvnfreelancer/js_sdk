// @see https://github.com/silvestreh/onScreen
// @see https://github.com/vivaxy/impression
// @see https://github.com/w3c/IntersectionObserver/blob/master/polyfill/intersection-observer.js
import {
  BehaviorSubject,
  EMPTY,
  timer,
  combineLatest,
  interval,
  Subscription,
  Observable,
} from 'rxjs';
import {
  map,
  distinctUntilChanged,
  withLatestFrom,
  switchMap,
  take,
} from 'rxjs/operators';
import { animationFrameScheduler } from 'rxjs/internal/scheduler/animationFrame';
import { SafeFrame, getNearestSafeFrame } from '@src/lib/safeframe';
import { allWindows } from '@src/lib/dom';
import { ErrorLogger } from '@src/lib/error-logger';
import { jsTag } from '@src/types/error-log';

export interface Viewability {
  computed: ComputedViewability;
  computedVisibleRatio: number;
  intersectionObserverVisibleRatio: number;
  intersection: VisibleDOMRect;
}

export interface ComputedViewability {
  isHidden: boolean;
  zoom: number;
  scale: number;
  intersection?: VisibleDOMRect;
}

// Visible threshold define how to trigger the InView event
export interface VisibleThreshold {
  // ratio specify the percent of intersection
  ratio: number;

  // time specify the eplased time of intersection
  time: number;
}

export interface InViewEvent {
  threshold: VisibleThreshold;
  viewability: Viewability;
}

type logFunc = (...ps: unknown[]) => void;

export interface ViewabilityMeasurerOptions {
  threshold?: VisibleThreshold;
  disableIntersectionObserver?: boolean;
  log?: logFunc;

  inviewURL: string;
}

export class ViewabilityMeasurer {
  private readonly _el: HTMLElement;
  private _sf?: SafeFrame;
  private readonly _computedViewability$: BehaviorSubject<ComputedViewability>;
  private _threshold: VisibleThreshold = { ratio: 0.5, time: 1000 };
  private _inviewURL?: string;
  private readonly _log?: logFunc;
  private readonly _intersectionObserverVisibleRatio$: BehaviorSubject<number>;
  private _intersectionObserver?: IntersectionObserver;
  private readonly _subscriptions: Subscription[];
  private static readonly _mounted: Map<string, ViewabilityMeasurer> = new Map<
    string,
    ViewabilityMeasurer
  >();
  private readonly _logger: ErrorLogger;

  public static mount = (
    el: HTMLElement,
    opts?: ViewabilityMeasurerOptions
  ): ViewabilityMeasurer => {
    const attrMount = 'data-vw-mounted';
    const mountedKey = el.getAttribute(attrMount) ?? '';
    const mounted = ViewabilityMeasurer._mounted.get(mountedKey);
    let disableIntersectionObserver = false;
    if (mounted) {
      return mounted;
    }
    const m = new ViewabilityMeasurer(el);

    m._threshold = {
      ratio: 0.5,
      time: 1000,
    };
    if (opts) {
      // Threshold settings is only for debug usage.
      // It's values are based on the following IAB guidelines.
      // • Pixel Requirement: Greater than or equal to 50% of the pixels in the
      // advertisement were on an in-focus browser tab on the viewable space of
      // the browser page, and
      // • Time Requirement: The time the pixel requirement is met was greater
      // than or equal to one continuous second, post ad render.
      if (opts.threshold) {
        m._threshold = opts.threshold;
      }
      if (opts.disableIntersectionObserver !== undefined) {
        disableIntersectionObserver = opts.disableIntersectionObserver;
      }
      m._inviewURL = opts.inviewURL;
    }
    const toMountKey = String(
      Math.floor(Math.random() * Math.floor(1000 * 1000 * 1000))
    );
    el.setAttribute(attrMount, toMountKey);

    m.record({ disableIntersectionObserver });
    return m;
  };

  private constructor(el: HTMLElement) {
    this._el = el;
    const cv0: ComputedViewability = {
      isHidden: false,
      zoom: 1.0,
      scale: 1.0,
    };
    this._subscriptions = [];
    this._computedViewability$ = new BehaviorSubject(cv0);
    this._intersectionObserverVisibleRatio$ = new BehaviorSubject(0.0);
    this._logger = new ErrorLogger(jsTag.vw);
  }

  private log(...ps: unknown[]): void {
    if (this._log) {
      this._log(...ps);
    }
  }

  private record(opt?: { disableIntersectionObserver: boolean }): void {
    try {
      // Mount intersectionObserver if possible
      const sf = getNearestSafeFrame();
      if (sf) {
        this.mountSafeFrameObserver(sf);
        this._sf = sf;
      } else if (!opt?.disableIntersectionObserver) {
        this.mountIntersectionObserver();
      } else if (this.isViewabilityComputable()) {
        // do nothing
      } else {
        // Non-measurable
        return;
      }

      // TODO use event instead of polling?
      // use `animationFrame` scheduler here to avoid impacts to renderring
      this._subscriptions.push(
        interval(200, animationFrameScheduler).subscribe((_) => {
          const v = this.computeViewability();
          if (v) {
            this._computedViewability$.next(v);
          }
        })
      );

      this._subscriptions.push(
        this.inview$.pipe(take(1)).subscribe(() => {
          try {
            this.sendInviewMetric();
          } finally {
            this.unsubscribeAll();
            this.unmountAll();
          }
        })
      );
    } catch (err) {
      this._logger.logging(err as Error);
    }
  }

  private unsubscribeAll(): void {
    this._subscriptions.forEach((s) => {
      if (s) {
        s.unsubscribe();
      }
    });
  }

  private unmountAll(): void {
    try {
      if (this._intersectionObserver) {
        this._intersectionObserver.unobserve(this._el);
      }
    } finally {
    }
  }

  // mountSafeFrameObserver mounts native or polyfill intersectionObserver
  private mountSafeFrameObserver(sf: SafeFrame): void {
    this._subscriptions.push(
      interval(200).subscribe((_) => {
        this._intersectionObserverVisibleRatio$.next(
          sf.ext.inViewPercentage() / 100.0
        );
      })
    );
  }

  private isViewabilityComputable(): boolean {
    const vs = viewabilityElementGenerator(this._el);
    let n = 20;
    let vp: ViewabilityElement | void;
    try {
      do {
        vp = vs.shift();
        if (vp && window.top && vp.el?.ownerDocument === window.top.document) {
          return true;
        }
      } while (vp && --n);
    } catch (err) {
      this._logger.logging(err as Error);
      return false;
    }
    return false;
  }

  // mountIntersectionObserver mounts native or polyfill intersectionObserver
  private mountIntersectionObserver(): void {
    if (this._intersectionObserver ?? !this._el) {
      return;
    }
    if (isIntersectionObserver()) {
      const opt: IntersectionObserverInit = {
        // Add `0` to catch out-view event
        threshold: [0, this._threshold.ratio, 1.0],
      };
      this._intersectionObserver = new IntersectionObserver(
        (entries: IntersectionObserverEntry[]) => {
          entries.forEach((e) => {
            this._intersectionObserverVisibleRatio$.next(e.intersectionRatio);
          });
        },
        opt
      );
      this._intersectionObserver.observe(this._el);
    }
  }

  private appendImageBeacon(src: string): void {
    try {
      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('style', 'display: none;');
      document.body.appendChild(img);
    } catch (err) {
      this._logger.logging(err as Error);
      this.log(`Cannot add image beacon to ${src}`, err);
    }
  }

  private sendInviewMetric(): void {
    if (this._inviewURL) {
      this.appendImageBeacon(this._inviewURL);
    }
  }

  // inview$ is a observable event stream emit when
  // the visible ratio is greater than the threshold ratio for a specific time
  public get inview$(): Observable<InViewEvent> {
    return this.distinctViewability$.pipe(
      map((v) => v.computedVisibleRatio >= this._threshold.ratio),
      distinctUntilChanged(),
      switchMap((v) => (v ? timer(this._threshold.time) : EMPTY)),
      withLatestFrom(this.distinctViewability$),
      map(
        ([, v]) =>
          ({
            threshold: this._threshold,
            viewability: v,
          }) as InViewEvent
      )
    );
  }

  public get viewability$(): Observable<Viewability> {
    return combineLatest([
      this._computedViewability$,
      this._intersectionObserverVisibleRatio$,
    ]).pipe(
      map(([cv, vr]) => {
        let cvr = 0;
        if (this._intersectionObserver ?? this._sf) {
          cvr = vr;
        } else if (cv.intersection !== undefined) {
          const r = getBoundingClientRect(this._el);
          if (r?.width && r?.height) {
            cvr =
              (cv.intersection.height * cv.intersection.width) /
              (r.width * r.height);
          }
        }
        if (cv.isHidden) {
          cvr = 0.0;
        }
        cvr = cvr * cv.scale * cv.zoom;
        return {
          computed: cv,
          intersectionObserverVisibleRatio: vr,
          computedVisibleRatio: cvr,
        } as Viewability;
      })
    );
  }

  public get distinctViewability$(): Observable<Viewability> {
    return this.viewability$.pipe(
      distinctUntilChanged(
        (v1, v2) =>
          v1.intersectionObserverVisibleRatio ===
            v2.intersectionObserverVisibleRatio &&
          v1.computedVisibleRatio === v2.computedVisibleRatio &&
          v1.computed.isHidden === v2.computed.isHidden &&
          v1.computed.scale === v2.computed.scale &&
          v1.computed.zoom === v2.computed.zoom
      )
    );
  }

  private computeViewability(): ComputedViewability | undefined {
    const vs = viewabilityElementGenerator(this._el);
    let scale = 1.0;
    let zoom = 1.0;
    let isHidden = false;
    let n = 20;
    let vp: ViewabilityElement | undefined = vs.shift();
    let intersection: VisibleDOMRect | undefined = vp ? vp.rect : undefined;
    while (vp && --n) {
      // short circuit of intersection computation.
      // if intersection is illegal at any stage, the final value is also illegal
      if (intersection) {
        if (vp.el.tagName === 'IFRAME') {
          // Need to offset the pervious intersection to match the upper layer one
          const offset = intersection;
          offset.top += vp.rect.top;
          offset.left += vp.rect.left;
          offset.bottom += vp.rect.bottom;
          offset.right += vp.rect.right;
          intersection = computeRectIntersection(offset, vp.rect);
        } else {
          intersection = computeRectIntersection(intersection, vp.rect);
        }

        if (vp.el.tagName === 'HTML') {
          intersection = computeRectIntersection(
            intersection,
            getVisibleClientRect(vp.el)
          );
        }
      }
      isHidden = isHidden || vp.isHidden;
      zoom = zoom * vp.zoom * vp.zoom; // 2-axis
      if (vp.matrix) {
        scale = scale * vp.matrix.scaleX * vp.matrix.scaleY;
      }

      vp = vs.shift();
    }
    return {
      intersection,
      isHidden,
      zoom,
      scale,
    };
  }
}

// ---- DOM -----
const getStyle = (e: Element): CSSStyleDeclaration => {
  if (document?.defaultView) {
    return document.defaultView.getComputedStyle(e, '');
  }
  // Handle IE's style
  if (isIeElement(e)) {
    return e.currentStyle;
  }
  return {} as CSSStyleDeclaration;
};

interface IeElement extends Element {
  currentStyle: CSSStyleDeclaration;
}

function isIeElement(v: Element): v is IeElement {
  const e = v as IeElement;
  // Note: We can't really check whether currentStyle is really a CSSStyleDeclaration.
  return e?.currentStyle !== undefined;
}

interface ViewabilityElement {
  el: HTMLElement;
  style: CSSStyleDeclaration;
  isHidden: boolean;
  isOffset: boolean;
  zoom: number;
  matrix?: Matrix;
  rect: VisibleDOMRect;
}

// viewabilityElementGenerator generator all elements
// which has side effect to a element,
// from the given element to window.top
function viewabilityElementGenerator(e: HTMLElement): ViewabilityElement[] {
  let el = e;
  let n = 20;
  const windows = allWindows();
  const w = windows.shift();
  const res: ViewabilityElement[] = [];
  res.push(getViewabilityElement(el));
  while (el && w && n--) {
    const vp = getViewabilityParent(el, windows);
    if (!vp) {
      break;
    }
    res.push(vp);
    el = vp.el;
  }
  return res;
}

// getViewabilityParent retrieves the nearest parent which
// impact DOM's position or visibility.
// IntersectionObserver (including polyfill) should be handle offset and transform translate well,
// so getViewabilityParent handles the rests.
const getViewabilityParent = (
  e: HTMLElement,
  windows: Window[]
): ViewabilityElement | null => {
  const MAX_DEPTH = 20;
  let i = MAX_DEPTH;
  let p: HTMLElement | null = e;

  do {
    if (p.tagName === 'HTML') {
      const parentWindow = windows.shift();
      if (parentWindow) {
        p = getNearestParentWindow(p as HTMLHtmlElement, parentWindow);
      } else {
        p = null;
      }
    } else {
      p = p.parentElement;
    }
    if (!p) {
      return null;
    }
    const ve = getViewabilityElement(p);
    if (
      ve &&
      ((ve.isHidden || ve.isOffset || ve.zoom !== 1.0 || ve.matrix) ??
        ve.el.tagName in ['IFRAME', 'HTML'])
    ) {
      return ve;
    }
    if (ve) {
      return ve;
    }
  } while (p && i--);
  return null;
};

const getViewabilityElement = (el: HTMLElement): ViewabilityElement => {
  const s = getStyle(el);
  const r =
    el.tagName === 'HTML'
      ? getVisibleClientRect(el)
      : getBoundingClientRect(el);
  const isHidden = isHiddenStyle(s);
  const isOffset = isOffsetStyle(s);
  const zoom = Math.min(1.0, getZoom(s));
  const m = getTransformMatrix(s);
  const ve: ViewabilityElement = {
    el,
    rect: r,
    style: s,
    isHidden,
    isOffset,
    zoom,
  };
  if (m) {
    ve.matrix = m;
  }
  return ve;
};

const getNearestParentWindow = (
  h: HTMLHtmlElement,
  parent: Window
): HTMLIFrameElement | null => {
  if (!parent || !h) {
    return null;
  }
  try {
    // Try to retrieve the iframe from upper level
    // Use `try` to avoid cross-domain error
    // Use Array.prototype.slice.call to support IE11
    const iframes = Array.prototype.slice.call(
      parent.document.querySelectorAll('iframe'),
      0
    ) as HTMLIFrameElement[];
    for (const f of iframes) {
      if (f.contentDocument && f.contentDocument.body.parentElement === h) {
        return f;
      }
    }
  } catch (err) {} // this error is acceptable
  return null;
};

const isHiddenStyle = (s: CSSStyleDeclaration): boolean => {
  return (
    ('0px' === s.width && 'hidden' === s.overflowX) ||
    ('0px' === s.height && 'hidden' === s.overflowY) ||
    (('0px' === s.width || '0px' === s.height) && 'hidden' === s.overflow) ||
    'none' === s.display ||
    'hidden' === s.visibility ||
    'collapse' === s.visibility
  );
};

const isOffsetStyle = (s: CSSStyleDeclaration): boolean => {
  return !!(s.position && s.position in ['relative', 'absolute', 'fixed']);
};

interface Matrix {
  scaleX: number;
  scaleY: number;
}

// getTransformMatrix is for retrieving CSS transform data from style.
// It's not required to be accurate. A rough estimation is good enough.
// Since IntersectionObserver works to most of browsers for handling `translate`
// This function only take account of `scale`.
const getTransformMatrix = (s: CSSStyleDeclaration): Matrix | undefined => {
  const s2 = s as unknown as Record<string, string | undefined>;
  const keys = ['transform', 'webkitTransform', 'MozTransform', 'msTransform'];
  for (const key of keys) {
    const v = s2[key];
    if (v) {
      // Since it's a rough estimation, we dropped matrix3d information here.
      // `matrix` will also be computed when matrix3d scaling is set,
      // so we only need `matrix` to handle scaleX,Y.
      const mat = /^matrix\((.+)\)$/.exec(v) as string[] | undefined;
      if (mat) {
        const [, matStr] = mat;
        const a = matStr?.split(', ')?.map((v) => parseFloat(v));
        if (a !== undefined && a.length === 6) {
          return { scaleX: a[0] ?? 0, scaleY: a[3] ?? 0 };
        }
      }
    }
  }
  return undefined;
};

interface VisibleDOMRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

const getEmptyRect = (): VisibleDOMRect =>
  ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    width: 0,
    height: 0,
  }) as VisibleDOMRect;

const computeRectIntersection = (
  r1?: VisibleDOMRect,
  r2?: VisibleDOMRect
): VisibleDOMRect | undefined => {
  // It's an illegal intersection if either side is illegal
  if (!r1 || !r2) {
    return undefined;
  }
  const top = Math.max(r1.top, r2.top);
  const bottom = Math.min(r1.bottom, r2.bottom);
  const left = Math.max(r1.left, r2.left);
  const right = Math.min(r1.right, r2.right);
  const width = right - left;
  const height = bottom - top;

  return width >= 0 && height >= 0
    ? {
        top,
        bottom,
        left,
        right,
        width,
        height,
      }
    : undefined;
};

const getVisibleClientRect = (el: HTMLElement): VisibleDOMRect => {
  if (!el?.ownerDocument || !el.ownerDocument.defaultView) {
    return getEmptyRect();
  }
  const wn = el.ownerDocument.defaultView;
  const w = wn.innerWidth;
  const h = wn.innerHeight;
  const r = {
    top: 0,
    bottom: h,
    left: 0,
    right: w,
    width: w,
    height: h,
  };
  return r;
};

const getBoundingClientRect = (el: HTMLElement): VisibleDOMRect => {
  try {
    const r = el.getBoundingClientRect();
    if (r) {
      // Older IE
      let w = r.width;
      let h = r.height;
      if (!(w && h)) {
        w = r.right - r.left;
        h = r.bottom - r.top;
      }
      return {
        top: r.top,
        right: r.right,
        bottom: r.bottom,
        left: r.left,
        width: w,
        height: h,
      };
    }
    return getEmptyRect();
  } catch (err) {
    // Ignore Windows 7 IE11 "Unspecified error"
    // https://github.com/w3c/IntersectionObserver/pull/205
    return getEmptyRect();
  }
};

const getZoom = (s: CSSStyleDeclaration): number => {
  const z = s.getPropertyValue('zoom');
  if (!z) {
    return 1.0;
  }
  if (/^[\d.]+%/.test(z)) {
    return parseFloat(z.replace('%', '')) / 100.0;
  }
  if (/^[\d.]+/.test(z)) {
    return parseFloat(z);
  }
  return 1.0;
};

const isIntersectionObserver = (): boolean => {
  try {
    new IntersectionObserver(() => {});
    return true;
  } catch {
    return false;
  }
};

export default ViewabilityMeasurer;
