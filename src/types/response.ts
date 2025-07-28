import { SafeFrame } from '@src/lib/safeframe';

export interface BannerAdResponse {
  html: string;
  width: number;
  height: number;
}

export type AdResponse = BannerAdResponse;

export interface RenderableAd {
  impId: string;
  el: HTMLElement;
  response: AdResponse;
  viewability?: ViewabilityMetrics;
  sessionID?: string;
  safeiframe?: SafeFrame;
  advID?: number;
  originalLeftOffset?: number;
}

export interface ViewabilityMetrics {
  inviewURL: string;
}
