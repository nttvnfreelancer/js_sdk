import '../utils/match-media-mock';
import { RDN } from '../../tag/tag';
import { Genre } from '../../types/genre';
import { QueryParams } from '@src/lib/url';
import {
  createBidRequest,
  getQueryParams,
  getAdRequestURL,
  makeBannerResponse,
  getViewabilityMetrics,
  getAdvID,
  makeRenderableAd,
} from '../../tag/fetcher';
import * as fs from 'fs';
import * as path from 'path';
import { BidResponse, isBidResponse } from '@src/lib/openrtb';
import { newRDN } from './types';

describe('createBidRequest()', () => {
  test('happy path: default value', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');

    const ext = tag.getExt(ad);
    const req = createBidRequest([ad], ext);

    // test
    expect(req).toHaveProperty('device');
    expect(req).toHaveProperty('device.language');
    expect(req).toHaveProperty('device.ua');
    expect(req).toHaveProperty('device.ext');
    expect(req).toHaveProperty('device.ext.sdk_versions');

    expect(req).toHaveProperty('imp');
    expect(req.imp).toHaveLength(1);
    expect(req).toHaveProperty(['imp', 0, 'id']);
    expect(req).toHaveProperty(['imp', 0, 'secure']);
    expect(req).toHaveProperty(['imp', 0, 'ext']);
    expect(req).toHaveProperty(['imp', 0, 'ext', 'adspot_id'], 1);
    expect(req).toHaveProperty(['imp', 0, 'ext', 'json']);

    expect(req).toHaveProperty('site');
    expect(req).toHaveProperty('site.page');
    expect(req).toHaveProperty('site.ref');
  });

  test('happy path: calls setXXX()', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');

    ad.setImpId('test-imd-1');
    ad.setGenre({ master_id: 1, code: '12345', match: 'children' } as Genre);
    ad.setTargeting('k1', 'v1');
    ad.setTargeting('k2', 'v2');
    ad.setIFA('test-ifa');
    ad.setRz('test-rz');
    ad.setBlockedAdvertiser([1, 2, 3]);
    ad.setHashedEasyId('test-hashedeasyid');
    ad.setHashedEmail('test-hashedemail');

    const ext = tag.getExt(ad);
    const req = createBidRequest([ad], ext);

    // test
    expect(req.imp).toHaveLength(1);
    expect(req).toHaveProperty(['imp', 0, 'id'], 'test-imd-1');
    expect(req).toHaveProperty(
      ['imp', 0, 'ext', 'json', 'genre', 'master_id'],
      1
    );
    expect(req).toHaveProperty(
      ['imp', 0, 'ext', 'json', 'genre', 'code'],
      '12345'
    );
    expect(req).toHaveProperty(
      ['imp', 0, 'ext', 'json', 'genre', 'match'],
      'children'
    );
    expect(req).toHaveProperty(
      ['imp', 0, 'ext', 'json', 'targeting', 'k1'],
      ['v1']
    );
    expect(req).toHaveProperty(
      ['imp', 0, 'ext', 'json', 'targeting', 'k2'],
      ['v2']
    );
    expect(req).toHaveProperty('device.ifa', 'test-ifa');
    expect(req).toHaveProperty('ext.badvid', [1, 2, 3]);
    expect(req).toHaveProperty('user.ext.rz', 'test-rz');
    expect(req).toHaveProperty('user.ext.hashedeasyid', 'test-hashedeasyid');
    expect(req).toHaveProperty('user.ext.hashedemail', 'test-hashedemail');
  });
});

describe('getQueryParams()', () => {
  beforeAll(() => {
    global.window = Object.create(window) as Window & typeof globalThis;
    Object.defineProperty(window, 'location', {
      value: { search: '' },
    });
  });

  afterAll(() => {
    window.location.search = '';
  });

  test('happy path: default value', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    const page = tag._state.page;

    const qs = getQueryParams([ad], page);

    expect(qs).toEqual({} as QueryParams);
  });

  test('happy path: with debug', () => {
    window.location.search = 'rad_hash=xxxxx';

    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    ad.setDebug(true);
    const page = tag._state.page;

    const qs = getQueryParams([ad], page);

    expect(qs).toHaveProperty('debug', '1');
    expect(qs).toHaveProperty('rad_hash', 'xxxxx');
  });
});

describe('getAdRequestURL()', () => {
  beforeAll(() => {
    global.window = Object.create(window) as Window & typeof globalThis;
    Object.defineProperty(window, 'location', {
      value: { search: '' },
    });
  });

  afterAll(() => {
    window.location.search = '';
  });

  test('happy path: default value', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    const page = tag._state.page;

    const reqURL = getAdRequestURL(getQueryParams([ad], page));

    expect(reqURL).toEqual('');
  });

  test('happy path: with debug', () => {
    window.location.search = 'rad_hash=xxxxx';

    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    ad.setDebug(true);
    const page = tag._state.page;

    const reqURL = getAdRequestURL(getQueryParams([ad], page));
    expect(reqURL).toEqual('?debug=1&rad_hash=xxxxx');
  });
});

describe('handle ad response', () => {
  let bannerJSON: BidResponse;
  let unfilledJSON: BidResponse;
  let singleRequestJSON: BidResponse;

  beforeAll(() => {
    bannerJSON = JSON.parse(
      fs.readFileSync(path.resolve('./src/tests/testdata/banner.json'), 'utf8')
    ) as BidResponse;
    unfilledJSON = JSON.parse(
      fs.readFileSync(
        path.resolve('./src/tests/testdata/unfilled.json'),
        'utf8'
      )
    ) as BidResponse;
    singleRequestJSON = JSON.parse(
      fs.readFileSync(
        path.resolve('./src/tests/testdata/single_request.json'),
        'utf8'
      )
    ) as BidResponse;
  });

  test('happy path: isBidResponse()', () => {
    expect(isBidResponse(bannerJSON)).toEqual(true);
    expect(isBidResponse(unfilledJSON)).toEqual(true);
    expect(isBidResponse(singleRequestJSON)).toEqual(true);
  });

  test('happy path: makeBannerResponse()', () => {
    const banner = makeBannerResponse(bannerJSON.seatbid?.[0]?.bid?.[0] ?? {});
    expect(banner.html).not.toEqual('');
    expect(banner.width).toEqual(300);
    expect(banner.height).toEqual(250);

    const unfilled = makeBannerResponse(
      unfilledJSON.seatbid?.[0]?.bid?.[0] ?? {}
    );
    expect(unfilled.html).not.toEqual('');
    expect(unfilled.width).toEqual(1);
    expect(unfilled.height).toEqual(1);

    const singleReq = makeBannerResponse(
      singleRequestJSON.seatbid?.[0]?.bid?.[0] ?? {}
    );
    expect(singleReq.html).not.toEqual('');
    expect(singleReq.width).toEqual(300);
    expect(singleReq.height).toEqual(250);
  });

  test('happy path: getViewabilityMetrics()', () => {
    const bannerMetrics = getViewabilityMetrics(
      bannerJSON.seatbid?.[0]?.bid?.[0]
    );

    expect(bannerMetrics).not.toEqual(undefined);
    expect(bannerMetrics?.inviewURL).toEqual(
      'https://dev-s-evt.rmp.rakuten.co.jp/inview?dat=xxxxx&cachebuster=5593616871380063942'
    );

    const unfilledMetrics = getViewabilityMetrics(
      unfilledJSON.seatbid?.[0]?.bid?.[0]
    );
    expect(unfilledMetrics).toEqual(undefined);
  });

  test('happy path: getAdvID()', () => {
    const bannerAdvID = getAdvID(bannerJSON.seatbid?.[0]?.bid?.[0]);
    expect(bannerAdvID).toEqual(110);

    const unfilledAdvID = getAdvID(unfilledJSON.seatbid?.[0]?.bid?.[0]);
    expect(unfilledAdvID).toEqual(undefined);
  });

  test('happy path: makeRenderableAd()', () => {
    document.body.innerHTML = `
    <div id="adspot-1"></div>
    <div id="adspot-2"></div>
    <div id="adspot-3"></div>
    `;

    const tag = new RDN();
    const ad = tag.defineAd(1, 'adspot-1');

    // banner
    const impID = 'impid01';
    ad.setImpId(impID);

    const bannnerAd = makeRenderableAd(ad, bannerJSON);
    expect(bannnerAd).toHaveProperty('impId', impID);
    expect(bannnerAd).toHaveProperty('response.width', 300);
    expect(bannnerAd).toHaveProperty('response.height', 250);
    expect(bannnerAd).toHaveProperty(
      'viewability.inviewURL',
      'https://dev-s-evt.rmp.rakuten.co.jp/inview?dat=xxxxx&cachebuster=5593616871380063942'
    );
    expect(bannnerAd).toHaveProperty('advID', 110);
    expect(bannnerAd?.el).not.toEqual(undefined);
    expect(bannnerAd?.response.html).not.toEqual('');

    // unfilled
    const unfilledImpID = 'unfilled-id';
    ad.setImpId(unfilledImpID);
    const unfilledAd = makeRenderableAd(ad, unfilledJSON);
    expect(unfilledAd).toHaveProperty('impId', unfilledImpID);
    expect(unfilledAd).toHaveProperty('response.width', 1);
    expect(unfilledAd).toHaveProperty('response.height', 1);
    expect(unfilledAd?.viewability).toEqual(undefined);
    expect(unfilledAd?.advID).toEqual(undefined);
    expect(unfilledAd?.el).not.toEqual(undefined);
    expect(unfilledAd?.response.html).not.toEqual('');

    // single request
    const singleTag = new RDN();
    singleTag
      .defineAd(1, 'adspot-1')
      .setImpId('single-request-1')
      .enableSingleRequest();
    singleTag
      .defineAd(2, 'adspot-2')
      .setImpId('single-request-2')
      .enableSingleRequest();
    const singleAd = singleTag
      .defineAd(3, 'adspot-3')
      .setImpId('single-request-3')
      .enableSingleRequest();

    const singleReqAd = makeRenderableAd(singleAd, singleRequestJSON); // set 3rd Ad
    expect(singleReqAd).toHaveProperty('impId', 'single-request-3');
    expect(singleReqAd).toHaveProperty('response.width', 1);
    expect(singleReqAd).toHaveProperty('response.height', 1);
    expect(singleReqAd?.viewability).toEqual(undefined);
    expect(singleReqAd?.advID).toEqual(undefined);
    expect(singleReqAd?.el).not.toEqual(undefined);
    expect(singleReqAd?.response.html).not.toEqual('');
  });
});
