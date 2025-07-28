import { isString } from '@src/lib/typeguard';
import { parseQueryParams } from '@src/lib/url';

export interface PreviewSettings {
  hash?: string;
}

export class Page {
  public preview?: PreviewSettings;
  public constructor() {
    this.preview = getPreviewParams();
  }
}

// getPreviewParames
export const getPreviewParams = (): PreviewSettings | undefined => {
  const qs = parseQueryParams(location.search);
  if (!qs) {
    return undefined;
  }
  const radHash = qs['rad_hash'];
  const hash = isString(radHash) ? radHash.trim() : undefined;
  return {
    hash: hash,
  };
};
