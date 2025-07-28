import { BidRequest } from '@src/lib/openrtb';
import {
  isOptNumber,
  isOptRecord,
  isOptString,
  isString,
} from '../../lib/typeguard';
import { ReplaySubject } from 'rxjs';
import * as http from 'http';

export type AdEvent =
  | RequestAdEvent
  | ClickAdEvent
  | UnfilledAdEvent
  | MeasuredAdEvent
  | InViewAdEvent
  | ContentDeliveryAdEvent;

export interface RequestAdEvent {
  name: 'adreq';
  adspotID?: number;
  sessionID?: string;
  bidRequest?: BidRequest;
}

export const isRequestAdEvent = (v: unknown): v is RequestAdEvent => {
  const e = v as RequestAdEvent;
  return (
    e !== undefined &&
    isString(e.name) &&
    e.name === 'adreq' &&
    isOptNumber(e.adspotID) &&
    isOptString(e.sessionID) &&
    isOptRecord(e.bidRequest)
  );
};

export const AdEventStringify = (evt: AdEvent): string => {
  return JSON.stringify(evt);
};

export interface ClickAdEvent {
  name: 'click';
  adspotID?: number;
  sessionID?: string;
}

export const isClickAdEvent = (v: unknown): v is ClickAdEvent => {
  const e = v as ClickAdEvent;
  return (
    e !== undefined &&
    isString(e.name) &&
    e.name === 'click' &&
    isOptNumber(e.adspotID) &&
    isOptString(e.sessionID)
  );
};

export interface UnfilledAdEvent {
  name: 'unfilled';
  adspotID?: number;
  sessionID?: string;
}

export const isUnfilledAdEvent = (v: unknown): v is UnfilledAdEvent => {
  const e = v as UnfilledAdEvent;
  return (
    e !== undefined &&
    isString(e.name) &&
    e.name === 'unfilled' &&
    isOptNumber(e.adspotID) &&
    isOptString(e.sessionID)
  );
};

export interface MeasuredAdEvent {
  name: 'measured';
  adspotID?: number;
  sessionID?: string;
}

export interface InViewAdEvent {
  name: 'inview';
  adspotID?: number;
  sessionID?: string;
}

export const isInViewAdEvent = (v: unknown): v is InViewAdEvent => {
  const e = v as InViewAdEvent;
  return (
    e !== undefined &&
    isString(e.name) &&
    e.name === 'inview' &&
    isOptNumber(e.adspotID) &&
    isOptString(e.sessionID)
  );
};

export interface ContentDeliveryAdEvent {
  name: 'content-delivery';
  adspotID?: number;
  sessionID?: string;
}

export const isContentDeliveryAdEvent = (
  v: unknown
): v is ContentDeliveryAdEvent => {
  const e = v as ContentDeliveryAdEvent;
  return (
    e !== undefined &&
    isString(e.name) &&
    e.name === 'content-delivery' &&
    isOptNumber(e.adspotID) &&
    isOptString(e.sessionID)
  );
};

export const isAdEvent = (v: unknown): v is AdEvent => {
  return (
    isClickAdEvent(v) ||
    isInViewAdEvent(v) ||
    isRequestAdEvent(v) ||
    isContentDeliveryAdEvent(v)
  );
};

export class AdEventListener {
  private readonly _event$: ReplaySubject<AdEvent>;
  public constructor() {
    this._event$ = new ReplaySubject();
    this.start();
  }

  public get event$(): ReplaySubject<AdEvent> {
    return this._event$;
  }

  public waitFor(
    filter: (v: AdEvent) => boolean,
    timeout: number = 10 * 1000
  ): Promise<AdEvent> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        defer();
        reject();
      }, timeout);
      const sub = this._event$.subscribe((v) => {
        if (filter(v)) {
          defer();
          resolve(v);
        }
      });
      function defer(): void {
        if (sub) {
          sub.unsubscribe();
        }
        if (timer) {
          clearTimeout(timer);
        }
      }
    });
  }

  private start(): void {
    const url = `${process.env.DEBUG_DOMAIN ?? ''}/events`;
    http.get(url, (res) => {
      res.on('data', (chunk) => {
        if (chunk instanceof Buffer) {
          const buf = chunk;
          const s: unknown = JSON.parse(buf.toString());
          if (isAdEvent(s)) {
            this._event$.next(s);
          }
        }
      });
    });
  }
}
