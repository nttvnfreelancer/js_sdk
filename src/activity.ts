import Hex from 'crypto-js/enc-hex';
import { ErrorLogger } from './lib/error-logger';
import { ActivityWindow, Item, RDNActivityParams } from './types/activity';
import { jsTag } from './types/error-log';
import sha256 from 'crypto-js/sha256';
import md5 from 'crypto-js/md5';

declare let window: ActivityWindow;
const endpoint = process.env.ACTIVITY_ENDPOINT;

class Activity {
  private _params: RDNActivityParams;
  private _url: string;
  public constructor(params: RDNActivityParams, endpoint: string) {
    this._params = params;
    this._url = `${endpoint}?code=${params.code}&refer=${encodeURIComponent(
      document.referrer
    )}&page=${encodeURIComponent(location.href)}`;
  }

  public execute(): void {
    try {
      if (this._params.rz) {
        this.setRz(this._params.rz);
      }
      if (this._params.idfa) {
        this.setIdfa(this._params.idfa);
      }
      if (this._params.adid) {
        this.setAdid(this._params.adid);
      }
      if (this._params.keys) {
        this.setKeys(this._params.keys);
      }
      if (this._params.revenue) {
        this.setRevenue(this._params.revenue);
      }
      if (this._params.transaction_id) {
        this.setTransactionId(this._params.transaction_id);
      }
      if (this._params.email) {
        this.setEmail(this._params.email);
      }
      if (this._params.easy_id) {
        this.setEasyId(this._params.easy_id);
      }
      if (this._params.hashed_easy_id) {
        this.setHashedEasyId(this._params.hashed_easy_id);
      }
      if (this._params.hashed_email) {
        this.setHashedEmail(this._params.hashed_email);
      }
      if (this._params.category_id) {
        this.setCategoryId(this._params.category_id);
      }
      if (this._params.keyword) {
        this.setKeyword(this._params.keyword);
      }
      if (this._params.items) {
        this.setItems(this._params.items);
      }

      const rne = localStorage.getItem('rne');
      if (rne !== null) {
        this.setRne(rne);
      }
      const rnp = localStorage.getItem('rnp');
      if (rnp !== null) {
        this.setRnp(rnp);
      }

      if (this._params.only_logging) {
        this.setOnlyLogging(this._params.only_logging);
      }

      new Image().src = this._url;
    } catch (err) {
      const logger = new ErrorLogger(jsTag.activity);
      logger.logging(err as Error);
    }
  }

  public setDataIntoLocalStorage(): void {
    const searchParams = new URLSearchParams(window.location.search);
    const rne = searchParams.get('rne');
    const rnp = searchParams.get('rnp');
    if (rne !== null && rne.length > 0) {
      localStorage.setItem('rne', rne);
    }
    if (rnp !== null && rnp.length > 0) {
      localStorage.setItem('rnp', rnp);
    }
  }

  private setRz(rz: string): void {
    this._url = `${this._url}&rz=${rz}`;
  }

  private setIdfa(idfa: string): void {
    this._url = `${this._url}&idfa=${idfa}`;
  }

  private setAdid(adid: string): void {
    this._url = `${this._url}&adid=${adid}`;
  }

  private setKeys(keys: string[]): void {
    this._url = `${this._url}&keys=${keys.join(',')}`;
  }

  private setRevenue(revenue: number): void {
    this._url = `${this._url}&revenue=${revenue}`;
  }

  private setTransactionId(transactionId: string): void {
    this._url = `${this._url}&transaction_id=${transactionId}`;
  }

  private setRne(rne: string): void {
    this._url = `${this._url}&rne=${rne}`;
  }

  private setRnp(rnp: string): void {
    this._url = `${this._url}&rne=${rnp}`;
  }

  private setOnlyLogging(flag: boolean): void {
    this._url = `${this._url}&only_logging=${flag}`;
  }

  private setEmail(email: string): void {
    this._url = `${this._url}&hashed_email=${Hex.stringify(sha256(email))}`;
  }

  private setEasyId(easyId: string): void {
    this._url = `${this._url}&hashed_easy_id=${Hex.stringify(md5(easyId))}`;
  }

  private setHashedEasyId(hashedEasyId: string): void {
    this._url = `${this._url}&hashed_easy_id=${hashedEasyId}`;
  }

  private setHashedEmail(hashedEmail: string): void {
    this._url = `${this._url}&hashed_email=${hashedEmail}`;
  }

  private setCategoryId(categoryId: string): void {
    this._url = `${this._url}&category_id=${categoryId}`;
  }

  private setKeyword(keyword: string): void {
    this._url = `${this._url}&keyword=${keyword}`;
  }

  private setItems(items: Item[]): void {
    this._url = `${this._url}&items=${encodeURIComponent(
      JSON.stringify(items)
    )}`;
  }
}

// Note: Android/webview can't use document.body until DOMContentLoaded is called,
// However, web browser can't detect event DOMContentLoaded
const watchDocumentState = (): void => {
  const intervalID = window.setInterval(() => {
    if (
      document.readyState === 'complete' &&
      window.rdnActivityParams &&
      endpoint
    ) {
      const activity = new Activity(window.rdnActivityParams, endpoint);
      activity.setDataIntoLocalStorage();
      activity.execute();
      window.clearInterval(intervalID);
    }
  }, 50);
};
watchDocumentState();
