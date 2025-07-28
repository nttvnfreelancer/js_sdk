import { CarouselOptions, NavigationOptions, Slide } from '@src/types/carousel';
import { RenderableAd } from '@src/types/response';
import { getResponsiveSize } from './render';
import { AdState } from './state';

// class names
const WRAPPER_CLASS_NAME = 'wrapper';
const RUNA_CAROUSEL_CLASS_NAME = 'runa-carousel';
const RUNA_CAROUSEL_SLIDE_CLASS_NAME = 'runa-carousel__slide';
const RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME =
  'runa-carousel__navigation-prev';
const RUNA_CAROUSEL_NAVIGATION_NEXT_CLASS_NAME =
  'runa-carousel__navigation-next';
const RUNA_CAROUSEL_NAVIGATION_HIDDEN_CLASS_NAME =
  'runa-carousel__navigation-hidden';
const RUNA_CAROUSEL_PAGINATION_CLASS_NAME = 'runa-carousel__pagination';
const RUNA_CAROUSEL_PAGINATION_INSIDE_CLASS_NAME =
  'runa-carousel__pagination-inside';
const RUNA_CAROUSEL_PAGINATION_OUTSIDE_CLASS_NAME =
  'runa-carousel__pagination-outside';
const RUNA_CAROUSEL_PAGINATION_BULLET_CLASS_NAME =
  'runa-carousel__pagination-bullet';
const RUNA_CAROUSEL_PAGINATION_BULLET_ACTIVE_CLASS_NAME =
  'runa-carousel__pagination-bullet_active';

const SCROLL_EVENT_INTERVAL = 20;

export class Carousel {
  private _wrapper: HTMLElement;
  private _carousel: HTMLElement | undefined;
  private _slides: Slide[];
  private _ads: RenderableAd[];
  private _options?: CarouselOptions;
  private _scrollThrottleTimer: number;
  private _navigation?: { prev: HTMLElement; next: HTMLElement };
  private _pagination?: HTMLElement;
  private _isOutOfResponsive?: boolean;

  public constructor(
    wrapper: HTMLElement,
    ads: RenderableAd[],
    options?: CarouselOptions
  ) {
    this._wrapper = wrapper;
    this._slides = [];
    this._ads = ads;
    this._options = options;
    this._scrollThrottleTimer = Date.now();
    this._isOutOfResponsive = true;
  }

  // getter/setter
  public get options(): CarouselOptions | undefined {
    return this._options;
  }

  public get slides(): Slide[] {
    return this._slides;
  }

  public render(): void {
    const removedUnfilled = this._ads.filter(
      (rad) => rad?.response.width !== 1 && rad?.response.height !== 1
    );
    const firstRad = removedUnfilled[0];
    this.createSlides();
    this._wrapper.style.width = this._options?.width
      ? `${this._options.width}px`
      : '100%';
    if (removedUnfilled.length > 1 && firstRad) {
      if (this._options?.freeMode) {
        this.renderFreeMode();
      } else {
        this.renderCarousel();
      }
      // hide carousel until ready for displaying
      this._wrapper.style.visibility = 'hidden';
      const adWidth =
        this._wrapper.offsetWidth < firstRad.response.width
          ? this._wrapper.offsetWidth
          : firstRad.response.width;

      const minNextSlideWidth =
        adWidth * (this._options?.nextMinSlideRate ?? 0);
      const margin = this._options?.margin ?? 0;
      const firstViewWidth = adWidth + margin + minNextSlideWidth;
      const itemWidth =
        this._wrapper.offsetWidth - firstViewWidth <= 0
          ? adWidth - margin - minNextSlideWidth
          : adWidth;

      removedUnfilled.forEach((rad, i) => {
        if (rad) {
          rad.el.style.minWidth = `${itemWidth}px`;
          if (this._options?.margin && removedUnfilled.length - 1 !== i) {
            rad.el.style.marginRight = `${this._options?.margin}px`;
          }
        }
      });
      if (this._options?.navigation && !this._options?.freeMode) {
        this.renderNavigation();
      }
      if (this._options?.pagination && !this._options?.freeMode) {
        this.renderPagination();
      }
    }
  }

  public resize(ads: AdState): void {
    if (this._options && ads?.ad && ads?.iframe && ads?.renderable) {
      const wrapperSize = {
        width: this._wrapper.offsetWidth,
        height: this._wrapper.offsetHeight,
      };
      const rad = ads.renderable;
      const iframe = ads.iframe;
      const size = {
        width: rad.response.width,
        height: rad.response.height,
      };
      const ratio = size.width / size.height;
      const expSize = getResponsiveSize(size, wrapperSize, rad.el.style);

      const displayRate =
        this._options.nextMinSlideRate &&
        this._wrapper.offsetWidth === expSize.width
          ? 1 - this._options.nextMinSlideRate
          : 1;
      const margin = this._options.margin ?? 0;
      let calculatedWidth = expSize.width * displayRate - margin;
      const isOutOfResponsive =
        expSize.width === size.width && expSize.height === size.height;
      if (this._options.centering && !isOutOfResponsive) {
        calculatedWidth =
          (wrapperSize.width - 2 * (this._options.margin ?? 0)) /
          ((this._options.nextMinSlideRate ?? 0) * 2 + 1);
        this._isOutOfResponsive = true;
      }
      rad.el.style.minWidth = `${
        isOutOfResponsive ? expSize.width : calculatedWidth
      }px`;
      rad.el.style.width = `${
        isOutOfResponsive ? expSize.width : calculatedWidth
      }px`;
      rad.el.style.height = `${
        isOutOfResponsive ? expSize.height : calculatedWidth / ratio
      }px`;

      const isUnfilled = size.width === 1 && size.height === 1;
      if (this._options.responsive && !isUnfilled) {
        iframe.width = '100%';
        iframe.height = '100%';
      }
    }
  }

  public handleUnfilled(el: HTMLElement): void {
    this._slides = this._slides.filter((slide) => slide.el !== el);
    el.style.display = 'none';
    // remove bullet in pagination mode
    if (this._options?.pagination) {
      const bullets = this._wrapper.getElementsByClassName(
        RUNA_CAROUSEL_PAGINATION_BULLET_CLASS_NAME
      );
      bullets[bullets.length - 1]?.remove();
    }
  }

  private display(): void {
    this._wrapper.style.visibility = 'visible';
    // MEMO: first slide will be randomly displayed somehow, so jump to first intentionally
    if (this._carousel) {
      this._carousel.scrollBy({
        left: -this._carousel.scrollWidth,
        // MEMO: https://github.com/microsoft/TypeScript/issues/47441
        behavior: 'instant' as ScrollBehavior,
      });
    }
    // if slides length is 1, JS SDK show ad at the center
    if (this._slides.length === 1) {
      const slide = this._slides[0];
      if (slide) {
        slide.el.style.margin = '0 auto';
        const iframe = slide.el.querySelector('iframe');
        if (iframe) {
          iframe.style.margin = '0 auto';
        }
      }
    }

    // if more than two slides are displayed in the carousel, hide navigation and pagination
    const firstSlide = this._slides[0];
    if (firstSlide) {
      const displayedMoreThanTwo =
        this._wrapper.offsetWidth >
        firstSlide.el.offsetWidth * 2 + (this._options?.margin ?? 0);
      if (displayedMoreThanTwo) {
        if (this._options?.navigation && this._navigation) {
          this._navigation.prev.style.display = 'none';
          this._navigation.next.style.display = 'none';
        }
        if (this._options?.pagination && this._pagination) {
          this._pagination.style.display = 'none';
        }
      }
    }
  }

  private enableScrollObservation(): void {
    if (this._carousel) {
      this._carousel.onscroll = () => {
        this.observeScroll();
      };
    }
  }

  public updateSlideRenderStatus(el: HTMLElement): void {
    const slide = this._slides.find((s) => {
      return s.el === el;
    });
    if (slide) {
      slide.rendered = true;
    }
  }

  private createSlides(): void {
    const slides = this._wrapper.getElementsByTagName('div');
    this._slides = Array.from(slides).map(
      (el) =>
        new Proxy(
          { el, rendered: false },
          {
            set: (target: Slide, p: string | symbol, newValue: any) =>
              this.onSlideUpdated(target, p, newValue),
          }
        )
    );
  }

  private renderCarousel(): void {
    const carousel = document.createElement('div');
    carousel.classList.add(RUNA_CAROUSEL_CLASS_NAME);
    this._wrapper.classList.add(WRAPPER_CLASS_NAME);
    const slides = this._wrapper.getElementsByTagName('div');
    Array.from(slides).forEach((slide) => {
      slide.classList.add(RUNA_CAROUSEL_SLIDE_CLASS_NAME);
      carousel.appendChild(slide);
    });
    this._carousel = carousel;
    this._wrapper.appendChild(carousel);
  }

  private renderFreeMode(): void {
    this._wrapper.style.display = 'flex';
    this._wrapper.style.overflowX = 'scroll';
  }

  private renderNavigation(): void {
    const prev = document.createElement('div');
    const next = document.createElement('div');
    // Set default styles
    prev.innerHTML = '&lsaquo;';
    next.innerHTML = '&rsaquo;';
    prev.classList.add(RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME);
    next.classList.add(RUNA_CAROUSEL_NAVIGATION_NEXT_CLASS_NAME);
    this._navigation = {
      prev,
      next,
    };

    // Set arrows depending on "type"
    if (this._options?.navigation instanceof Object) {
      const option = this._options.navigation;
      const arrowColor = option.color ?? '#007aff';
      const circleBgColor = '#FFFFFF';
      switch (option.type) {
        case 'svg':
          this.renderSvgNavigation(prev, option, 'prev');
          this.renderSvgNavigation(next, option, 'next');
          // Style for "shadow" theme
          if (option.theme === 'shadow') {
            this.renderShadowNavigationStyle(prev);
            this.renderShadowNavigationStyle(next);
          }
          // Style for "circle" theme
          if (option.theme === 'circle') {
            this.renderCircleNavigationStyle(prev, circleBgColor);
            this.renderCircleNavigationStyle(next, circleBgColor);
          }
          break;
        case 'text':
        default:
          this.renderTextNavigation(prev, option, 'prev');
          this.renderTextNavigation(next, option, 'next');
          break;
      }
      // Set onHover listener
      if (
        option.hoverHighlight &&
        /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(arrowColor)
      ) {
        const isCircleTheme = option.theme === 'circle';
        prev.onmouseover = () => {
          prev.style.color = this.getDarkerColor(arrowColor);
          prev.style.fill = this.getDarkerColor(arrowColor);
          if (isCircleTheme)
            prev.style.background = this.getDarkerColor(circleBgColor);
        };
        next.onmouseover = () => {
          next.style.color = this.getDarkerColor(arrowColor);
          next.style.fill = this.getDarkerColor(arrowColor);
          if (isCircleTheme)
            next.style.background = this.getDarkerColor(circleBgColor);
        };
        prev.onmouseleave = () => {
          prev.style.color = arrowColor;
          prev.style.fill = arrowColor;
          if (isCircleTheme) prev.style.background = circleBgColor;
        };
        next.onmouseleave = () => {
          next.style.color = arrowColor;
          next.style.fill = arrowColor;
          if (isCircleTheme) next.style.background = circleBgColor;
        };
      }
    }

    // Set onClick listener
    prev.onclick = () => {
      const activeSlideIndex = this.getActiveSlideIndex();
      const prevIndex =
        activeSlideIndex - 1 < 0 && this._options?.loop
          ? this._slides.length - 1
          : activeSlideIndex - 1;
      this.slideTo(activeSlideIndex, prevIndex, 'prev');
    };
    next.onclick = () => {
      const activeSlideIndex = this.getActiveSlideIndex();
      const slideLastIndex = this._slides.length - 1;
      const nextIndex =
        activeSlideIndex + 1 > slideLastIndex && this._options?.loop
          ? 0
          : activeSlideIndex + 1;
      this.slideTo(activeSlideIndex, nextIndex, 'next');
    };
    this._wrapper.appendChild(prev);
    this._wrapper.appendChild(next);
    if (!this._options?.loop) {
      this.disabledNavigationButton(RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME);
    }
  }

  private renderPagination(): void {
    const pagination = document.createElement('div');
    pagination.classList.add(RUNA_CAROUSEL_PAGINATION_CLASS_NAME);
    this._pagination = pagination;
    this._slides.forEach((_, i) => {
      const bullet = document.createElement('span');
      bullet.classList.add(RUNA_CAROUSEL_PAGINATION_BULLET_CLASS_NAME);
      if (i === 0) {
        bullet.classList.add(RUNA_CAROUSEL_PAGINATION_BULLET_ACTIVE_CLASS_NAME);
      }
      if (this._options?.pagination instanceof Object) {
        // color option
        if (this._options?.pagination.color) {
          bullet.style.background = this._options?.pagination.color;
        }
        // color option
        if (this._options?.pagination.size) {
          bullet.style.width = this._options?.pagination.size;
          bullet.style.height = this._options?.pagination.size;
        }
        // position option
        if (this._options?.pagination.position === 'outside') {
          pagination.classList.add(RUNA_CAROUSEL_PAGINATION_OUTSIDE_CLASS_NAME);
        } else {
          pagination.classList.add(RUNA_CAROUSEL_PAGINATION_INSIDE_CLASS_NAME);
        }
      }
      pagination.appendChild(bullet);
    });
    this._wrapper.appendChild(pagination);
  }

  private slideTo(pi: number, ni: number, direction: 'prev' | 'next'): void {
    const nextSlide = this._slides[ni];
    const margin = this._options?.margin ?? 0;
    const isHalfSlide =
      direction === 'prev'
        ? ni === 0 || ni === this._slides.length - 2
        : ni === 1 || ni === this._slides.length - 1;
    if (nextSlide && this._carousel) {
      // loop
      const isLoop =
        (pi === 0 && ni === this._slides.length - 1) ||
        (pi === this._slides.length - 1 && ni === 0);
      if (isLoop) {
        this._carousel.scrollLeft = nextSlide.el.offsetLeft;
        return;
      }

      // normally move slide
      const slideWidth = nextSlide.el.offsetWidth;
      if (isHalfSlide) {
        const wrapperWidth = this._wrapper.offsetWidth;
        const displayedNextSize = wrapperWidth - (slideWidth + margin);
        const notDisplayedNextSlideWidth = slideWidth - displayedNextSize;
        const spaceWithoutSlide = wrapperWidth - slideWidth;
        const scrollAmount = notDisplayedNextSlideWidth + spaceWithoutSlide / 2;
        this._carousel.scrollBy(
          direction === 'prev' ? -scrollAmount : scrollAmount,
          0
        );
      } else {
        this._carousel.scrollBy(
          direction === 'prev' ? -slideWidth : slideWidth,
          0
        );
      }
    }
  }

  private disabledNavigationButton(className: string): void {
    const prevBtn = this._wrapper.getElementsByClassName(
      className
    )[0] as HTMLElement;
    prevBtn.classList.add(RUNA_CAROUSEL_NAVIGATION_HIDDEN_CLASS_NAME);
  }

  private activateNavigationButton(className: string): void {
    const prevBtn = this._wrapper.getElementsByClassName(
      className
    )[0] as HTMLElement;
    prevBtn.classList.remove(RUNA_CAROUSEL_NAVIGATION_HIDDEN_CLASS_NAME);
  }

  private activatePaginationBullet(index: number): void {
    if (this._pagination) {
      const bullets = this._pagination.querySelectorAll(
        `.${RUNA_CAROUSEL_PAGINATION_BULLET_CLASS_NAME}`
      );
      bullets.forEach((slide) => {
        slide.classList.remove(
          RUNA_CAROUSEL_PAGINATION_BULLET_ACTIVE_CLASS_NAME
        );
      });
      const target = bullets[index];
      if (target) {
        target.classList.add(RUNA_CAROUSEL_PAGINATION_BULLET_ACTIVE_CLASS_NAME);
      }
    }
  }

  private getActiveSlideIndex(): number {
    if (this._carousel) {
      const iw = window.top?.innerWidth;
      const viewables = this._slides.map((slide) => {
        const pos = { left: 0, right: 0 };
        pos.left += slide.el.getBoundingClientRect().left;
        pos.right += pos.left + slide.el.offsetWidth;
        if (iw) {
          const inview =
            (pos.left >= 0 &&
              slide.el.offsetWidth <= iw - pos.left &&
              iw - pos.left >= 0) ||
            (pos.left < 0 && pos.right >= slide.el.offsetWidth);
          return inview;
        }
        return false;
      });
      const activeSlideIndex = viewables.findIndex((inview) => inview);
      return activeSlideIndex;
    }
    return -1;
  }

  private observeScroll(): void {
    if (this._scrollThrottleTimer + SCROLL_EVENT_INTERVAL < Date.now()) {
      if (this._carousel) {
        const activeSlideIndex = this.getActiveSlideIndex();
        // switch navigation buttons
        if (activeSlideIndex !== undefined) {
          // not disabling navigation buttons in loop mode
          if (!this._options?.loop && this._options?.navigation) {
            switch (activeSlideIndex) {
              case 0:
                this.disabledNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME
                );
                this.activateNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_NEXT_CLASS_NAME
                );
                break;
              case this._slides.length - 1:
                this.activateNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME
                );
                this.disabledNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_NEXT_CLASS_NAME
                );
                break;
              default:
                this.activateNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_PREV_CLASS_NAME
                );
                this.activateNavigationButton(
                  RUNA_CAROUSEL_NAVIGATION_NEXT_CLASS_NAME
                );
            }
          }
          if (this._options?.pagination) {
            this.activatePaginationBullet(activeSlideIndex);
          }
        }
        this._scrollThrottleTimer = Date.now();
      }
    }
  }
  private onSlideUpdated(
    target: Slide,
    key: string | symbol,
    value: unknown
  ): boolean {
    if (key === 'rendered' && typeof value === 'boolean') {
      target[key] = value;
      if (this._slides.every((slide) => slide.rendered)) {
        this.onAllSlidesRendered();
      }
    }
    return true;
  }

  private centralizeSlides(): void {
    // if there is only one slide in carousel, this operation should be skipped
    if (this._options?.centering && this._slides.length > 1) {
      const firstSlide = this._slides[0]!;
      const sheet = document.styleSheets[document.styleSheets.length - 1];
      if (this._isOutOfResponsive) {
        const margin =
          (this._wrapper.offsetWidth - firstSlide.el.offsetWidth) / 2;
        firstSlide.el.style.marginLeft = `${margin}px`;
        sheet?.insertRule(
          `.runa-carousel__slide:last-child::after { content: ""; width: ${margin}px; height: 1px; position: absolute; left: 100%; }`,
          sheet.cssRules.length
        );
      } else {
        const margin =
          2 *
          (this._options?.nextMinSlideRate ?? 1) *
          firstSlide.el.offsetWidth;
        firstSlide.el.style.marginLeft = `${margin}px`;
        sheet?.insertRule(
          `.runa-carousel__slide:last-child::after { content: ""; width: ${margin}px; height: 1px; position: absolute; left: 100%; }`,
          sheet.cssRules.length
        );
      }
    }
  }

  private onAllSlidesRendered(): void {
    this.centralizeSlides();
    this.enableScrollObservation();
    this.display();
  }

  private getDarkerColor(hexColor: string): string {
    const factor = 0.9;
    const hashRemoved = hexColor.replace('#', '');
    const r = parseInt(hashRemoved.substring(0, 2), 16);
    const g = parseInt(hashRemoved.substring(2, 4), 16);
    const b = parseInt(hashRemoved.substring(4, 6), 16);

    const newR = Math.max(0, Math.min(255, Math.floor(r * factor)));
    const newG = Math.max(0, Math.min(255, Math.floor(g * factor)));
    const newB = Math.max(0, Math.min(255, Math.floor(b * factor)));

    const newHexColor = `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;

    return newHexColor;
  }

  private renderSvgNavigation(
    el: HTMLDivElement,
    option: NavigationOptions,
    direction: 'prev' | 'next'
  ): HTMLDivElement {
    const isPrev = direction === 'prev';
    el.innerHTML = isPrev
      ? `<svg viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>`;
    el.style.padding = '0';
    el.style.color = option.color ?? '#007aff';
    el.style.fill = option.color ?? '#007aff';
    el.style.fontSize = '0px';
    el.style.width = option.size ?? '72px';
    el.style.height = option.size ?? '72px';
    return el;
  }

  private renderTextNavigation(
    el: HTMLDivElement,
    option: NavigationOptions,
    direction: 'prev' | 'next'
  ): HTMLDivElement {
    const isPrev = direction === 'prev';
    el.innerHTML = isPrev ? '&lsaquo;' : '&rsaquo;';
    el.style.color = option.color ?? '#007aff';
    el.style.fontSize = option.size ?? '24px';
    return el;
  }

  private renderShadowNavigationStyle(el: HTMLDivElement): HTMLDivElement {
    el.style.filter = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.25))';
    return el;
  }

  private renderCircleNavigationStyle(
    el: HTMLDivElement,
    bgColor: string
  ): HTMLDivElement {
    el.style.background = bgColor;
    el.style.opacity = '0.8';
    el.style.borderRadius = '50%';
    el.style.boxShadow = '1px 1px 2px rgba(0, 0, 0, 0.25)';
    return el;
  }
}
