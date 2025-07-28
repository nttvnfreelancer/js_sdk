import { RenderableAd } from '../types/response';
import { Ad } from './ad';
import { renderIFrameContent } from '@src/lib/dom';
import { createEvent } from '@src/lib/event';

interface Size {
  width: number;
  height: number;
}

const attrSessionID = 'data-rdn-session';

// getResponsiveSize recalculates a new Size for a responsive Ad
// It uses a rule-based calculation for now and needs to be polished in the future.
export const getResponsiveSize = (
  origSize: Size,
  windowSize: Size,
  style: CSSStyleDeclaration
): Size => {
  //export const getResponsiveSize = (origSize: Size, windowSize: Size): Size => {
  // In case of runtime errors
  if (!(origSize?.height && origSize?.width)) {
    return origSize;
  }

  // If user's client size is large enough, use origSize instead.
  try {
    const thresholdRatio = 1.5;
    const mql = window.matchMedia(
      `screen and (min-width: ${origSize.width * thresholdRatio}px)`
    );
    if (mql.matches) {
      return { width: origSize.width, height: origSize.height };
    }
  } finally {
  }

  // when rad div element has style.padding property, it is used for adjustment
  // TODO: after specification is fixed, this code should be commented out
  if (style.paddingLeft) {
    windowSize.width -= parseInt(style.paddingLeft, 10) * 2;
  }

  return {
    width: windowSize.width,
    height: Math.round((windowSize.width * origSize.height) / origSize.width),
  };
};

const renderResponsive = (
  rad: RenderableAd,
  iframe: HTMLIFrameElement
): void => {
  if (!rad.response.width || !rad.response.height) {
    return;
  }

  const windowSize = getRenderableWindowSize();
  const expSize = getResponsiveSize(rad.response, windowSize, rad.el.style);

  // MEMO: We have to keep an original left offset or we don't adjust ads when screen orientation is changed.
  if (rad.originalLeftOffset === undefined) {
    rad.originalLeftOffset = rad.el.offsetLeft;
  }
  rad.el.style.marginLeft = `-${rad.originalLeftOffset || rad.el.offsetLeft}px`;
  rad.el.style.width = `${expSize.width}px`;
  rad.el.style.height = `${expSize.height}px`;
  iframe.width = '100%';
  iframe.height = '100%';
};

const viewablityMetricsHTML = (rad: RenderableAd): string => {
  const vw = rad.viewability;
  if (!vw) {
    return '';
  }
  return `<script>
    window.rdnviews = window.rdnviews || [];
    window.rdnviews.push({
      el: document.body,
      inviewURL: ${JSON.stringify(vw.inviewURL)},
    });
  </script>
  <script src="${process.env.VIEWABILITY_ENDPOINT ?? ''}"></script>`;
};

const getRenderableWindowSize = (): Size => {
  // window.innerWidth would be changeable by outer element
  return {
    // this change is related position adjustment
    width: document.documentElement.clientWidth || window.innerWidth || 0,
    height: document.documentElement.clientHeight || window.innerHeight || 0,
  };
};

export const resizeAd = (
  ad: Ad,
  rad: RenderableAd,
  iframe: HTMLIFrameElement
): void => {
  let origWidth = rad.response.width ? rad.response.width : 0;
  let origHeight = rad.response.height ? rad.response.height : 0;
  const parentElement = iframe.parentElement ?? document.documentElement;
  if (parentElement.clientWidth < origWidth) {
    const rate = parentElement.clientWidth / origWidth;
    origWidth *= rate;
    origHeight *= rate;
  }

  // MEMO: Set 100% when flexible size mode is enabled in order to measure the size of the content.
  iframe.width = ad.getFlexible() ? '100%' : String(origWidth);
  iframe.height = ad.getFlexible() ? '100%' : String(origHeight);

  if (iframe.width === '0' || iframe.height === '0') {
    iframe.style.display = 'none';
  } else {
    iframe.style.display = 'block';
  }
  if (ad.getResponsive()) {
    renderResponsive(rad, iframe);
  }

  if (ad.getFlexible()) {
    const innerIframe =
      iframe.contentDocument?.getElementsByTagName('iframe')[0];
    const creativeRoot =
      innerIframe?.contentDocument?.getElementsByTagName('div')[0];
    iframe.height = String(creativeRoot?.offsetHeight);
  }

  const resizeEvent = createEvent('resize');
  window.dispatchEvent(resizeEvent);
};

export const render = (
  ad: Ad,
  rad: RenderableAd
): Promise<HTMLIFrameElement> => {
  if (!ad || !rad?.response?.html) {
    return Promise.reject(new Error('invalid ad response'));
  }
  const renderable = rad.response.height > 1 && rad.response.width > 1;
  rad.el.style.zIndex = '999';
  const iframe = document.createElement('iframe');
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.marginHeight = '0';
  iframe.marginWidth = '0';
  if (rad.sessionID) {
    iframe.setAttribute(attrSessionID, rad.sessionID);
  }
  iframe.style.display = 'none';
  rad.el.appendChild(iframe);

  let targetHTML = rad.response.html;
  if (renderable || ad.getFlexible()) {
    targetHTML += viewablityMetricsHTML(rad);
  }

  const doc = renderIFrameContent(iframe, targetHTML);
  if (doc) {
    doc.close();
  }
  return Promise.resolve(iframe);
};
