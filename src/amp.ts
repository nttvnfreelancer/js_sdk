import { RDNAmpWindow, AmpDefinition, RunaDataObject } from './types/amps';
import { Ad } from './tag/ad';
import { RDN } from './tag/tag';
import { ErrorLogger } from './lib/error-logger';
import { jsTag } from './types/error-log';
import { isGenre } from './types/genre';
import { isRecord, isString } from './lib/typeguard';

declare let window: RDNAmpWindow;

export class AmpContent {
  private _amp: AmpDefinition;
  private _adDiv?: HTMLDivElement;
  private readonly _logger: ErrorLogger;

  public constructor(amp: RunaDataObject) {
    this._amp = {
      id: amp.id,
      env: amp.env,
    };
    this.setCode(amp);
    this.setImpId(amp);
    this.setGenre(amp);
    this.setTargeting(amp);
    this.setIFA(amp);
    this.setRzCookie(amp);
    this.setEmail(amp);
    this.setEasyId(amp);
    this.setBlockedAdvertiser(amp);
    this.setRPoint(amp);
    this.setAdspotBranchId(amp);

    this._logger = new ErrorLogger(jsTag.amp);
  }

  private setCode(amp: RunaDataObject): void {
    if (amp.iscode && amp.iscode === 'true') this._amp.iscode = true;
  }

  private setImpId(amp: RunaDataObject): void {
    if (amp.impid) this._amp.impid = amp.impid;
  }

  private setGenre(amp: RunaDataObject): void {
    if (amp.genre) {
      const obj: unknown = JSON.parse(amp.genre);
      if (isGenre(obj)) {
        this._amp.genre = obj;
      }
    }
  }

  private setTargeting(amp: RunaDataObject): void {
    if (amp.targeting) {
      const obj: unknown = JSON.parse(amp.targeting);
      this._amp.targeting = {};
      if (isRecord(obj)) {
        for (const [k, v] of Object.entries(obj)) {
          if (typeof v === 'string') {
            this._amp.targeting[k] = [v];
          } else if (Array.isArray(v) && v.every(isString)) {
            this._amp.targeting[k] = v;
          }
        }
      }
    }
  }

  private setIFA(amp: RunaDataObject): void {
    if (amp.ifa) this._amp.ifa = amp.ifa;
  }

  private setRzCookie(amp: RunaDataObject): void {
    if (amp.rzcookie) this._amp.rzcookie = amp.rzcookie;
  }

  // setEmail handles both email and hashedEmail
  private setEmail(amp: RunaDataObject): void {
    if (amp.email) {
      this._amp.email = amp.email;
    } else if (amp.hashed_email) {
      this._amp.hashedEmail = amp.hashed_email;
    }
  }

  // setEasyId handles both easyId and hashedEasyId
  private setEasyId(amp: RunaDataObject): void {
    if (amp.easyid) {
      this._amp.easyid = amp.easyid;
    } else if (amp.hashed_easyid) {
      this._amp.hashedEasyid = amp.hashed_easyid;
    }
  }

  private setBlockedAdvertiser(amp: RunaDataObject): void {
    if (amp.advids) {
      this._amp.advIds = amp.advids.split(',').map(Number);
    }
  }

  private setRPoint(amp: RunaDataObject): void {
    if (amp.rpoint && Number.isInteger(amp.rpoint) && amp.rpoint > 0) {
      this._amp.rpoint = amp.rpoint;
    }
  }
  // setAdspotBtanchId has the range of IDs(1~20)
  private setAdspotBranchId(amp: RunaDataObject): void {
    if (
      amp.adspot_branch_id &&
      Number.isInteger(amp.adspot_branch_id) &&
      amp.adspot_branch_id > 0 &&
      amp.adspot_branch_id < 21
    ) {
      this._amp.adspotBranchId = amp.adspot_branch_id;
    }
  }

  public render(): void {
    try {
      this._adDiv = document.createElement('div');
      const adDivID = `rdn-adspot-${this._amp.id}`;
      this._adDiv.id = adDivID;

      const target = document.getElementById('c');
      if (!target) {
        return;
      }
      target.appendChild(this._adDiv);

      // scope is complicated , only window.rdntag works inside window.rdntag.cmd when execute() is running in aa.js
      window.rdntag = {} as RDN;
      window.rdntag.cmd = [];
      window.rdntag.cmd.push(() => {
        let adObj: Ad;
        if (this._amp.iscode) {
          adObj = window.rdntag!.defineAdCode(this._amp.id, adDivID);
        } else {
          adObj = window.rdntag!.defineAd(Number(this._amp.id), adDivID);
        }
        if (this._amp.impid) adObj.setImpId(this._amp.impid);
        if (this._amp.genre) adObj.setGenre(this._amp.genre);
        if (this._amp.targeting) adObj.mergeTargetingMap(this._amp.targeting);
        if (this._amp.ifa) adObj.setIFA(this._amp.ifa);
        if (this._amp.rzcookie) adObj.setRz(this._amp.rzcookie);
        if (this._amp.email) {
          adObj.setEmail(this._amp.email);
        } else if (this._amp.hashedEmail) {
          adObj.setHashedEmail(this._amp.hashedEmail);
        }
        if (this._amp.easyid) {
          adObj.setEasyId(this._amp.easyid);
        } else if (this._amp.hashedEasyid) {
          adObj.setHashedEasyId(this._amp.hashedEasyid);
        }
        if (this._amp.advIds) adObj.setBlockedAdvertiser(this._amp.advIds);
        if (this._amp.rpoint) adObj.setRPoint(this._amp.rpoint);
        if (this._amp.adspotBranchId)
          adObj.setAdspotBranchId(this._amp.adspotBranchId);
        window.rdntag!.display(adDivID);
      });

      // env: `unittest` is used for unittest from tests/amp/amp.test.ts
      if (this._amp.env == 'unittest') return;

      const sc = document.createElement('script');
      sc.async = true;
      // env: `local` is used on local server from template/e2e/amp-banner.html
      sc.src =
        this._amp.env == 'local'
          ? '/dist/aa.js'
          : `https://${this._amp.env}s-cdn.rmp.rakuten.co.jp/js/aa.js`;
      target.appendChild(sc);
    } catch (err) {
      this._logger.logging(err as Error);
    }
  }
}

// render RUNA tag from amp parameters
const execute = (): void => {
  if (window.runa) {
    const runa = new AmpContent(window.runa);
    runa.render();
  }
};

// Note: Android/webview can't use document.body until DOMContentLoaded is called,
// However, web browser can't detect event DOMContentLoaded
const watchDocumentState = (): void => {
  const intervalID = window.setInterval(() => {
    if (document.readyState === 'complete') {
      execute();
      window.clearInterval(intervalID);
    }
  }, 50);
};

watchDocumentState();
