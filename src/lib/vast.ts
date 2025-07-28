import { VASTParser, VastResponse, VastCreativeLinear } from 'vast-client';
import {
  VideoPlayerProps,
  VideoFile,
  TrackingEvent,
  TrackingEventType,
} from '../types/video';
import { isApp } from './platform';

export const VIDEO_WRAPPER_ID = 'runa-video-wrapper';

export const parseVAST = (vast: string): Promise<VastResponse> => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(vast, 'text/xml');
  const vastParser = new VASTParser();
  return vastParser.parseVAST(xml);
};

export const vast2VideoProps = (vast: VastResponse): VideoPlayerProps => {
  const ad = vast.ads[0];
  if (!ad) {
    throw new Error('No ad in vast.');
  }
  const creative = ad.creatives[0] as VastCreativeLinear;
  const files: VideoFile[] = creative.mediaFiles.map((f) => ({
    src: f.fileURL ?? '',
    type: f.mimeType ?? '',
    width: f.width,
    height: f.height,
  }));
  const events: TrackingEvent[] = Object.keys(creative.trackingEvents)
    .filter((type) => isTrackingType(type))
    .map((type) => ({
      type: type as TrackingEventType,
      urls: creative.trackingEvents[type] ?? [],
    }));

  return {
    files,
    events,
    duration: creative.duration,
    isApp: isApp(),
  };
};

const isTrackingType = (type: string): type is TrackingEventType => {
  const types = [
    'start',
    'firstQuartile',
    'midpoint',
    'thirdQuartile',
    'complete',
  ];
  for (const ty of types) {
    if (type === ty) {
      return true;
    }
  }
  return false;
};
