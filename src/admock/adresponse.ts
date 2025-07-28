/**
 * handle any response logic
 */

import { notEmpty } from '../lib/typeguard';
import * as express from 'express';
import { Imp, BidResponse } from '../lib/openrtb';
import { RenderType, adspotMap } from './adspot';

export const sendDummyGIF = (res: express.Response): void => {
  res.setHeader('Content-Type', 'image/gif');
  const buf = Buffer.alloc(35);
  buf.write('R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=', 'base64');
  res.status(200).send(buf);
};

export interface ResponseOptions {
  responsive?: true;
  debugViewability?: true;
  contentDeliveryStatusCode?: number;
  isUnfilled?: boolean;
  isA2A?: boolean;
  isVideo?: boolean;
  adMarkUpWrapper?: (str: string) => string;
}

export const allowCORSOrigins = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  // Set up `Access-Control-Allow-Origin` to make following CORS requests available
  // `https://partner.googleadservices.com` (required by Third-Party tag test)
  // 'https://tpc.googlesyndication.com' (required by Third-Party tag event)
  const origin = req.header('origin');
  res.setHeader('Access-Control-Allow-Origin', origin ?? '');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, HEAD');
  next();
};

export const adResponse = (
  res: express.Response,
  adspotID: number,
  sessionID: string,
  impId: string
): void => {
  res.setHeader('Content-Type', 'application/json');
  const adMap = adspotMap();

  if (adMap.has(adspotID)) {
    const target = adMap.get(adspotID);
    if (!target) {
      res.status(500).end();
      return;
    }
    switch (target.renderType) {
      case RenderType.Banner: {
        const adm = adMarkUp(
          sessionID,
          adspotID,
          target.width,
          target.height,
          target.opts
        );

        res.send(
          JSON.stringify(
            bannerResponse(
              sessionID,
              adspotID,
              target.impId ? target.impId : impId,
              target.videoWidth ? target.videoWidth : target.width,
              target.videoHeight ? target.videoHeight : target.height,
              adm,
              target.advid
            )
          )
        );
        return;
      }
      case RenderType.OuterBanner: {
        res.send(
          JSON.stringify(
            outerBannerResponse(
              sessionID,
              adspotID,
              impId,
              target.width,
              target.height
            )
          )
        );
        return;
      }
      case RenderType.CustomizedADM: {
        res.send(
          JSON.stringify(
            customizedADMResponse(
              sessionID,
              adspotID,
              impId,
              target.width,
              target.height
            )
          )
        );
        return;
      }
      case RenderType.SingleRequest: {
        // TODO: add logic later
        break;
      }
      case RenderType.Error: {
        if (target.statusCode) {
          res.status(target.statusCode).end();
        } else {
          res.status(500).end();
        }
        return;
      }
    }
  } else {
    console.error(
      `adspotID: ${adspotID} is not found in adspotMap. see src/admock/adspot.ts`
    );
    res.status(500).end();
    return;
  }
};

// TODO: Use lit-html would be better
export const adMarkUp = (
  sessionID: string,
  adspotID: number,
  width: number,
  height: number,
  opts: ResponseOptions = {}
): string => {
  const tagPath = process.env.DEBUG_DOMAIN ? process.env.DEBUG_DOMAIN : '';
  const publicPath = process.env.DEBUG_PUBLIC ? process.env.DEBUG_PUBLIC : '';

  const imgURL = `${publicPath}/${width}x${height}.jpg`;
  const clickURL = `${tagPath}/click?adspot_id=${adspotID}&&session_id=${sessionID}`;
  const rnd = Math.floor(Math.random() * Math.floor(1000 * 1000 * 1000));
  const cdURL =
    `/cd?adspot_id=${adspotID}` +
    `&session_id=${sessionID}` +
    `&status_code=${opts.contentDeliveryStatusCode ?? 200}` +
    `&img=${encodeURIComponent(imgURL)}` +
    `&a2a=${opts.isA2A ? String(opts.isA2A) : ''}` +
    `&video=${opts.isVideo ? String(opts.isVideo) : ''}` +
    `&click=${encodeURIComponent(clickURL)}`;
  const cdObj = {
    id: `rdn-ad-${rnd}`,
    src: cdURL,
  };

  let adBody = ``;
  if (opts.isUnfilled) {
    const unfilledURL = `${tagPath}/unfilled?adspot_id=${adspotID}&session_id=${sessionID}`;
    adBody = `
      <img style="style:none;" width="1" height="1" src="${unfilledURL}"/>
      <script>window.rdncd={"unfilled":true};</script>
      <script src="${tagPath}/cd.js" async></script>
      `;
  } else {
    adBody = `
        <div id="${cdObj.id}"></div>
        <script>window.rdncd=${JSON.stringify(cdObj)};</script>
        <script src="${tagPath}/cd.js" async></script>
        `;
  }

  if (opts.adMarkUpWrapper) {
    adBody = opts.adMarkUpWrapper(adBody);
  }
  const debugViewabilityTag = opts.debugViewability
    ? `<script>DEBUG_ADSPOT_ID=${adspotID}</script><script src="${tagPath}/debug-vw.js"></script>`
    : '';

  return `${adBody}
            ${debugViewabilityTag}`;
};

export const bannerResponse = (
  sessionID: string,
  adspotID: number,
  impId: string,
  width: number,
  height: number,
  adm: string,
  advid: number
): BidResponse => {
  const tagPath = process.env.DEBUG_DOMAIN ? process.env.DEBUG_DOMAIN : '';
  const inviewURL = `${tagPath}/inview?adspot_id=${adspotID}&session_id=${sessionID}`;

  return {
    id: sessionID,
    seatbid: [
      {
        bid: [
          {
            id: 'dummy-ad',
            impid: impId,
            adm,
            w: width,
            h: height,
            ext: {
              inview_url: inviewURL,
              advid,
            },
          },
        ],
      },
    ],
  };
};

export const singleRequestBannerResponse = (imps: Imp[]): BidResponse => {
  const adMap = adspotMap();
  const tagPath = process.env.DEBUG_DOMAIN ? process.env.DEBUG_DOMAIN : '';
  const bids = imps
    .map((imp) => {
      const adspotId = imp.ext?.adspot_id ?? 0;
      const sessionId = imp.id ?? 'single-request';
      const target = adMap.get(adspotId);
      if (target) {
        return {
          id: 'dummy-ad',
          impid: imp.id,
          adm: adMarkUp(sessionId, adspotId, target.width, target.height),
          w: target.width,
          h: target.height,
          ext: {
            inview_url: `${tagPath}/inview?adspot_id=${adspotId}&session_id=${sessionId}`,
          },
        };
      }
      return undefined;
    })
    .filter(notEmpty);

  return {
    id: 'single-request',
    seatbid: [
      {
        bid: bids,
      },
    ],
  };
};

// TODO: template HTML should be replaced to new due to outdated current html
export const outerBannerResponse = (
  sessionID: string,
  _adspotID: number,
  impId: string,
  width: number,
  height: number
): BidResponse => {
  const tagPath = process.env.DEBUG_DOMAIN ? process.env.DEBUG_DOMAIN : '';
  const resMixapi = encodeURIComponent(`<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <title>RPPP - 320 x 250</title>
      <style>body{margin:0}.rppp-base-container{width:318px;height:98px;font-family:Lucida Grande,Hiragino Kaku Gothic ProN,Meiryo,sans-serif;display:block;border-style:solid;border-width:1px;border-color:#bf0000}.rppp-description,.rppp-description-and{font-size:9pt;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;word-wrap:break-word;word-break:break-all}.rppp-image-container{float:left;margin:3px}.rppp-image-product{width:92px;height:92px}.rppp-logo-container{margin-top:1px;padding-right:5px;text-align:center}.rppp-image-logo{width:50px;height:15px;margin:0 auto}.rppp-info-container{float:left;width:215px;margin-right:5px;color:#000}.rppp-description{line-height:145%;width:215px;height:52px;margin-top:-8px}.rppp-description-and{line-height:140%;width:215px;margin-top:-3px}.rppp-red-square,.rppp-red-square-and{float:left;background:#bf0000;text-align:center;color:#fff;width:100px;font-size:12px;letter-spacing:-1px}.rppp-red-square{margin-top:2px}.rppp-red-square-and{margin-top:4px;padding-top:2px;padding-bottom:2px;max-height:22px}.rppp-price,.rppp-price-and{float:right;margin-right:2px}.rppp-square-exist{padding-top:3px;padding-bottom:3px}.rppp-red-square-txt{font-size:14px}.rppp-price-and{margin-top:6px}.rppp-price-number{font-weight:700;font-size:16px;letter-spacing:-1px}.rppp-price-char{font-weight:700;font-size:13px}</style>
      <script>function setClass(s,a){s.className=a}function addClass(s,a){s.className+=" "+a}var cssPostFix="";navigator.userAgent.match(/Android/i)&&(cssPostFix="-and"),navigator.userAgent.indexOf("Android 4")>0&&(cssPostFix="-and4");</script>
  </head>
  <body>
  <a href="image_click_url">
      <div id="root">
          <div id="baseContainer" class="rppp-base-container">
              <div id="linkContainer">
                  <div class="rppp-image-container">
                      <img class="rppp-image-product" src="image_url">
                  </div>
                  <div class="rppp-info-container">
                      <div class="rppp-logo-container">
                          <img class="rppp-image-logo" src="https://mprewardsdk.blob.core.windows.net/sdk-ad/resources/images/rakuten_logo.png">
                      </div>
                      <div class="rppp-description">text</div>
                      <div class="rppp-price-container">
                          <div id="point-square">
                              <span class="rppp-red-square-txt">point</span>
                          </div>
                          <div id="price-square">
                              <span id="point-txt" class="rppp-price-number">price</span>
                              <span class="rppp-price-char">円
                                  <span></span>
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  </a>
  <script>console.log("inside rasta html");var cssPointClass="rppp-red-square"+cssPostFix,cssPriceClass="rppp-price"+cssPostFix;setClass(document.getElementById("point-square"),cssPointClass),setClass(document.getElementById("price-square"),cssPriceClass),""!==document.getElementById("point-txt").textContent&&addClass(document.getElementById("point-square"),"rppp-square-exist");</script>
  </body>
  </html>`);

  const admHTML = `
    <script>window.rdnadm = ${JSON.stringify(resMixapi)};</script>
    <script src="${tagPath}/cd.js" async></script>
    `;

  return {
    id: sessionID,
    seatbid: [
      {
        seat: 'cpc',
        bid: [
          {
            id: 'dummy-network-ad',
            impid: impId,
            adm: admHTML,
            w: width,
            h: height,
            burl: `${tagPath}/impurl`,
          },
        ],
      },
    ],
  };
};

// check for customized adm for unit test
export const customizedADMResponse = (
  sessionID: string,
  _adspotID: number,
  impId: string,
  width: number,
  height: number
): BidResponse => {
  const customizedADM = `
<div id="adm123" style="width:300px;height:250px;background-color: #006DD9;">
<p>dummy ad</p>
</div>
<script>window.parent.postMessage({"vendor": "rdn", "type": "expand"},"*");</script>
`;

  return {
    id: sessionID,
    seatbid: [
      {
        seat: 'customized_adm',
        bid: [
          {
            id: 'customized-ad',
            impid: impId,
            adm: customizedADM,
            w: width,
            h: height,
          },
        ],
      },
    ],
  };
};
