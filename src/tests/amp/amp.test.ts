import '../utils/match-media-mock';
import { AmpContent } from '@src/amp';
import { executeAa } from '../utils/aa-executor';
import fetchMock from 'jest-fetch-mock';
import { startAdFetchMock } from '@src/tests/utils/fetch-mock';
import { waitIFrameElement } from '@src/tests/utils/dom';
import { BidRequest } from '@src/lib/openrtb';

const runaData = {
  id: '1',
  env: 'unittest',
  impid: 'impid01',
  genre: '{"master_id":1,"code":"100","match":"children"}',
  targeting: '{"k1":"dummy-key","k2":["male", "female"]}',
  ifa: 'test-ifa',
  rzcookie: 'test-rz',
  hashed_email: 'test-hashedemail',
  hashed_easyid: 'test-hashedeasyid',
  advids: '1,2,3',
  rpoint: 1234,
  adspot_branch_id: 1,
};

describe('execute()', () => {
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

      document.body.innerHTML = `<div id="c"></div>`;

      const runa = new AmpContent(runaData);
      runa.render();
      // execute entire code of aa.js without loading script
      executeAa();

      const iframe = await waitIFrameElement('div#rdn-adspot-1 iframe', 3);

      // test
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#adm123');

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
      expect(req).toHaveProperty(['imp', 0, 'ext', 'adspot_branch_id'], 1);
      expect(req).toHaveProperty(
        ['imp', 0, 'ext', 'json', 'genre', 'master_id'],
        1
      );
      expect(req).toHaveProperty(
        ['imp', 0, 'ext', 'json', 'genre', 'code'],
        '100'
      );
      expect(req).toHaveProperty(
        ['imp', 0, 'ext', 'json', 'genre', 'match'],
        'children'
      );
      expect(req).toHaveProperty(
        ['imp', 0, 'ext', 'json', 'targeting', 'k1'],
        ['dummy-key']
      );
      expect(req).toHaveProperty(
        ['imp', 0, 'ext', 'json', 'targeting', 'k2'],
        ['male', 'female']
      );
      expect(req).toHaveProperty('device.ifa', 'test-ifa');
      expect(req).toHaveProperty('ext.badvid', [1, 2, 3]);
      expect(req).toHaveProperty('user.ext.rz', 'test-rz');
      expect(req).toHaveProperty('user.ext.hashedeasyid', 'test-hashedeasyid');
      expect(req).toHaveProperty('user.ext.hashedemail', 'test-hashedemail');
      expect(req).toHaveProperty('user.ext.rpoint', 1234);
      // test response
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('adm-html');
    },
    5 * 1000
  );
  test(
    'invalid adspotBranchId',
    async () => {
      document.body.innerHTML = `<div id="c"></div>`;

      const withInvalidABI = Object.assign({}, runaData);
      withInvalidABI.adspot_branch_id = 9999;

      const runa = new AmpContent(withInvalidABI);
      runa.render();
      // execute entire code of aa.js without loading script
      executeAa();
      await waitIFrameElement('div#rdn-adspot-1 iframe', 3);
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
      expect(req).not.toHaveProperty(['imp', 0, 'ext', 'adspot_branch_id']);
    },
    5 * 1000
  );
});
