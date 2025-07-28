import { UAParser } from 'ua-parser-js';
import { Platform } from '../types/platform';

export const getPlatform = (): Platform | undefined => {
  const w = window as any;
  if (w.webkit != undefined) {
    if (w.webkit.messageHandlers.runaSdkInterface != undefined) {
      return Platform.iOS;
    }
  }
  if (w.runaSdkInterface != undefined) {
    return Platform.Android;
  }

  if (window.parent) {
    return Platform.Web;
  }
  return undefined;
};

export const isWeb = (): boolean => getPlatform() === Platform.Web;
export const isRUNAiOS = (): boolean => getPlatform() === Platform.iOS;
export const isRUNAAndroid = (): boolean => getPlatform() === Platform.Android;
export const isApp = (): boolean => isRUNAiOS() || isRUNAAndroid();
export const isMobile = (): boolean => {
  const uaParser = new UAParser(window.navigator.userAgent);
  return uaParser.getDevice()?.type === 'mobile';
};
