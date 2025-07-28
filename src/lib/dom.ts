import { ErrorAdMessage, sendMessage } from './message';

const isIFrame = (w: Window): boolean => w !== window.top;
export function allIFrames(): Window[] {
  let i = 10;
  let w: Window = window;
  const res: Window[] = [];
  while (isIFrame(w) && i--) {
    res.push(w);
    w = w.parent;
  }
  return res;
}

// allWindows return all windows from window.self to window.top
export function allWindows(): Window[] {
  const frames = allIFrames();
  const res: Window[] = [];
  for (const w of frames) {
    res.push(w);
  }
  if (window.top) {
    res.push(window.top);
  }
  return res;
}

export const createIFrame = (
  appendedTarget: HTMLElement
): HTMLIFrameElement => {
  const iframe = document.createElement('iframe');
  iframe.width = '100%';
  iframe.height = '100%';
  iframe.frameBorder = '0';
  iframe.scrolling = 'no';
  iframe.marginHeight = '0';
  iframe.marginWidth = '0';
  //this code causes error on Safari
  //iframe.src = 'about:self';
  appendedTarget.appendChild(iframe);

  return iframe;
};

export const renderIFrameContent = (
  iframe: HTMLIFrameElement,
  content: string
): HTMLDocument | null => {
  let doc: HTMLDocument | null;
  try {
    doc = iframe.contentDocument;
  } catch (err) {
    doc = iframe.contentWindow
      ? (iframe.contentWindow.document as HTMLDocument)
      : null;
  }

  if (doc) {
    try {
      doc.open();
      doc.write(content);
      return doc;
    } catch (err) {
      sendMessage({
        type: 'js_error',
        vendor: 'rdn',
        message: (err as Error).message,
      } as ErrorAdMessage);
    }
  }
  return null;
};

export const renderHTMLContent = (
  target: HTMLElement,
  content: string
): HTMLDocument | null => {
  // FIXME: script tag added by innerHTML would not be fired, so creates new script tag and appends it.
  const contentDoc = new DOMParser().parseFromString(content, 'text/html');
  const scripts = [];
  for (const s of contentDoc.getElementsByTagName('script')) {
    const stag = document.createElement('script');
    stag.type = 'text/javascript';
    if (s.src.length > 0) {
      stag.src = s.src;
    }
    stag.innerHTML = s.innerHTML;
    scripts.push(stag);
  }

  const wrapper = document.createElement('div');
  wrapper.style.height = '100%';
  wrapper.style.width = '100%';
  wrapper.innerHTML = content;
  for (const s of scripts) {
    wrapper.appendChild(s);
  }

  target.appendChild(wrapper);

  return target.ownerDocument;
};
