import 'whatwg-fetch';
import { h, render } from 'preact';
import { VideoPlayer } from './tag/video';

import {
  RDNContentWindow,
  ContentDefinition,
  ContentIframeWindow,
} from './types/contents';
import {
  isAdMessage,
  isExpandAdMessage,
  isOpenPopupAdMessage,
  ExpandAdMessage,
  OpenPopupAdMessage,
  sendMessage,
  sendMessageInBackground,
  CollapseAdMessage,
  RegisterAdMessage,
  UnfilledMessage,
  ErrorAdMessage,
  isErrorAdMessage,
  AdMessage,
  ContentResizedMessage,
} from './lib/message';
import { parseVAST, vast2VideoProps, VIDEO_WRAPPER_ID } from './lib/vast';
import {
  renderIFrameContent,
  createIFrame,
  renderHTMLContent,
} from './lib/dom';
import { ErrorLogger } from './lib/error-logger';
import { jsTag } from './types/error-log';

declare let window: RDNContentWindow;

const FailureTimeout = 10 * 1000;

export class ContentDelivery {
  private cd: ContentDefinition;
  private iframe?: HTMLIFrameElement;
  private expanded = false;
  private failureChecker?: number;
  private msgEventAdded = false;

  public constructor(cd: ContentDefinition) {
    this.cd = cd;
  }

  public render(): void {
    try {
      sendMessage({
        vendor: 'rdn',
        type: 'register',
      } as RegisterAdMessage);
      if (this.cd.unfilled === true) {
        sendMessageInBackground({
          vendor: 'rdn',
          type: 'unfilled',
        } as UnfilledMessage);
        return;
      }
      const target = document.getElementById(this.cd.id);
      if (!target || this.expanded) {
        return;
      }
      this.startMessageListener();
      this.startFailureChecker();
      this.startErrorListner();

      // fetch this.cd.src
      fetch(this.cd.src, {
        mode: 'cors',
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache',
      })
        .then((resp) => {
          if (resp.status === 200) return resp.text();
          throw new Error(`response status is ${resp.status}`);
        })
        .then((html) => {
          let doc: HTMLDocument | null = null;
          if (window.renderWithoutIframe) {
            doc = renderHTMLContent(target, html);
          } else {
            this.iframe = createIFrame(target);
            doc = renderIFrameContent(this.iframe, html);
          }

          // If the creative has images or the logic to resize the content, SDK should resize outer iframe depending on them in Flexible mode
          const rootEl = doc?.documentElement;
          if (rootEl) {
            new ResizeObserver(() => {
              sendMessage({
                vendor: 'rdn',
                type: 'content_resized',
              } as ContentResizedMessage);
            }).observe(rootEl);
          }

          // Display a video player if it gets a video creative
          if (doc) {
            const contentWindow = doc.defaultView as ContentIframeWindow;
            if (contentWindow.vast) {
              // MEMO: To call `sendViewable` from an external window
              window.cd = this;
              // MEMO: To notify a content includes video for App
              sendMessage({ type: 'video', vendor: 'rdn' });

              void parseVAST(contentWindow.vast).then((res) => {
                if (doc?.getElementById(VIDEO_WRAPPER_ID)) {
                  const videoWrapper = doc.getElementById(VIDEO_WRAPPER_ID);
                  if (videoWrapper) {
                    const props = {
                      ...vast2VideoProps(res),
                    };
                    render(
                      <VideoPlayer {...props} />,
                      doc.getElementById(VIDEO_WRAPPER_ID) as Element
                    );
                  }
                }
              });
            }

            if (doc) {
              doc.close();
              // this.expanded = true;
              // sendMessage({ vendor: 'rdn', type: 'expand' } as ExpandAdMessage);
            }
          }
        })
        .catch((err) => {
          sendMessage({
            type: 'js_error',
            vendor: 'rdn',
            message: (err as Error).message,
          } as ErrorAdMessage);
        });
    } catch (err) {
      sendMessage({
        type: 'js_error',
        vendor: 'rdn',
        message: (err as Error).message,
      } as ErrorAdMessage);
    }
  }

  public sendViewable(inview: boolean): void {
    if (inview) {
      const playE = new CustomEvent('play');
      window.dispatchEvent(playE);
    } else {
      const pauseE = new CustomEvent('pause');
      window.dispatchEvent(pauseE);
    }
  }

  private startMessageListener(): void {
    // A script will be attached to `cd.url` to trigger a ExpandAdMessage
    // when the content loaded,
    // then `cd` will populate it to upper window to handle it.
    // Only the expanded script will be displated by `aa.js` tag.

    if (this.msgEventAdded) {
      return;
    }

    window.addEventListener(
      'message',
      (e) => {
        if (isAdMessage(e.data)) {
          if (isExpandAdMessage(e.data) && !this.expanded) {
            // populate `expand` message to upper layer iframes
            if (this.iframe) {
              this.iframe.width = '100%';
              this.iframe.height = '100%';
            }
            try {
              this.expanded = true;
              sendMessage({ vendor: 'rdn', type: 'expand' } as ExpandAdMessage);
            } catch (e) {}
          } else if (
            isOpenPopupAdMessage(e.data) &&
            this.expanded &&
            this.iframe
          ) {
            try {
              sendMessage({
                vendor: 'rdn',
                type: 'open_popup',
                url: e.data.url,
              } as OpenPopupAdMessage);
            } catch (e) {}
          }
        }
      },
      false
    );
    this.msgEventAdded = true;
  }

  private startFailureChecker(): void {
    if (this.failureChecker) {
      return;
    }
    this.failureChecker = window.setTimeout(() => {
      if (!this.expanded) {
        sendMessage({ vendor: 'rdn', type: 'collapse' } as CollapseAdMessage);
      }
      window.clearTimeout(this.failureChecker);
    }, FailureTimeout);
  }

  private startErrorListner(): void {
    window.addEventListener(
      'message',
      (e) => {
        if (isErrorAdMessage(e.data as AdMessage)) {
          sendMessage({
            type: 'js_error',
            vendor: 'rdn',
            message: e.data.message,
          } as ErrorAdMessage);
        }
      },
      false
    );
  }
}

export class OuterContent {
  private readonly adm: string;
  private expanded = false;
  private readonly _logger: ErrorLogger;

  public constructor(adm: string) {
    this.adm = adm;
    this._logger = new ErrorLogger(jsTag.cd);
  }

  public render(): void {
    try {
      if (this.adm === '') {
        return;
      }

      if (this.expanded) {
        return;
      }

      const iframe = createIFrame(document.body);
      const adm = decodeURIComponent(this.adm);

      const doc = renderIFrameContent(iframe, adm);

      // If the creative has images or the logic to resize the content, SDK should resize outer iframe depending on them in Flexible mode
      const rootEl = doc?.documentElement;
      if (rootEl) {
        new ResizeObserver(() => {
          sendMessage({
            vendor: 'rdn',
            type: 'content_resized',
          } as ContentResizedMessage);
        }).observe(rootEl);
      }

      if (doc) {
        doc.close();
        this.expanded = true;
        sendMessage({ vendor: 'rdn', type: 'expand' } as ExpandAdMessage);
      }
    } catch (err) {
      this._logger.logging(err as Error);
    }
  }
}

// render content delivery by settings
// ContentDelivery.js switch rendering mode by the `window.rdncd` global variable.
const execute = (): void => {
  if (window.rdncd) {
    const cd = new ContentDelivery(window.rdncd);
    cd.render();
  } else if (window.rdnadm) {
    const na = new OuterContent(window.rdnadm);
    na.render();
  }
};

// Note: Android/webview can't use document.body until DOMContentLoaded is called,
// However, web browser can't detect event DOMContentLoaded
const watchDocumentState = (): void => {
  const intervalID = window.setInterval(() => {
    if (document.readyState === 'complete') {
      execute();
      window.clearInterval(intervalID);
    }
  }, 50);
};

watchDocumentState();
