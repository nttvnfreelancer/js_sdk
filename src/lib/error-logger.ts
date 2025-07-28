import { UAParser } from 'ua-parser-js';
import { BidRequest } from './openrtb';
import { getDoNotTrack } from '../tag/fetcher';
import { notEmpty } from '@src/lib/typeguard';

import {
  NNavigator,
  ConnectionType,
  DeviceType,
  JSTag,
  Device,
  User,
  AdspotIdInfo,
} from '../types/error-log';

const SDK_TYPE_JS = 3;

declare const navigator: NNavigator;

export class ErrorLogger {
  private readonly _tag: JSTag;

  public constructor(tag: JSTag) {
    this._tag = tag;
  }

  public logging(err: Error, bidReq?: BidRequest): void {
    const base = {
      date: this.getDateStr(new Date()),
      session_id: bidReq ? bidReq.id : undefined,
      sdk_type: SDK_TYPE_JS,
      sdk_version: `${process.env.VERSION ?? ''}`,
      error_detail: {
        tag: this._tag,
        error_message: err.message,
        stacktrace: err.stack,
      },
      device: this.makeDevice(bidReq),
      user: this.makeUser(bidReq),
      app: undefined,
      site: {
        page: document.URL,
        ref: document.referrer,
      },
    };
    const log = Object.assign(base, this.makeAdspotIdInfo(bidReq));

    // this log would be removed on production environment
    console.error('[logging]', base);

    fetch(`${process.env.ERROR_LOGGING_ENDPOINT ?? ''}`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(log),
    }).catch(() => {});
  }

  private makeDevice(bidReq: BidRequest | undefined): Device {
    const uaParser = new UAParser(window.navigator.userAgent);
    return {
      ua: window.navigator.userAgent,
      model: undefined,
      build_name: undefined,
      type: this.getDeviceType(uaParser.getDevice().type),
      ifa: bidReq?.device?.ifa,
      lmt: getDoNotTrack() ? 1 : 0,
      os_version: uaParser.getOS().name,
      connection_method: this.getConnectionService(),
      w: window.innerWidth,
      h: window.innerHeight,
      ratio: window.devicePixelRatio,
    };
  }

  /**
   * Create a new user by extracting information from the provided bid request object and the web page.
   *
   * @param bidReq A bid request to extract data from.
   * @returns The created user filled with all information that could be found.
   */
  private makeUser(bidReq: BidRequest | undefined): User {
    if (!bidReq) {
      return {
        id: undefined,
        ext: {
          rz: undefined,
          hashedEmail: undefined,
          hashedEasyId: undefined,
        },
      };
    }
    return {
      id: this.getRpCookie(),
      ext: {
        rz: bidReq.user?.ext?.rz ?? this.getRzCookie(),
        hashedEmail: bidReq.user?.ext?.hashedemail,
        hashedEasyId: bidReq.user?.ext?.hashedeasyid,
      },
    };
  }

  private makeAdspotIdInfo(
    bidReq: BidRequest | undefined
  ): AdspotIdInfo | undefined {
    const ids = bidReq?.imp?.map((imp) => imp.ext?.adspot_id).filter(notEmpty);
    if (ids) {
      if (ids.length === 1) {
        return { adspot_id: ids[0] };
      } else {
        return { sr_adspot_ids: ids };
      }
    }
    return undefined;
  }

  /**
   * Extract the Rp cookie from the web page's current cookies.
   *
   * @returns The cookie if found.
   */
  private getRpCookie(): string | undefined {
    const result = /Rp=([a-zA-Z0-9]+);/.exec(document.cookie);
    return result ? result[1] : undefined;
  }

  /**
   * Extract the Rz cookie from the web page's current cookies and.
   *
   * @returns The cookie if found.
   */
  private getRzCookie(): string | undefined {
    const result = /Rz=([a-zA-Z0-9-]+);/.exec(document.cookie);
    return result ? result[1] : undefined;
  }

  private getDeviceType(deviceStr: string | undefined): DeviceType | undefined {
    switch (deviceStr) {
      case 'console':
        return DeviceType.PersonalComputer;
      case 'mobile':
        return DeviceType.Phone;
      case 'tablet':
        return DeviceType.Tablet;
      case 'smarttv':
        return DeviceType.ConnectedTV;
      case 'embedded':
        return DeviceType.ConnectedDevice;
      default:
        return undefined;
    }
  }

  private getConnectionService(): ConnectionType {
    const connection =
      navigator.connection ??
      navigator.mozConnection ??
      navigator.webkitConnection ??
      undefined;
    switch (connection?.type) {
      case 'ethernet':
        return ConnectionType.Ethernet;
      case 'wifi':
        return ConnectionType.WiFi;
      case 'cellular':
        return ConnectionType.CellularNetwork;
      default:
        return ConnectionType.Unknown;
    }
  }

  private getDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1).toString()).slice(-2);
    const d = ('0' + date.getDate().toString()).slice(-2);
    const h = ('0' + date.getHours().toString()).slice(-2);
    const mm = ('0' + date.getMinutes().toString()).slice(-2);
    const s = ('0' + date.getSeconds().toString()).slice(-2);

    return `${y}-${m}-${d} ${h}:${mm}:${s}`;
  }
}
