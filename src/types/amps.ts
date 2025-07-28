import { Genre } from '@src/types/genre';
import { KeyPairs } from '@src/types/targeting';
import { RDN } from '@src/tag/tag';

// AmpDefinition has proper types converted from RunaDataObject
export interface AmpDefinition {
  id: string; // this id is used as code when iscode is true
  env: string;
  iscode?: boolean;
  impid?: string;
  genre?: Genre;
  targeting?: KeyPairs;
  ifa?: string;
  rzcookie?: string;
  email?: string;
  hashedEmail?: string;
  easyid?: string;
  hashedEasyid?: string;
  advIds?: number[];
  rpoint?: number;
  adspotBranchId?: number;
}

// RunaDataObject coming from rakutenunifiedads of amphtml
// any property has string type
// Note: this property name is influenced by name of data attribute `data-xxxx` in <amp-ad> element
export interface RunaDataObject {
  id: string;
  env: string;
  iscode?: string;
  impid?: string;
  genre?: string;
  targeting?: string;
  ifa?: string;
  rzcookie?: string;
  email?: string;
  hashed_email?: string;
  easyid?: string;
  hashed_easyid?: string;
  advids?: string;
  rpoint?: number;
  adspot_branch_id?: number;
}

export interface RDNAmpWindow extends Window {
  runa?: RunaDataObject;
  rdntag?: RDN;
  context?: RDNAmpWindowContext;
}

export interface RDNAmpWindowContext {
  renderStart: () => void;
}
