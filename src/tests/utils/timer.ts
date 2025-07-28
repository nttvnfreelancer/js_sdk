export const sleep = (timeout: number): Promise<unknown> =>
  new Promise((r) => setTimeout(r, timeout));
