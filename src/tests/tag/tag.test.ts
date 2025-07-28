import '../utils/match-media-mock';
import { RDN } from '../../tag/tag';
import { Genre } from '../../types/genre';
import { Targeting } from '../../tag/targeting';
import { newRDN } from './types';
import fetchMock from 'jest-fetch-mock';
import { startAdFetchMock } from '@src/tests/utils/fetch-mock';
import { waitIFrameElement } from '@src/tests/utils/dom';
import { BidRequest } from '@src/lib/openrtb';

describe('defineAd()', () => {
  test('happy path: default value', () => {
    const tag = new RDN();
    const ad = tag.defineAd(1, 'adspot-1');

    expect(ad.adspotID).toEqual(1);
    expect(ad.code).toEqual(undefined);
    expect(ad.key).toEqual('adspot-1');
    expect(ad.getDebug()).toEqual(false);
    expect(ad.isSingleRequest()).toEqual(false);
    expect(ad.getResponsive()).toEqual(false);
    expect(ad.getTargetingMap()).toEqual(new Targeting());
  });
});

describe('defineAdCode()', () => {
  test('happy path: default value', () => {
    const tag = new RDN();
    const ad = tag.defineAdCode('code', 'adspot-1');

    expect(ad.code).toEqual('code');
    expect(ad.adspotID).toEqual(undefined);
    expect(ad.key).toEqual('adspot-1');
    expect(ad.getDebug()).toEqual(false);
    expect(ad.isSingleRequest()).toEqual(false);
    expect(ad.getResponsive()).toEqual(false);
    expect(ad.getTargetingMap()).toEqual(new Targeting());
  });
});

describe('getExt()', () => {
  test('happy path: default value', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    ad.setIFA('test-ifa');
    ad.setRz('test-rz');
    ad.setBlockedAdvertiser([1, 2, 3]);
    ad.setHashedEasyId('test-hashedeasyid');
    ad.setHashedEmail('test-hashedemail');
    ad.setRPoint(1234);

    // access to private function
    const ext = tag.getExt(ad);
    expect(ext).toEqual({
      ifa: 'test-ifa',
      rz: 'test-rz',
      badvid: [1, 2, 3],
      hashedeasyid: 'test-hashedeasyid',
      hashedemail: 'test-hashedemail',
      rpoint: 1234,
    });
  });

  test('happy path: undefined parameter', () => {
    const tag = newRDN();

    // access to private function
    const ext = tag.getExt(undefined);
    expect(ext).toEqual({});
  });

  test('happy path: partial ad', () => {
    const tag = newRDN();
    const ad = tag.defineAd(1, 'adspot-1');
    ad.setIFA('test-ifa');
    ad.setRz('test-rz');

    // access to private function
    const ext = tag.getExt(ad);
    expect(ext).toEqual({
      ifa: 'test-ifa',
      rz: 'test-rz',
    });
  });
});

describe('fetchAds()', () => {
  test('happy path: default value', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    const tag = newRDN();

    const fn = (): void => {
      console.log(123);
    };
    tag.fetchAds('adspot-1', fn);

    // check fn() is called or not
    expect(consoleSpy).toHaveBeenCalledWith(123);
  });
});

describe('display()', () => {
  beforeAll(() => {
    startAdFetchMock();
  });

  afterAll(() => {
    fetchMock.mockReset();
    return;
  });

  test(
    'happy path',
    async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      // set dom
      document.body.innerHTML = `<div id="adspot-1"></div>`;

      // execute tag
      const tag = new RDN();
      const impID = 'impid01';
      tag.defineAd(1, 'adspot-1').setImpId(impID);
      tag.display('adspot-1');

      // FIXME:
      // using jsdom, some logic doesn't work
      // 1. this._state.findAdStateByWindow(e.source as Window) in waitForMessage() in tag.ts
      //  - condition `if (ads?.iframe?.contentWindow === w) ` doesn't match in findAdStateByWindow() due to dummy dom
      // 2. doc.write(content) in renderIFrameContent() is overwritten by next write method
      //  - in the end, dom content is replaced by renderViewablityMetrics()
      //  => fixed

      const iframe = await waitIFrameElement('div#adspot-1 iframe', 3);

      // test
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#adm123');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html');
    },
    5 * 1000
  );

  test(
    'happy path: multiple display',
    async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      // set dom
      document.body.innerHTML = `<div id="adspot-1"></div><div id="adspot-2"></div>`;

      // execute tag
      const tag = new RDN();
      const impID = 'impid01';
      tag.defineAd(1, 'adspot-1').setImpId(impID);
      tag.display('adspot-1');
      const impID2 = 'impid02';
      tag.defineAd(2, 'adspot-2').setImpId(impID2);
      tag.display('adspot-2');

      const iframe = await waitIFrameElement('div#adspot-1 iframe', 3);
      const iframe2 = await waitIFrameElement('div#adspot-2 iframe', 3);

      // test
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#adm123');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html');

      const iframeContent2 =
        iframe2?.contentDocument ?? iframe2?.contentWindow?.document;
      const div2 = iframeContent2?.querySelector('div#adm456');
      expect(div2).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html2');
    },
    5 * 1000
  );
});

describe('displayWithSingleRequest()', () => {
  beforeEach(() => {
    startAdFetchMock();
  });

  afterEach(() => {
    fetchMock.mockReset();
    return;
  });

  test(
    'happy path',
    async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      // set dom
      document.body.innerHTML = `<div id="adspot-1"></div><div id="adspot-2"></div>`;

      // execute tag
      const tag = new RDN();
      const impID = 'impid01';
      tag
        .defineAd(1, 'adspot-1')
        .setImpId(impID)
        .setGenre({ master_id: 1, code: '12345', match: 'children' } as Genre)
        .setTargeting('k1', 'v1')
        .setTargeting('k2', 'v2')
        .setIFA('test-ifa')
        .setRz('test-rz')
        .setBlockedAdvertiser([1, 2, 3])
        .setHashedEasyId('test-hashedeasyid')
        .setHashedEmail('test-hashedemail')
        .setRPoint(1234)
        .setAdspotBranchId(1)
        .enableSingleRequest();

      const impID2 = 'impid02';
      tag
        .defineAd(2, 'adspot-2')
        .setImpId(impID2)
        .setGenre({ master_id: 2, code: '77777', match: 'children2' } as Genre)
        .setTargeting('k3', 'v3')
        .setTargeting('k4', 'v4')
        .setIFA('test-ifa2')
        .setRz('test-rz2')
        .setBlockedAdvertiser([4, 5, 6])
        .setHashedEasyId('test-hashedeasyid2')
        .setHashedEmail('test-hashedemail2')
        .setRPoint(4567)
        .setAdspotBranchId(2)
        .enableSingleRequest();

      tag.displayWithSingleRequest();

      // FIXME:
      // using jsdom, some logic doesn't work
      // 1. this._state.findAdStateByWindow(e.source as Window) in waitForMessage() in tag.ts
      //  - condition `if (ads?.iframe?.contentWindow === w) ` doesn't match in findAdStateByWindow() due to dummy dom
      // 2. doc.write(content) in renderIFrameContent() is overwritten by next write method
      //  - in the end, dom content is replaced by renderViewablityMetrics()
      //  => fixed

      const iframe = await waitIFrameElement('div#adspot-1 iframe', 3);
      const iframe2 = await waitIFrameElement('div#adspot-2 iframe', 3);

      // test request
      expect(fetchMock.mock.calls.length).toEqual(1);
      expect(fetchMock.mock.calls[0]?.length).toEqual(2);
      let req: BidRequest | undefined;
      if (
        fetchMock.mock.calls.length != 0 &&
        fetchMock.mock.calls[0] != undefined &&
        fetchMock.mock.calls[0].length == 2
      ) {
        const body = fetchMock.mock.calls[0][1]?.body?.toString();
        if (body) req = JSON.parse(body) as BidRequest;
      }
      expect(req).toHaveProperty(['imp', 0, 'id'], 'impid01');
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
      expect(req).toHaveProperty(['imp', 0, 'ext', 'adspot_branch_id'], 1);
      expect(req).toHaveProperty('device.ifa', 'test-ifa');
      expect(req).toHaveProperty('ext.badvid', [1, 2, 3]);
      expect(req).toHaveProperty('user.ext.rz', 'test-rz');
      expect(req).toHaveProperty('user.ext.hashedeasyid', 'test-hashedeasyid');
      expect(req).toHaveProperty('user.ext.hashedemail', 'test-hashedemail');
      expect(req).toHaveProperty('user.ext.rpoint', 1234);
      expect(req).toHaveProperty(['imp', 1, 'id'], 'impid02');
      expect(req).toHaveProperty(
        ['imp', 1, 'ext', 'json', 'genre', 'master_id'],
        2
      );
      expect(req).toHaveProperty(
        ['imp', 1, 'ext', 'json', 'genre', 'code'],
        '77777'
      );
      expect(req).toHaveProperty(
        ['imp', 1, 'ext', 'json', 'genre', 'match'],
        'children2'
      );
      expect(req).toHaveProperty(
        ['imp', 1, 'ext', 'json', 'targeting', 'k3'],
        ['v3']
      );
      expect(req).toHaveProperty(
        ['imp', 1, 'ext', 'json', 'targeting', 'k4'],
        ['v4']
      );
      expect(req).toHaveProperty(['imp', 1, 'ext', 'adspot_branch_id'], 2);
      // test response
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#adm123');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html');

      const iframeContent2 =
        iframe2?.contentDocument ?? iframe2?.contentWindow?.document;
      const div2 = iframeContent2?.querySelector('div#adm456');
      expect(div2).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html2');
    },
    5 * 1000
  );

  test(
    'happy path: only first ad is enabled as single request',
    async () => {
      const consoleSpy = jest.spyOn(console, 'log');

      // set dom
      document.body.innerHTML = `<div id="adspot-1"></div><div id="adspot-2"></div>`;

      // execute tag
      const tag = new RDN();
      const impID = 'impid01';
      tag
        .defineAd(1, 'adspot-1')
        .setImpId(impID)
        .setGenre({ master_id: 1, code: '12345', match: 'children' } as Genre)
        .setTargeting('k1', 'v1')
        .setTargeting('k2', 'v2')
        .setIFA('test-ifa')
        .setRz('test-rz')
        .setBlockedAdvertiser([1, 2, 3])
        .setHashedEasyId('test-hashedeasyid')
        .setHashedEmail('test-hashedemail')
        .setRPoint(1234)
        .setAdspotBranchId(1)
        .enableSingleRequest();

      // don't call enableSingleRequest()
      const impID2 = 'impid02';
      tag.defineAd(2, 'adspot-2').setImpId(impID2);

      tag.displayWithSingleRequest();

      const iframe = await waitIFrameElement('div#adspot-1 iframe', 3);

      // test request
      expect(fetchMock.mock.calls.length).toEqual(1);
      expect(fetchMock.mock.calls[0]?.length).toEqual(2);
      let req: BidRequest | undefined;
      if (
        fetchMock.mock.calls.length != 0 &&
        fetchMock.mock.calls[0] != undefined &&
        fetchMock.mock.calls[0].length == 2
      ) {
        const body = fetchMock.mock.calls[0][1]?.body?.toString();
        if (body) req = JSON.parse(body) as BidRequest;
      }
      expect(req).toHaveProperty(['imp', 'length'], 1);
      expect(req).toHaveProperty(['imp', 0, 'id'], 'impid01');
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
      expect(req).toHaveProperty(['imp', 0, 'ext', 'adspot_branch_id'], 1);
      expect(req).toHaveProperty('device.ifa', 'test-ifa');
      expect(req).toHaveProperty('ext.badvid', [1, 2, 3]);
      expect(req).toHaveProperty('user.ext.rz', 'test-rz');
      expect(req).toHaveProperty('user.ext.hashedeasyid', 'test-hashedeasyid');
      expect(req).toHaveProperty('user.ext.hashedemail', 'test-hashedemail');
      expect(req).toHaveProperty('user.ext.rpoint', 1234);
      // test response
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#adm123');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html');
    },
    5 * 1000
  );
});
