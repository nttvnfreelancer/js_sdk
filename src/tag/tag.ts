import { RenderableAd } from '../types/response';
import { Ad, RenderStatus } from './ad';
import { getNearestSafeFrame, SafeFrame } from '@src/lib/safeframe';
import { render, resizeAd } from './render';
import { fetchAds } from './fetcher';
import { State, AdState } from './state';
import {
  isAdMessage,
  isExpandAdMessage,
  isUnfilledMessage,
  isCollapseAdMessage,
  isErrorAdMessage,
  isContentResizedMessage,
  isIosWindow,
} from '@src/lib/message';
import { createEvent, createCustomEvent } from '@src/lib/event';
import { notEmpty } from '@src/lib/typeguard';
import { lazyExecutor } from './intersection-observer';
import { ErrorLogger } from '@src/lib/error-logger';
import { jsTag } from '@src/types/error-log';
import { BidrequestExt } from '@src/lib/openrtb';
import { CarouselOptions } from '@src/types/carousel';
import '@src/css/carousel.css';
import { Carousel } from './carousel';
import { InterstitialAd } from '../ads/interstitial-ad';

export interface RDNWindow extends Window {
  rdntag: RDN;
  RDNEndpoint?: string;
  context: RDNWindowContext;
  doNotTrack?: string;
}

export interface RDNWindowContext {
  noContentAvailable: () => void;
  renderStart: () => void;
}

declare let window: RDNWindow;

export type Command = () => void;

export class RDN {
  public cmd: Command[];
  public mounted: boolean;
  private readonly _state: State;
  private _sf: SafeFrame | undefined;
  private _lazyLoad: { percent: number } | undefined;
  private readonly _logger: ErrorLogger;
  private _carousels?: Carousel[];
  // MEMO: It should be in RDN, not Ad. If we can change I/F, we should change it.
  // private _ifa: string | undefined;

  public constructor() {
    this._state = new State();
    this.cmd = [];
    this.mounted = true;
    this.mount();
    this._logger = new ErrorLogger(jsTag.aa);
  }

  public defineAd(id: number, elID: string): Ad {
    const ad = new Ad(id, elID);
    this._state.addAdState(ad);
    return ad;
  }

  public defineAdCode(code: string, elID: string): Ad {
    const ad = new Ad(0, elID, code);
    this._state.addAdState(ad);
    return ad;
  }

  public defineInterstitialAd(id: number, elID: string): InterstitialAd {
    const interstitialAd = new InterstitialAd(id, elID);
    this._state.addAdState(interstitialAd.ad);
    return interstitialAd;
  }

  public push(...fn: Command[]): void {
    this.cmd.push(...fn);
  }

  public execute(): void {
    try {
      while (this.cmd.length) {
        const c = this.cmd.shift();
        if (c) {
          c();
        }
      }
    } catch (err) {
      this._logger.logging(err as Error);
    }
  }

  private getExt(ad: Ad | undefined): BidrequestExt {
    return {
      ifa: ad?.getIFA(),
      rz: ad?.getRz(),
      badvid: ad?.getBlockedAdvertiser(),
      hashedeasyid: ad?.getHashedEasyId(),
      hashedemail: ad?.getHashedEmail(),
      rpoint: ad?.getRPoint(),
    };
  }

  private render(
    ads: AdState,
    rad: RenderableAd
  ): Promise<(RenderableAd | undefined)[] | void> {
    return render(ads.ad, rad)
      .then((iframe) => {
        this.setSuccessAdState(ads, rad, iframe);
        this.dispatchResizeForSF(ads.ad.getResponsive());
      })
      .catch((err) => {
        this._logger.logging(err as Error);
        ads.renderStatus = RenderStatus.Failed;
      });
  }

  private setSuccessAdState(
    adState: AdState | undefined,
    rad: RenderableAd | undefined,
    iframe: HTMLIFrameElement
  ): void {
    if (adState) {
      adState.renderStatus = RenderStatus.Done;
      adState.renderable = rad;
      adState.iframe = iframe;
      adState.adsID = rad?.advID;
    }
  }

  private dispatchResizeForSF(isResponsive: boolean): void {
    if (this._sf && isResponsive) {
      // for responsive ads which wrapped in a DFP's safeframe,
      // after we render a new ad,
      // DFP require to trigger a `resize` event to notice the outer DFP tag
      // to recalculate the ad size and expand it
      const resizeEvent = createEvent('resize');
      window.dispatchEvent(resizeEvent);
    }
  }

  private fetchAds(key: string | undefined, fn: () => void): void {
    // MEMO: observe an element for lazy loading
    if (this._lazyLoad) {
      if (key) {
        const target = document.getElementById(key);
        if (target) {
          lazyExecutor(target, this._lazyLoad.percent, fn);
        }
      }
      this._lazyLoad = undefined;
    } else {
      fn();
    }
  }

  private getSingleRequestAds(status?: RenderStatus): Ad[] {
    const adState = this._state.getAdStates();
    // Object.values cannot be used in IE11
    return Object.keys(adState)
      .map((key) => adState[key]?.ad)
      .filter(notEmpty)
      .filter((ad) => ad.isSingleRequest())
      .filter((ad) => {
        const st = this._state.getAdState(ad.key);
        return status ? st?.renderStatus === status : true;
      });
  }

  public display(id: string): void {
    const ads = this._state.getAdState(id);
    if (
      ads &&
      ads.renderStatus === RenderStatus.NotYet &&
      !ads.ad.isSingleRequest()
    ) {
      ads.renderStatus = RenderStatus.Queued;
      const fetcher = (): void => {
        const ext = this.getExt(ads.ad);
        fetchAds(this._state.page, [ads.ad], ext, this._logger)
          .then((rads: (RenderableAd | undefined)[]) => {
            if (rads[0]) {
              if (this._sf) {
                rads[0].safeiframe = this._sf;
              }
              return this.render(ads, rads[0]);
            }
            throw new Error('not found');
          })
          .catch((e) => {
            // this log would be removed on production environment
            console.error('[display > fetchAds]', e);

            this.handleStatusEvent(id, false, 'failed', undefined);
          });
      };

      this.fetchAds(ads.ad.key, fetcher);
    }
  }

  public displayWithSingleRequest(): void {
    const ads: Ad[] = this.getSingleRequestAds(RenderStatus.NotYet);

    if (ads.length === 0) {
      return;
    }

    ads.forEach((ad) => {
      const adState = this._state.getAdState(ad.key);
      if (adState) {
        adState.renderStatus = RenderStatus.Queued;
      }
    });
    const adsWithExt = ads.filter((ad) => ad.hasExtData());

    const fetcher = (): void => {
      // MEMO: The extra data which is set in a first ad would be used in Single Request
      const ext = this.getExt(adsWithExt[0]);
      fetchAds(this._state.page, ads, ext, this._logger)
        .then((rads: (RenderableAd | undefined)[]) => {
          rads.forEach((rad) => {
            if (rad) {
              if (this._sf) {
                rad.safeiframe = this._sf;
              }
              // Array.prototype.find cannot be used in IE11
              const filtered = ads.filter((ad) => ad.getImpId() === rad.impId);
              if (filtered[0] === undefined) {
                return;
              }
              const adState = this._state.getAdState(filtered[0].key);
              if (adState === undefined) {
                return;
              }
              void this.render(adState, rad);
            }
          });

          const renderedAdIds = (
            rads.filter((rad) => !!rad) as RenderableAd[]
          ).map((rad) => rad.impId);
          const notFoundImps = ads.filter(
            (ad) => !renderedAdIds.some((x) => x === ad.getImpId())
          );
          notFoundImps.forEach((ad) => {
            this.handleStatusEvent(ad.key, false, 'failed', undefined);
          });
        })
        .catch((e) => {
          // this log would be removed on production environment
          console.error('[displayWithSingleRequest > fetchAds]', e);

          const ads: Ad[] = this.getSingleRequestAds(RenderStatus.Queued);
          ads.forEach((ad) => {
            this.handleStatusEvent(ad.key, false, 'failed', undefined);
            const st = this._state.getAdState(ad.key);
            if (st) {
              st.renderStatus = RenderStatus.Failed;
            }
          });
        });
    };

    this.fetchAds(ads[0]?.key, fetcher);
  }

  public displayInCarousel(id: string, options?: CarouselOptions): void {
    const wrapper = document.getElementById(id);
    if (wrapper) {
      const ads: Ad[] = this.getSingleRequestAds(RenderStatus.NotYet);

      if (ads.length === 0) {
        return;
      }

      ads.forEach((ad) => {
        const adState = this._state.getAdState(ad.key);
        if (adState) {
          adState.renderStatus = RenderStatus.Queued;
        }
      });
      const adsWithExt = ads.filter((ad) => ad.hasExtData());

      const fetcher = (): void => {
        // MEMO: The extra data which is set in a first ad would be used in Single Request
        const ext = this.getExt(adsWithExt[0]);
        fetchAds(this._state.page, ads, ext, this._logger)
          .then((rads: (RenderableAd | undefined)[]) => {
            const notEmptyRads = rads.filter(notEmpty);
            const carousel = new Carousel(wrapper, notEmptyRads, options);
            this._carousels = [...(this._carousels ?? []), carousel];
            carousel.render();

            rads.forEach((rad) => {
              if (rad) {
                if (this._sf) {
                  rad.safeiframe = this._sf;
                }
                // Array.prototype.find cannot be used in IE11
                const filtered = ads.filter(
                  (ad) => ad.getImpId() === rad.impId
                );
                if (filtered[0] === undefined) {
                  return;
                }
                const adState = this._state.getAdState(filtered[0].key);
                if (adState === undefined) {
                  return;
                }
                // width, height = 1 means unfilled
                if (rad.response.width === 1 && rad.response.height === 1) {
                  carousel.handleUnfilled(rad.el);
                }
                void this.render(adState, rad);
              }
            });

            const renderedAdIds = (
              rads.filter((rad) => !!rad) as RenderableAd[]
            ).map((rad) => rad.impId);
            const notFoundImps = ads.filter(
              (ad) => !renderedAdIds.some((x) => x === ad.getImpId())
            );
            notFoundImps.forEach((ad) => {
              this.handleStatusEvent(ad.key, false, 'failed', undefined);
            });
          })
          .catch((e) => {
            // this log would be removed on production environment
            console.error('[displayWithSingleRequest > fetchAds]', e);

            const ads: Ad[] = this.getSingleRequestAds(RenderStatus.Queued);
            ads.forEach((ad) => {
              this.handleStatusEvent(ad.key, false, 'failed', undefined);
              const st = this._state.getAdState(ad.key);
              if (st) {
                st.renderStatus = RenderStatus.Failed;
              }
            });
          });
      };

      this.fetchAds(ads[0]?.key, fetcher);
    }
    // do nothing when the element for carousel is not found
  }

  public enableLazyLoad(percent?: number): void {
    this._lazyLoad = { percent: percent ?? 100 };
  }

  private mount(): void {
    this._sf = getNearestSafeFrame();
    this.waitForMessage();
    this.waitForOrientation();
    document.addEventListener('DOMContentLoaded', () => {
      this.execute();
    });
  }

  private waitForMessage(): void {
    window.addEventListener('message', (e: MessageEvent) => {
      if (!isAdMessage(e.data)) {
        return;
      }
      const msg = e.data;
      const ads = this._state.findAdStateByWindow(e.source as Window);
      let divID = '';
      if (ads?.ad) {
        divID = ads.ad.key;
      }
      if (isExpandAdMessage(msg)) {
        if (ads?.ad && ads?.iframe && ads?.renderable) {
          resizeAd(ads.ad, ads.renderable, ads.iframe);
          this._carousels?.forEach((carousel) => {
            if (
              carousel.options?.responsive &&
              carousel.slides.find(({ el }) => el === ads.renderable?.el)
            ) {
              carousel.resize(ads);
            }
            if (ads.renderable) {
              carousel.updateSlideRenderStatus(ads.renderable.el);
            }
          });
          this.handleStatusEvent(divID, true, 'succeeded', ads.adsID);
          // MEMO: There isn't iframe for contents only when delivering in iOS SDK
          // messages from contents should be catched here when you want to send messages to iOS SDK
          if (isIosWindow(window)) {
            window.webkit.messageHandlers.runaSdkInterface.postMessage(msg);
          }
        }
        // Flexible mode should consider the size after changing the size of the content with loading images or JS implementation.
        // When resizing happens inside the content, it will send "content_resized" message.
        // After then, JS SDK executes the resize logic again only in Flexible mode.
      } else if (isContentResizedMessage(msg)) {
        const ads = this._state.findAdStateByWindow(e.source as Window);
        if (
          ads?.ad &&
          ads?.iframe &&
          ads?.renderable &&
          ads?.ad.getFlexible()
        ) {
          resizeAd(ads.ad, ads.renderable, ads.iframe);
        }
      } else if (isUnfilledMessage(msg)) {
        this.handleStatusEvent(divID, false, 'unfilled', undefined);
      } else if (isCollapseAdMessage(msg)) {
        this.handleStatusEvent(divID, false, 'failed', undefined);
      } else if (isErrorAdMessage(msg)) {
        this._logger.logging(new Error(msg.message));
        // MEMO: There isn't iframe for contents only when delivering in iOS SDK
        // messages from contents should be catched here when you want to send messages to iOS SDK
        if (isIosWindow(window)) {
          window.webkit.messageHandlers.runaSdkInterface.postMessage(msg);
        }
      }
    });
  }

  private waitForOrientation(): void {
    const mql = window.matchMedia('(orientation: portrait)');
    const isSmartPhone = navigator.userAgent.match(/iPhone|Android.+Mobile/g);
    // MEMO: If the version of safari is under 14, event listners won't work.
    mql.addListener(() => {
      const adss = Object.values(this._state.getAdStates());
      adss.forEach((ads) => {
        const shouldResize = ads?.ad.getResponsive() || ads?.ad.getFlexible();
        if (
          ads?.ad &&
          ads?.iframe &&
          ads?.renderable &&
          ads?.renderStatus === RenderStatus.Done &&
          isSmartPhone &&
          shouldResize
        ) {
          resizeAd(ads.ad, ads.renderable, ads.iframe);
        }
      });
    });
  }

  private handleStatusEvent(
    id: string,
    adReturned: boolean,
    status: string,
    advID: number | undefined
  ): void {
    // amp
    if (!adReturned && window.context) {
      window.context.noContentAvailable();
    } else if (adReturned && window.context) {
      window.context.renderStart();
    }

    // event
    this.sendSlotResponseReceivedEvent(id, adReturned, status, advID);
  }

  private sendSlotResponseReceivedEvent(
    id: string,
    adReturned: boolean,
    status: string,
    advID: number | undefined
  ): void {
    if (id === '') {
      return;
    }
    const target = document.getElementById(id);
    if (target) {
      const receivedEvent = createCustomEvent('slotResponseReceived', {
        detail: {
          adReturned: adReturned,
          status: status,
          advID,
        },
      });
      target.dispatchEvent(receivedEvent);
    }
  }
}
