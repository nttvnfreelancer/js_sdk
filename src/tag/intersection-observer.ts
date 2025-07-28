import { isMobile } from '@src/lib/platform';
import { interval, animationFrameScheduler } from 'rxjs';

import { isSafeFrameWindow } from '../lib/safeframe';

export const lazyExecutor = (
  el: HTMLElement,
  percent: number,
  cb: () => void
): void => {
  const subscribe = interval(200, animationFrameScheduler).subscribe((_) => {
    const pos = { top: 0, bottom: 0 };
    pos.top += el.getBoundingClientRect().top;
    pos.bottom += el.getBoundingClientRect().bottom;

    const doc = el.ownerDocument;
    if (doc) {
      let currentWindow = doc.defaultView as Window | undefined;
      while (
        currentWindow?.frameElement !== undefined &&
        currentWindow?.frameElement !== null &&
        window.top !== currentWindow
      ) {
        pos.top += currentWindow.frameElement.getBoundingClientRect().top;
        pos.bottom += currentWindow.frameElement.getBoundingClientRect().bottom;
        currentWindow = currentWindow.parent;
      }
    }
    if (window.top) {
      const td = pos.top - window.top.innerHeight;
      const ih = window.top.innerHeight * (percent / 100);
      if (Math.abs(td) < ih || Math.abs(pos.bottom) < ih) {
        cb();
        subscribe.unsubscribe();
      }
    }
  });
};

export const inview = (
  el: HTMLElement,
  th: number,
  inViewCb: () => void,
  outViewCb?: () => void
): void => {
  interval(200, animationFrameScheduler).subscribe((_) => {
    const pos = { top: 0, bottom: 0, left: 0, right: 0 };
    pos.top += el.getBoundingClientRect().top;
    pos.bottom += el.getBoundingClientRect().bottom;
    pos.left += el.getBoundingClientRect().left;
    pos.right += el.getBoundingClientRect().right;

    const doc = el.ownerDocument;
    if (doc) {
      let currentWindow = doc.defaultView as Window | undefined;
      while (
        currentWindow?.frameElement !== undefined &&
        currentWindow?.frameElement !== null &&
        window.top !== currentWindow
      ) {
        if (isSafeFrameWindow(currentWindow)) {
          break;
        }
        pos.top += currentWindow.frameElement.getBoundingClientRect().top;
        pos.left += currentWindow.frameElement.getBoundingClientRect().left;
        currentWindow = currentWindow.parent;
      }
      pos.bottom = pos.top + el.offsetHeight;
      pos.right = pos.left + el.offsetWidth;

      if (isSafeFrameWindow(currentWindow)) {
        if (
          currentWindow.$sf.ext.inViewPercentage() > th * 100 &&
          currentWindow.$sf.ext.winHasFocus()
        ) {
          inViewCb();
        } else if (outViewCb) {
          outViewCb();
        }
      } else if (window.top) {
        const ih = window.top.innerHeight;
        const iw = window.top.innerWidth;

        const verticalInview =
          (pos.top >= 0 &&
            pos.top <= ih - el.offsetHeight * th &&
            ih - pos.top >= 0) ||
          (pos.top < 0 && pos.bottom >= el.offsetHeight * th);

        const horizontalInview =
          (pos.left >= 0 &&
            el.offsetWidth * th <= iw - pos.left &&
            iw - pos.left >= 0) ||
          (pos.left < 0 && pos.right >= el.offsetWidth * th);
        const inview = verticalInview && horizontalInview;
        const isVisible = isMobile()
          ? inview
          : inview && window.top.document.hasFocus();
        if (isVisible) {
          inViewCb();
        } else if (outViewCb) {
          outViewCb();
        }
      }
    }
  });
};
