import 'url-search-params-polyfill';
import fetchMock, { MockResponseInit } from 'jest-fetch-mock';
import * as fs from 'fs';
import * as path from 'path';
import { BidRequest } from '@src/lib/openrtb';
// it returns 9999 when single request
const getAdSpotID = (body: BidRequest): number | undefined => {
  if (body?.imp && body?.imp?.length > 1) {
    // single request
    return 9999;
  }
  const adspotID = body?.imp?.[0]?.ext?.adspot_id;
  if (adspotID) {
    return adspotID;
  }
  return undefined;
};

const getParam = (urlString: string): string | null => {
  const searchParams = new URLSearchParams(urlString);
  return searchParams.get('http://example.com/cd-mock?dat');
};

export const startAdFetchMock = (): void => {
  const bannerJSON = fs.readFileSync(
    path.resolve('./src/tests/testdata/banner_dummy_adm.json'),
    'utf8'
  );
  const bannerJSON2 = fs.readFileSync(
    path.resolve('./src/tests/testdata/banner_dummy_adm2.json'),
    'utf8'
  );
  // for single request
  const bannerJSON9999 = fs.readFileSync(
    path.resolve('./src/tests/testdata/banner_dummy_adm9999.json'),
    'utf8'
  );
  const bannerMap = new Map<number, unknown>();
  bannerMap.set(1, bannerJSON);
  bannerMap.set(2, bannerJSON2);
  bannerMap.set(9999, bannerJSON9999);

  // mock server endpoint
  const adURL = `http://example.com/ad-mock`;
  process.env.AD_ENDPOINT = adURL;

  // mock setting
  fetchMock.enableMocks();
  fetchMock.mockResponse(
    (request: Request): Promise<MockResponseInit | string> => {
      // Note: not use request.json() for avoiding error
      return request.text().then((json) => {
        if (json) {
          const bidReq = JSON.parse(json) as BidRequest;
          const adspotID = getAdSpotID(bidReq);
          if (adspotID && bannerMap.has(adspotID)) {
            const respBanner = bannerMap.get(adspotID);
            return new Promise<MockResponseInit | string>((resolve) => {
              resolve(String(respBanner));
            });
          }
        }
        return new Promise<MockResponseInit | string>((resolve) => {
          resolve('{}');
        });
      });
    }
  );
};

export const startCdFetchMock = (): void => {
  const cdHTML = fs.readFileSync(
    path.resolve('./src/tests/testdata/cd_normal.html'),
    'utf8'
  );
  const cdMap = new Map<string, unknown>();
  cdMap.set('1', cdHTML);

  // mock server endpoint
  const adURL = `http://example.com/cd-mock`;
  process.env.AD_ENDPOINT = adURL;

  // mock setting
  fetchMock.enableMocks();
  fetchMock.mockResponse(
    (request: Request): Promise<MockResponseInit | string> => {
      const queryID = getParam(request.url);
      if (queryID && cdMap.has(queryID)) {
        const respCdHTML = cdMap.get(queryID);
        return new Promise<MockResponseInit | string>((resolve) => {
          resolve(String(respCdHTML));
        });
      }
      return new Promise<MockResponseInit | string>((resolve) => {
        resolve('');
      });
    }
  );
};
