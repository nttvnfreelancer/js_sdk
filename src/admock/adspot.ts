/**
 * define response mapped by adspotID
 */

import { ResponseOptions } from './adresponse';

export const RenderType = {
  Banner: 'banner',
  Interstitial: 'interstitial',
  OuterBanner: 'outer_banner',
  SingleRequest: 'single_request',
  Error: 'error',
  CustomizedADM: 'customized_adm',
} as const;

export interface AdspotResponse {
  width: number;
  height: number;
  advid: number;
  renderType: (typeof RenderType)[keyof typeof RenderType];
  opts?: ResponseOptions;
  impId?: string;
  statusCode?: number;
  videoWidth?: number;
  videoHeight?: number;
}

// Don't duplicate AdspotResponse, fix caller in RUNA tag html
export const adspotMap = (): Map<number, AdspotResponse> => {
  // key of Map is adspotID
  // adspotID:
  // - 1~      RenderType.Banner
  // - 20~     RenderType.Banner with A2A
  // - 30~     RenderType.Banner with video
  // - 101~199 RenderType.Banner with viewability
  // - 1000~   RenderType.OuterBanner
  // - 2000~   RenderType.Interstitial
  // - 5000~   RenderType.CustomizedADM
  // - 9995    RenderType.Banner with unfilled
  // - 9996    RenderType.Banner with 502 error by content delivery
  // - 9997    RenderType.Error with 502 error
  // - 9999    RenderType.Error with 204 error
  const adMap = new Map<number, AdspotResponse>();
  adMap.set(1, {
    width: 300,
    height: 250,
    advid: 8,
    renderType: RenderType.Banner,
  });
  adMap.set(3, {
    width: 320,
    height: 50,
    advid: 22,
    renderType: RenderType.Banner,
  });
  adMap.set(6, {
    width: 1280,
    height: 200,
    advid: 13,
    renderType: RenderType.Banner,
  });
  adMap.set(7, {
    width: 800,
    height: 300,
    advid: 4,
    renderType: RenderType.Banner,
  });
  // Responsive, if setResponsive(true) is used, response can be responded
  // adMap.set(10, {
  //   width: 300,
  //   height: 250,
  //   advid: 3,
  //   renderType: RenderType.Banner,
  //   opts: { responsive: true },
  // });
  // A2A
  adMap.set(20, {
    width: 300,
    height: 250,
    advid: 32,
    renderType: RenderType.Banner,
    opts: { isA2A: true },
  });
  // video
  adMap.set(30, {
    width: 300,
    height: 250,
    advid: 29,
    renderType: RenderType.Banner,
    opts: { isVideo: true },
    videoWidth: 744,
    videoHeight: 250,
  });
  // viewability
  // FIXME: could be changed simply later refactoring
  for (let i = 101; i < 151; i++) {
    adMap.set(i, {
      width: 300,
      height: 250,
      advid: 21,
      renderType: RenderType.Banner,
      opts: { debugViewability: true },
    });
  }
  // viewability
  adMap.set(151, {
    width: 300,
    height: 250,
    advid: 11,
    renderType: RenderType.Banner,
    opts: {
      debugViewability: true,
      adMarkUpWrapper: (body: string): string => {
        return `<div><div style='visibility:hidden;'>${body}</div></div>`;
      },
    },
  });
  // viewability
  adMap.set(152, {
    width: 300,
    height: 250,
    advid: 7,
    renderType: RenderType.Banner,
    opts: {
      debugViewability: true,
      adMarkUpWrapper: (body: string): string => {
        return `<div style='position:relative;top:200px;'><div style='margin-left:10px'>${body}</div></div>`;
      },
    },
  });
  // outer banner
  adMap.set(1000, {
    width: 300,
    height: 250,
    advid: 1,
    renderType: RenderType.OuterBanner,
  });
  // interstitial ads
  adMap.set(2000, {
    width: window.innerWidth || 320,
    height: window.innerHeight || 568,
    advid: 10,
    renderType: RenderType.Interstitial,
  });
  adMap.set(2001, {
    width: window.innerWidth || 320,
    height: window.innerHeight || 568,
    advid: 11,
    renderType: RenderType.Interstitial,
    opts: { isVideo: true },
  });
  // customized adm for unit test
  adMap.set(5000, {
    width: 300,
    height: 250,
    advid: 1,
    renderType: RenderType.CustomizedADM,
  });
  // unfilled
  adMap.set(9995, {
    width: 1,
    height: 1,
    advid: 0,
    renderType: RenderType.Banner,
    opts: { isUnfilled: true },
  });
  // 502 error by content delivery
  adMap.set(9996, {
    width: 300,
    height: 250,
    advid: 2,
    renderType: RenderType.Banner,
    opts: { contentDeliveryStatusCode: 502 },
  });
  // 502 error
  adMap.set(9997, {
    width: 0,
    height: 0,
    advid: 0,
    renderType: RenderType.Error,
    statusCode: 502,
  });
  // 204 error
  adMap.set(9999, {
    width: 0,
    height: 0,
    advid: 0,
    renderType: RenderType.Error,
    statusCode: 204,
  });

  return adMap;
};
