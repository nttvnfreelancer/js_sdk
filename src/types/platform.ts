export const Platform = {
  Web: 'Web',
  iOS: 'iOS',
  Android: 'Android',
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];
