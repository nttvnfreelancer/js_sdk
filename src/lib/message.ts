import { isString } from '@src/lib/typeguard';

export type AdMessage =
  | RegisterAdMessage
  | UnfilledMessage
  | ExpandAdMessage
  | OpenPopupAdMessage
  | CollapseAdMessage
  | IsVideoMessage
  | VideoLoadedMessage
  | ErrorAdMessage
  | ContentResizedMessage;

export interface RegisterAdMessage {
  type: 'register';
  vendor: 'rdn';
}

export interface UnfilledMessage {
  type: 'unfilled';
  vendor: 'rdn';
}

export interface ExpandAdMessage {
  type: 'expand';
  vendor: 'rdn';
}

export interface OpenPopupAdMessage {
  type: 'open_popup';
  vendor: 'rdn';
  url: string;
}

export interface CollapseAdMessage {
  type: 'collapse';
  vendor: 'rdn';
}

export interface IsVideoMessage {
  type: 'video';
  vendor: 'rdn';
}

export interface VideoLoadedMessage {
  type: 'video_loaded';
  vendor: 'rdn';
}

export interface ErrorAdMessage {
  type: 'js_error';
  vendor: 'rdn';
  message: string;
}

export interface ContentResizedMessage {
  type: 'content_resized';
  vendor: 'rdn';
}

export const isRegisterAdMessage = (v: AdMessage): v is RegisterAdMessage => {
  return v && v.type === 'register';
};

export const isExpandAdMessage = (v: AdMessage): v is ExpandAdMessage => {
  return v && v.type === 'expand';
};

export const isOpenPopupAdMessage = (v: AdMessage): v is OpenPopupAdMessage => {
  return v && v.type === 'open_popup' && v.url !== '';
};

export const isCollapseAdMessage = (v: AdMessage): v is CollapseAdMessage => {
  return v && v.type === 'collapse';
};

export const isUnfilledMessage = (v: AdMessage): v is UnfilledMessage => {
  return v && v.type === 'unfilled';
};

export const isErrorAdMessage = (v: AdMessage): v is ErrorAdMessage => {
  return v && v.type === 'js_error';
};

export const isContentResizedMessage = (
  v: AdMessage
): v is ContentResizedMessage => {
  return v && v.type === 'content_resized';
};

export const isAdMessage = (v: unknown): v is AdMessage => {
  const a = v as AdMessage;
  return a !== undefined && isString(a.vendor) && a.vendor === 'rdn';
};

export const sendMessage = (msg: AdMessage): void => {
  // For iOS
  if (isIosWindow(window)) {
    window.webkit.messageHandlers.runaSdkInterface.postMessage(msg);
    return;
  }
  // For Android
  if (isAndroidWindow(window)) {
    window.runaSdkInterface.postMessage(JSON.stringify(msg));
    return;
  }

  if (window.parent?.postMessage !== undefined) {
    window.parent.postMessage(msg, document.location.origin);
  }
};

interface IosWindow extends Window {
  webkit: {
    messageHandlers: {
      runaSdkInterface: {
        postMessage: (msg: unknown) => void;
      };
    };
  };
}

export function isIosWindow(v: Window): v is IosWindow {
  const w = v as IosWindow;
  return (
    w?.webkit?.messageHandlers?.runaSdkInterface?.postMessage !== undefined
  );
}

interface AndroidWindow extends Window {
  runaSdkInterface: {
    postMessage: (msg: string) => void;
  };
}

function isAndroidWindow(v: Window): v is AndroidWindow {
  const w = v as AndroidWindow;
  return w?.runaSdkInterface?.postMessage !== undefined;
}

export const sendMessageInBackground = (msg: AdMessage): void => {
  const timer = window.setTimeout(() => {
    sendMessage(msg);
    window.clearTimeout(timer);
  }, 0);
};
