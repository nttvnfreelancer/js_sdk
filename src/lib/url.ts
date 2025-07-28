import { isString } from '@src/lib/typeguard';

export interface QueryParams {
  [key: string]: string[] | string;
}

// parseQueryParams retrieves query parameters from a given specific url location.
// https://github.com/prebid/Prebid.js/blob/c202a13a0ec3df708dfeb944dc1358a58754c52c/src/url.js
export const parseQueryParams = (query: string): QueryParams => {
  return !query
    ? {}
    : query
        .replace(/^\?/, '')
        .split('&')
        .reduce((acc: QueryParams, criteria: string) => {
          const parts = criteria.split('=');
          let k = parts[0] ?? '';
          const v = parts[1] ?? '';
          if (/\[\]$/.test(k)) {
            k = k.replace('[]', '');
            acc[k] = acc[k] ?? [];
            if (acc[k] instanceof Array) {
              (acc[k] as string[]).push(v);
            }
          } else {
            acc[k] = v || '';
          }
          return acc;
        }, {});
};

export const encodeQueryParams = (data: QueryParams): string => {
  const ret = [];
  for (const d in data) {
    const vs = isString(data[d]) ? [data[d] as string] : data[d];
    for (const v of vs ?? []) {
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(v));
    }
  }
  return ret.join('&');
};
