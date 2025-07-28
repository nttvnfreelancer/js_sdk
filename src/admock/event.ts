/**
 * handle any event logic
 */

import * as express from 'express';
import {
  InViewAdEvent,
  ClickAdEvent,
  ContentDeliveryAdEvent,
  UnfilledAdEvent,
} from '../tests/utils/event';

export interface BaseEvents {
  sessionID: string;
  adspotID: number;
}

export const createBaseEvent = (req: express.Request): BaseEvents => {
  return {
    sessionID: req.query['session_id'] ? String(req.query['session_id']) : '',
    adspotID: parseInt(req.query['adspot_id'] as string, 10),
  };
};

export const createClickEvent = (req: express.Request): ClickAdEvent => {
  return {
    name: 'click',
    ...createBaseEvent(req),
  } as ClickAdEvent;
};

export const createUnfilledEvent = (req: express.Request): UnfilledAdEvent => {
  return {
    name: 'unfilled',
    ...createBaseEvent(req),
  } as UnfilledAdEvent;
};

export const createInviewEvent = (req: express.Request): InViewAdEvent => {
  return {
    name: 'inview',
    ...createBaseEvent(req),
  } as InViewAdEvent;
};

export const createContentDeliveryEvent = (
  req: express.Request
): ContentDeliveryAdEvent => {
  return {
    name: 'content-delivery',
    ...createBaseEvent(req),
  } as ContentDeliveryAdEvent;
};
