import { ErrorLogger } from './lib/error-logger';
import { jsTag } from './types/error-log';

interface RetargetingWindow extends Window {
  rdnRetargetingParams?: OldRDNRetargetingParams;
  rdnActivityParams?: RDNRetargetingParams;
}

// MEMO: It would be deprecated after replaceing new one which uses `code`
interface OldRDNRetargetingParams {
  keys?: string[];
  retargetingID: number;
}

interface RDNRetargetingParams {
  keys?: string[];
  code: string;
}

declare let window: RetargetingWindow;

(function (): void {
  try {
    const baseURL = process.env.RETARGETING_ENDPOINT ?? '';
    let src = `${baseURL}`;
    if (window.rdnActivityParams) {
      const params = window.rdnActivityParams;
      src += `?code=${window.rdnActivityParams.code}&keys=${
        params.keys ? params.keys.join(',') : ''
      }`;
    } else if (window.rdnRetargetingParams) {
      const params = window.rdnRetargetingParams;
      src += `?id=${window.rdnRetargetingParams.retargetingID}&keys=${
        params.keys ? params.keys.join(',') : ''
      }`;
    }

    if (document.referrer) {
      src += `&refer=${encodeURIComponent(document.referrer)}`;
    }
    if (location.href) {
      src += `&page=${encodeURIComponent(location.href)}`;
    }
    new Image().src = src;
  } catch (err) {
    const logger = new ErrorLogger(jsTag.rtg);
    logger.logging(err as Error);
  }
})();
