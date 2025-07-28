import Viewability from '../tag/viewability';
import { v4 as uuid } from 'uuid';

interface DebugVMWindow extends Window {
  DEBUG_ADSPOT_ID: number;
}
declare let window: DebugVMWindow;

const getDebugElements = (): HTMLElement[] => {
  const isHTMLElement = (e: Element): e is HTMLElement => {
    return e instanceof HTMLElement;
  };
  return [...document.querySelectorAll('div')].filter(
    (e) => isHTMLElement(e) && e.id.startsWith('rdn-')
  );
};

const ads = getDebugElements().map((e) => {
  const id = window.DEBUG_ADSPOT_ID;
  const m = Viewability.mount(e, {
    threshold: {
      ratio: 0.5,
      time: 1000,
    },
    inviewURL: `${process.env.DEBUG_DOMAIN ?? ''}/inview?adspot_id=${id}`,
  });
  const key = uuid();

  return { el: e, m, key, id };
});

// Findout the topeset window
let w = window as Window;
let i = 100;
while (i--) {
  if (w.top === w || i === 0) {
    break;
  }
  w = w.parent;
}

const debugDomain = process.env.DEBUG_DOMAIN ?? '';

const printInfo = (id: number, key: string, html: string): void => {
  try {
    w.postMessage({ id, key, html }, debugDomain);
  } catch (err) {
    console.error('cannot post message to parent window:', err);
  }
};

ads.forEach((ad) => {
  ad.m.distinctViewability$.subscribe((v) => {
    printInfo(
      ad.id,
      ad.key,
      `
    <p>ID: ${ad.id}, CVR: ${
      v.computedVisibleRatio
    } HD:${v.computed.isHidden.toString()}, ZM:${v.computed.zoom}, S:${
      v.computed.scale
    }, VR: ${v.intersectionObserverVisibleRatio}</p>
    `
    );
  });
});
