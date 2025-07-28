import 'es6-promise/auto';
import { RDNWindow, RDN, Command } from '@src/tag/tag';

/**
 * Note: this aa-executor.ts comes from src/aa.ts to run entire code without loading aa.js
 * If aa.ts is changed, same change is required on this code
 */

declare let window: RDNWindow;

export const executeAa = (): void => {
  window.rdntag = ((rdntag: RDN): RDN => {
    if (rdntag?.mounted) {
      return rdntag;
    }
    const tag = new RDN();
    const cmd: Command[] = rdntag?.cmd || [];

    tag.push(...cmd);
    return tag;
  })(window.rdntag);

  window.rdntag.execute();
};
