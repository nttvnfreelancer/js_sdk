import 'es6-promise/auto';

import { RDNWindow, RDN, Command } from './tag/tag';

declare let window: RDNWindow;

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

// this log would be removed on production environment
console.info(`[GIT REVISION] ${process.env.REVISION ?? ''}`);
