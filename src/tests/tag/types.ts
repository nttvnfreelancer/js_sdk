import { BidrequestExt } from '@src/lib/openrtb';
import { Ad } from '@src/tag/ad';
import { State } from '@src/tag/state';
import { RDN } from '@src/tag/tag';

/**
 * A special version of RDN that exposes the private properties and methods used in tests.
 *
 * Warning: This is unsafe as it relies on compiler details. Should the compiler ever change the
 * handling of private method (for example with name-mangling), then this would immediately break.
 *
 * For the future it would be better to restructure the RDN object into a more testable version.
 */
interface TestRDN {
  readonly _state: State;
  defineAd: (id: number, elID: string) => Ad;
  fetchAds: (key: string | undefined, fn: () => void) => void;
  getExt: (ad: Ad | undefined) => BidrequestExt;
}

/** Create a new instance of RDN but with private properties and methods exposed. */
export function newRDN(): TestRDN {
  return new RDN() as unknown as TestRDN;
}
