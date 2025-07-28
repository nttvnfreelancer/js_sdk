import { Ad, RenderStatus } from './ad';
import { Page } from './page';
import { RenderableAd } from '../types/response';

export class State {
  private _ads: { [key: string]: AdState };
  public page: Page;
  public constructor() {
    this._ads = {};
    this.page = new Page();
  }

  public addAdState(ad: Ad): void {
    this._ads[ad.key] = {
      ad: ad,
      renderStatus: RenderStatus.NotYet,
    } as AdState;
  }

  public getAdState(id: string): AdState | undefined {
    return this._ads[id];
  }

  public getAdStates(): { [key: string]: AdState } {
    return this._ads;
  }

  public getAdRenderStatus(id: string): RenderStatus {
    const ads = this.getAdState(id);
    if (ads) {
      return ads.renderStatus;
    }
    return RenderStatus.NotYet;
  }

  public findAdStateByWindow(w: Window): AdState | undefined {
    for (const ads of Object.keys(this._ads).map((key) => this._ads[key])) {
      if (ads?.iframe?.contentWindow === w) {
        return ads;
      }
    }
    return undefined;
  }
}

export class AdState {
  public ad: Ad;
  private _renderStatus: RenderStatus;
  public renderable?: RenderableAd;
  public iframe?: HTMLIFrameElement;
  public adsID?: number;

  public constructor(ad: Ad) {
    this.ad = ad;
    this._renderStatus = RenderStatus.NotYet;
  }

  public get renderStatus(): RenderStatus {
    return this._renderStatus;
  }

  public set renderStatus(n: RenderStatus) {
    const s = this._renderStatus;
    if (
      (s === RenderStatus.NotYet && n === RenderStatus.Queued) ||
      (s === RenderStatus.Queued && n === RenderStatus.Done) ||
      (s === RenderStatus.Queued && n === RenderStatus.Failed)
    ) {
      this._renderStatus = n;
    }
  }
}
