import 'es6-promise/auto';
import { isString } from '@src/lib/typeguard';

import {
  ViewabilityMeasurer,
  ViewabilityMeasurerOptions,
} from './tag/viewability';

export interface VWWindow extends Window {
  rdnviewMount: (
    el: HTMLElement,
    opts?: ViewabilityMeasurerOptions
  ) => ViewabilityMeasurer;
  rdnviews?: unknown;
}
declare let window: VWWindow;
interface ViewabilityParameter {
  el: HTMLElement;
  inviewURL: string;
}

const isViewabilityParameter = (v: unknown): v is ViewabilityParameter => {
  const p = v as ViewabilityParameter;
  return (
    p?.el !== undefined && p.el instanceof HTMLElement && isString(p.inviewURL)
  );
};

const isViewabilityParams = (v: unknown): v is ViewabilityParameter[] => {
  return (
    v !== undefined && v instanceof Array && v.every(isViewabilityParameter)
  );
};

let interval: number;
const execute = (): void => {
  // Note: Android/webview can't use document.body until DOMContentLoaded is called,
  // However, web browser can't detect event DOMContentLoaded
  if (
    (document.readyState === 'interactive' ||
      document.readyState === 'complete') &&
    isViewabilityParams(window.rdnviews)
  ) {
    while (window.rdnviews.length) {
      const p = window.rdnviews.shift();
      if (p) {
        ViewabilityMeasurer.mount(p.el, {
          inviewURL: p.inviewURL,
        });
      }
    }
    window.clearInterval(interval);
  }
};

const watchDocumentState = (): void => {
  interval = window.setInterval(execute, 50);
  execute();
};
watchDocumentState();

// mount is enabled to be executed without pushing data into window.rdnviews for asynchronous access
window.rdnviewMount = ViewabilityMeasurer.mount;
