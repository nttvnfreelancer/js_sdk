export interface VideoPlayerProps {
  files: VideoFile[];
  events: TrackingEvent[];
  duration: number;
  isApp: boolean;
}

export interface VideoPlayerState {
  muted: boolean;
  videoStatus: VideoStatus;
  current: number;
  controledPause: boolean;
  trackings: Tracking[];
}

export enum VideoStatus {
  Loaded,
  Playing,
  Paused,
  Ended,
}

export interface VideoFile {
  src: string;
  type: string;
  width: number;
  height: number;
}

export interface TrackingEvent {
  type: TrackingEventType;
  urls: string[];
}

export type TrackingEventType =
  | 'start'
  | 'firstQuartile'
  | 'midpoint'
  | 'thirdQuartile'
  | 'complete';

export interface Tracking {
  type: TrackingEventType;
  duration: number;
  urls: string[];
  requested: boolean;
}

export const VideoRatio = {
  landscape: 'LandScape',
  portrait: 'Portrait',
  spuare: 'Spuare',
} as const;

export type VideoRatio = (typeof VideoRatio)[keyof typeof VideoRatio];
