import 'whatwg-fetch';
import {
  BannerAdResponse,
  ViewabilityMetrics,
  RenderableAd,
} from '../types/response';
import {
  BidResponse,
  BidRequest,
  isBidResponse,
  Bid,
  BidrequestExt,
  RootExt,
  ImpExt,
  UserExt,
  isImpJsonExt,
} from '@src/lib/openrtb';
import { QueryParams, encodeQueryParams } from '@src/lib/url';
import { Page } from './page';
import { Ad } from './ad';
import { RDNWindow } from './tag';
import { ErrorLogger } from '@src/lib/error-logger';

declare let window: RDNWindow;

//-----------------------------------------------------------------------------
// for response
//-----------------------------------------------------------------------------

// makeRenderableAd build up renderable ad object for each ad
// `resp` should be sanitized up front
export const makeRenderableAd = (
  ad: Ad,
  resp: BidResponse
): RenderableAd | undefined => {
  const el = document.getElementById(ad.key);
  if (!(el && el instanceof HTMLElement)) {
    return undefined;
  }
  for (const sb of resp.seatbid ?? []) {
    const bids = sb?.bid ?? [];
    // Array.prototype.find cannot be used in IE11
    const filtered = bids.filter((b) => !!b.impid && b.impid === ad.getImpId());
    if (filtered[0] === undefined) {
      return undefined;
    }
    return {
      impId: filtered[0].impid ?? '',
      el,
      response: makeBannerResponse(filtered[0]),
      viewability: getViewabilityMetrics(filtered[0]),
      sessionID: resp.id, // TODO: BidResponse also need to be changed later.
      advID: getAdvID(filtered[0]),
    };
  }
  return undefined;
};

export const makeBannerResponse = (bid: Bid): BannerAdResponse => {
  return {
    html: bid.adm ?? '',
    width: bid.w ?? 0.0,
    height: bid.h ?? 0.0,
  } as BannerAdResponse;
};

export const getViewabilityMetrics = (
  bid: Bid | undefined
): ViewabilityMetrics | undefined => {
  if (bid?.ext == undefined) {
    return undefined;
  }
  const inviewURL = bid.ext?.inview_url;
  if (inviewURL !== undefined) {
    return { inviewURL };
  }
  return undefined;
};

export const getAdvID = (bid: Bid | undefined): number | undefined => {
  return bid?.ext?.advid;
};

//-----------------------------------------------------------------------------
// for request
//-----------------------------------------------------------------------------

export const createBidRequest = (ads: Ad[], ext: BidrequestExt): BidRequest => {
  const req: BidRequest = {
    device: {
      language: getLanguage(),
      ua: navigator.userAgent,
      dnt: getDoNotTrack() ? 1 : 0,
      make: navigator.vendor || '',
      w: screen.width,
      h: screen.height,
      js: 1,
      ext: {
        sdk_versions: {
          js: [
            {
              module_name: 'aa',
              version: process.env.VERSION ?? '',
            },
          ],
        },
      },
    },
    site: {
      page: location.href,
      ref: document.referrer,
    },
    imp: ads.map((ad) => ({
      id: ad.getImpId(),
      secure: getSecure() ? 1 : 0,
      ext: getImpExt(ad),
    })),
  };
  if (ext.ifa && req.device) {
    req.device.ifa = ext.ifa;
  }

  const rootExt = getRootExt(ext.badvid);
  if (rootExt !== undefined) {
    req.ext = rootExt;
  }

  const userExt = getUserExt(ext);
  if (userExt !== undefined) {
    req.user = { ext: userExt };
  }

  return req;
};

const getLanguage = (): string | undefined => {
  return navigator.language.split('-')[0];
};

export const getDoNotTrack = (): boolean => {
  return (
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    (navigator as IeNavigator).msDoNotTrack === '1' ||
    navigator.doNotTrack === 'yes'
  );
};

interface IeNavigator extends Navigator {
  msDoNotTrack: string | null;
}

const getSecure = (): boolean => {
  return document.location.protocol === 'https:';
};

const getRootExt = (badvid: number[] | undefined): RootExt | undefined => {
  if (!badvid) {
    return undefined;
  }

  const ext: RootExt = {};
  if (badvid) {
    ext.badvid = badvid;
  }
  return ext;
};

const getImpExt = (ad: Ad): ImpExt => {
  const impExt: ImpExt = {
    json: {},
  };
  if (ad.code && ad.code !== '') {
    impExt.code = ad.code;
  } else {
    impExt.adspot_id = ad.adspotID;
  }
  if (ad.getResponsive()) {
    impExt.responsive = true;
  }
  if (ad.getAdspotBranchId() !== undefined) {
    impExt.adspot_branch_id = ad.getAdspotBranchId();
  }
  const json = ad.getJSON();
  if (isImpJsonExt(json)) {
    impExt.json = json;
  }
  if (ad.getGenre()) {
    impExt.json.genre = ad.getGenre();
  }
  const targeting = ad.getSortedTargetingMap();
  if (Object.keys(targeting).length > 0) {
    impExt.json.targeting = targeting.values;
  }
  return impExt;
};

/**
 * Prepare a user extension to be send in a request by extracting values from the extra data.
 *
 * @param ext Extra data for a request.
 * @returns The user extensions for the request.
 */
const getUserExt = (ext: BidrequestExt): UserExt | undefined => {
  if (
    ext.rz === undefined &&
    ext.hashedemail === undefined &&
    ext.hashedeasyid === undefined &&
    ext.rpoint === undefined
  ) {
    return undefined;
  }

  const userExt: UserExt = {};

  if (ext.rz !== undefined) {
    userExt.rz = ext.rz;
  }

  if (ext.hashedemail !== undefined) {
    userExt.hashedemail = ext.hashedemail;
  }

  if (ext.hashedeasyid !== undefined) {
    userExt.hashedeasyid = ext.hashedeasyid;
  }

  if (ext.rpoint !== undefined) {
    userExt.rpoint = ext.rpoint;
  }

  return userExt;
};

export const getQueryParams = (ads: Ad[], p: Page): QueryParams => {
  const qs: QueryParams = {};
  if (ads.some((a) => a.getDebug())) {
    qs['debug'] = '1';
  }
  if (p.preview?.hash) {
    qs['rad_hash'] = p.preview.hash;
  }
  return qs;
};

export const getAdRequestURL = (qs: QueryParams): string => {
  let requestURL = `${process.env.AD_ENDPOINT ?? ''}`;
  const qsStr = encodeQueryParams(qs);
  if (qsStr) {
    requestURL += '?' + qsStr;
  }
  return requestURL;
};

export const fetchAds = (
  p: Page,
  ads: Ad[],
  ext: BidrequestExt,
  logger: ErrorLogger
): Promise<(RenderableAd | undefined)[]> => {
  const req = createBidRequest(ads, ext);

  return fetch(getAdRequestURL(getQueryParams(ads, p)), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'text/plain',
      // the above 'text/plain' is used to avoid preflight request
      // see: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#simple_requests
    },
    body: JSON.stringify(req),
    credentials: 'include',
    cache: 'no-cache',
  })
    .then((resp) => {
      if (resp.status === 200) {
        return resp.json();
      } else if (resp.status === 204) {
        return undefined;
      } else {
        throw new Error(`Ad response status: ${resp.status}`);
      }
    })
    .then((resp) => {
      // MEMO: To avoid logging 204 response.
      if (!resp) {
        return [];
      }
      if (isBidResponse(resp)) {
        return Promise.resolve(ads.map((ad) => makeRenderableAd(ad, resp)));
      }
      throw Promise.reject(new Error('invalid ad response'));
    })
    .catch((err) => {
      logger.logging(err as Error, req);
      return [];
    });
};
