/**
 * handle any request logic
 */

import * as express from 'express';

interface AdRequest {
  imp?: [
    {
      ext?: {
        adspot_id?: string;
        code?: string;
      };
    },
  ];
}

export const getAdSpotID = (req: express.Request): number | undefined => {
  try {
    const body = req.body as AdRequest;
    const adspotID = parseInt(body.imp?.[0]?.ext?.adspot_id ?? '', 10);
    if (adspotID) {
      console.log('return adspot_id');
      return adspotID;
    }
  } catch (err) {}
  try {
    const body = req.body as AdRequest;
    const code = body.imp?.[0]?.ext?.code;
    if (code && code !== '') {
      console.log('return code');
      // for now, it converts to dummy adspot for just test
      return 1;
    }
  } catch (err) {}
  try {
    const t = parseInt(req.query['t'] as string, 10);
    if (t) {
      return t;
    }
  } catch (err) {}

  return undefined;
};
