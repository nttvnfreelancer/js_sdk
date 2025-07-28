import { sleep } from './timer';

export const waitIFrameElement = async (
  selector: string,
  timeout: number
): Promise<HTMLIFrameElement> => {
  let iframe: HTMLIFrameElement | null = null;
  for (let i = 0; i < timeout; i++) {
    iframe = document.querySelector(selector)!;
    if (iframe) {
      const iframeContent =
        iframe.contentDocument ?? iframe.contentWindow?.document;
      if (iframeContent?.readyState == 'complete') {
        return iframe;
      }
    }
    await sleep(1000);
  }
  return Promise.reject(new Error('not found'));
};
