import { ContentDelivery, OuterContent } from '@src/cd';
import fetchMock from 'jest-fetch-mock';
import { startCdFetchMock } from '@src/tests/utils/fetch-mock';
import { waitIFrameElement } from '@src/tests/utils/dom';
import * as fs from 'fs';
import * as path from 'path';

describe('ContentDelivery()', () => {
  beforeEach(() => {
    startCdFetchMock();
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
      document.body.innerHTML = `<div id="rdn-ad-12345" class="rdn-ad-main-content"></div>`;

      const cdObj = {
        src: 'http://example.com/cd-mock?dat=1',
        id: 'rdn-ad-12345',
      };
      const cd = new ContentDelivery(cdObj);
      cd.render();

      const iframe = await waitIFrameElement('div#rdn-ad-12345 iframe', 3);

      // test response
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#cd-12345');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('cd-html');
    },
    5 * 1000
  );

  test(
    'unfilled',
    async () => {
      // set dom
      document.body.innerHTML = `<div id="rdn-ad-12345" class="rdn-ad-main-content"></div>`;

      const cdObj = {
        src: 'http://example.com/cd-mock?dat=1',
        id: 'rdn-ad-12345',
        unfilled: true,
      };
      const cd = new ContentDelivery(cdObj);
      cd.render();

      let isError = false;
      const iframe = await waitIFrameElement(
        'div#rdn-ad-12345 iframe',
        3
      ).catch(() => (isError = true));

      // test response
      expect(iframe).toBe(true);
      expect(isError).toBe(true);
    },
    5 * 1000
  );
});
describe('OuterContent()', () => {
  let rastaHTML = '';

  beforeAll(() => {
    rastaHTML = fs.readFileSync(
      path.resolve('./src/tests/testdata/rasta_encoded.html'),
      'utf8'
    );
  });

  test(
    'happy path',
    async () => {
      // eslint-disable-next-line compat/compat
      window.ResizeObserver = jest.fn().mockImplementation(() => ({
        disconnect: jest.fn(),
        observe: jest.fn(),
      }));
      const consoleSpy = jest.spyOn(console, 'log');

      const oc = new OuterContent(rastaHTML);
      oc.render();

      const iframe = await waitIFrameElement('iframe', 3);

      // test response
      const iframeContent =
        iframe?.contentDocument ?? iframe?.contentWindow?.document;
      const div = iframeContent?.querySelector('div#baseContainer');
      expect(div).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('rasta-html');
    },
    5 * 1000
  );
});
