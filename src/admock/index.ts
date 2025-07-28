import * as express from 'express';
import {
  AdEvent,
  AdEventStringify,
  RequestAdEvent,
} from '../tests/utils/event';
import { Subject } from 'rxjs';
import { BidRequest } from '../lib/openrtb';
import { v4 as uuid } from 'uuid';
import {
  createClickEvent,
  createUnfilledEvent,
  createInviewEvent,
  createContentDeliveryEvent,
} from './event';
import { getAdSpotID } from './request';
import {
  sendDummyGIF,
  allowCORSOrigins,
  adResponse,
  singleRequestBannerResponse,
} from './adresponse';
import {
  sendCdResponse,
  sendCdA2AResponse,
  sendCdVideoResponse,
} from './cdresponse';

const path = require('path');

export const mockAdBefore = (app: express.Application) => {
  // https://rxjs-dev.firebaseapp.com/guide/subject
  const event$ = new Subject<AdEvent>();

  app.use(express.text());
  app.use(express.json());
  app.use(allowCORSOrigins);

  app.post('/ad-proxy', (req, res) => {
    req.body = JSON.parse(req.body);
    // single request
    if (req.body && req.body.imp!.length > 1) {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(singleRequestBannerResponse(req.body.imp)));
      return;
    }

    // get adspotID
    const adspotID = getAdSpotID(req);
    if (adspotID === undefined) {
      console.error('cannot read adspot id');
      res.status(500).end();
      return;
    }

    // create ad event
    const impId = req.body.imp[0].id;
    const sessionID = uuid();
    const adreqEvent = {
      name: 'adreq',
      adspotID,
      sessionID,
      bidRequest: req.body as BidRequest,
    } as RequestAdEvent;
    console.log(`[LOG][adreq] ${JSON.stringify(adreqEvent)}`);
    event$.next(adreqEvent);

    // create and return response
    adResponse(res, adspotID, sessionID, impId);
  });

  app.get('/cd', (req, res) => {
    const img = (req.query['img'] as string) || '';
    const click = (req.query['click'] as string) || '';
    const a2a = req.query['a2a'] || '';
    const video = req.query['video'] || '';
    const code = parseInt((req.query['status_code'] as string) || '200');

    console.log(`[ACCESS][content-delivery] ${req.url}`);
    event$.next(createContentDeliveryEvent(req));

    if (code === 200 && a2a) {
      // A2A: deprecated
      sendCdA2AResponse(res, img);
    } else if (code === 200 && video) {
      // Video
      sendCdVideoResponse(res, img, click);
    } else if (code === 200) {
      // Normal
      sendCdResponse(res, img, click);
    } else {
      res.status(code).send(`<h2>ERROR!!!!!!!! code: ${code}</h2>`).end();
    }
  });

  app.post('/error-log', (req, res) => {
    console.log(`[ERROR LOGGING] ${JSON.stringify(req.body)}`);
    res.status(200).send('ok');
  });

  app.get('/slow-script.js', (req, res) => {
    const delay = parseInt(req.query['delay'] as string, 10);
    res.setHeader('Content-Type', 'application/javascript');
    setTimeout(() => {
      res.send(`document.write('<p>THIS IS A BLOCK</p>')`);
    }, delay);
  });

  app.get('/status-error', (req, res) => {
    try {
      const s = parseInt(req.query['s'] as string);
      res.status(s).end();
      return;
    } catch (err) {
      res.status(204).end();
      return;
    }
  });

  app.get('/nested-iframe.html', (req, res) => {
    const depth = parseInt(req.query['depth'] as string, 10);
    const adspotID = parseInt(req.query['adspot_id'] as string, 10);
    const w = parseInt(req.query['w'] as string, 10) || 300;
    const h = parseInt(req.query['h'] as string, 10) || 250;
    const ad = `
    <div
      class="debug-vw"
      data-rdn-tag="banner"
      data-rdn-id="${adspotID}"
      data-rdn-imp-id="adspot-${adspotID}"
    ></div>
    <script src="./aa.js"></script>
    `;
    const nextIFrame = `<iframe src="/nested-iframe.html?depth=${
      depth - 1
    }&adspot_id=${adspotID}&w=${w}&h=${h}" width="${w}" height="${h}"></iframe> `;

    const content = depth === 0 ? ad : nextIFrame;
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Depth ${depth}</title>
  </head>

  <body>
    ${content}
  </body>
    `);
  });

  app.get('/lazy-load-in-iframe.html', (_req, res) => {
    const ad = `
    <div id="lazy-load-4"></div>
    <script>
      var rdntag = rdntag || {};
      rdntag.cmd = rdntag.cmd || [];
      rdntag.cmd.push(function () {
        rdntag.enableLazyLoad(100);
        rdntag.defineAd(1, 'lazy-load-4').setImpId("lazy-load-4");
        rdntag.display('lazy-load-4');
      });
    </script>
    <script src="aa.js" async></script>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Lazy Load in iframe</title>
  </head>

  <body>
    ${ad}
  </body>
    `);
  });

  app.get('/safeframe-ad', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const t = parseInt(req.query['t'] as string, 10);
    const inviewURL = `/inview?adspot_id=${t}`;
    res.send(`
        document.write('<div id="ad-box" style="width:300px;height:250px;background-color:burlywood;">AdSpotID=199</div>');
        window.rdnviews = window.rdnviews || [];
        window.rdnviews.push({
          el: document.getElementById('ad-box'),
          inviewURL: ${JSON.stringify(inviewURL)},
        });
        document.write('<script src="vw.js"></script>');`);
  });

  app.get('/landing-page', (req, res) => {
    console.log(`[ACCESS][landing-page] ${req.url}`);
    res.send('Welcome');
  });

  // TODO: remove this temporary endpoint
  app.get('/adm.html', (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.sendFile(path.join(__dirname + '/adm.html'));
  });

  app.get('/click', (req, res) => {
    console.log(`[ACCESS][click] ${req.url}`);
    event$.next(createClickEvent(req));
    res.redirect('/landing-page');
  });

  app.get('/unfilled', (req, res) => {
    console.log(`[ACCESS][unfilled] ${req.url}`);
    event$.next(createUnfilledEvent(req));
    sendDummyGIF(res);
  });

  app.get('/inview', (req, res) => {
    console.log(`[ACCESS][inview] ${req.url}`);
    event$.next(createInviewEvent(req));
    sendDummyGIF(res);
  });

  app.get('/rtg', (req, res) => {
    console.log(`[RETARGETING] ${req.url}`);
    sendDummyGIF(res);
  });

  app.get('/activity', (req, res) => {
    console.log(`[ACTIVITY] ${req.url}`);
    sendDummyGIF(res);
  });

  app.get('/events', (_req, res) => {
    res.setHeader('Content-Type', 'application/octet-stream');
    event$.subscribe((evt) => {
      const line = AdEventStringify(evt) + '\n';
      res.write(line);
    });
  });
};
