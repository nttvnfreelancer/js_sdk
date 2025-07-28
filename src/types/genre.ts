import { isOptNumber, isOptString } from '@src/lib/typeguard';

export interface Genre {
  master_id?: number;
  code?: string;
  match?: string;
}

export function isGenre(v: unknown): v is Genre {
  const g = v as Genre;
  return (
    g !== undefined &&
    isOptNumber(g.master_id) &&
    isOptString(g.code) &&
    isOptString(g.match)
  );
}
