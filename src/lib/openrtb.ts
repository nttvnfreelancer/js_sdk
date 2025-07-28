import { Genre, isGenre } from '@src/types/genre';
import { KeyPairs } from '@src/types/targeting';
import {
  isArray,
  isNumber,
  isOptArray,
  isOptNumber,
  isOptString,
  isRecord,
  isString,
} from '@src/lib/typeguard';

export interface Regs {
  coppa?: number;
  ext?: unknown;
}

export interface Source {
  fd?: number;
  tid?: string;
  pchain?: string;
  ext?: unknown;
}

export interface User {
  id?: string;
  buyeruid?: string;
  yob?: number;
  gender?: string;
  keywords?: string;
  customdata?: string;
  geo?: Geo;
  data?: Data[];
  ext?: UserExt;
}

export interface UserExt {
  rz?: string;
  hashedemail?: string;
  hashedeasyid?: string;
  rpoint?: number;
}

export interface Geo {
  lat?: number;
  lon?: number;
  type?: number;
  accuracy?: number;
  lastfix?: number;
  ipservice?: number;
  country?: string;
  region?: string;
  regionfips104?: string;
  metro?: string;
  city?: string;
  zip?: string;
  utcoffset?: number;
  ext?: unknown;
}

export interface Device {
  ua?: string;
  geo?: Geo;
  dnt?: number;
  lmt?: number;
  ip?: string;
  ipv6?: string;
  devicetype?: number;
  make?: string;
  model?: string;
  os?: string;
  osv?: string;
  hwv?: string;
  h?: number;
  w?: number;
  ppi?: number;
  pxratio?: number;
  js?: number;
  geofetch?: number;
  flashver?: string;
  language?: string;
  carrier?: string;
  mccmnc?: string;
  connectiontype?: number;
  ifa?: string;
  didsha1?: string;
  didmd5?: string;
  dpidsha1?: string;
  dpidmd5?: string;
  macsha1?: string;
  macmd5?: string;
  ext?: unknown;
}

export interface App {
  id?: string;
  name?: string;
  bundle?: string;
  domain?: string;
  storeurl?: string;
  cat?: string[];
  sectioncat?: string[];
  pagecat?: string[];
  ver?: string;
  privacypolicy?: number;
  paid?: number;
  publisher?: Publisher;
  content?: Content;
  keywords?: string;
  ext?: unknown;
}

export interface Segment {
  id?: string;
  name?: string;
  value?: string;
  ext?: unknown;
}

export interface Data {
  id?: string;
  name?: string;
  segment?: Segment[];
  ext?: unknown;
}

export interface Producer {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: unknown;
}

export interface Content {
  id?: string;
  episode?: number;
  title?: string;
  series?: string;
  season?: string;
  artist?: string;
  genre?: string;
  album?: string;
  isrc?: string;
  producer?: Producer;
  url?: string;
  cat?: string[];
  prodq?: number;
  videoquality?: number;
  context: number;
  contentrating?: string;
  userrating?: string;
  qagmediarating?: number;
  keywords?: string;
  livestream?: number;
  sourcerelationship?: number;
  len?: number;
  language?: string;
  embeddable?: number;
  data?: Data[];
  ext?: unknown;
}

export interface Publisher {
  id?: string;
  name?: string;
  cat?: string[];
  domain?: string;
  ext?: unknown;
}

export interface Site {
  id?: string;
  name?: string;
  domain?: string;
  cat?: string[];
  sectioncat?: string[];
  pagecat?: string[];
  page?: string;
  ref?: string;
  search?: string;
  mobile?: number;
  privacypolicy?: number;
  publisher?: Publisher;
  content?: Content;
  keywords?: string;
  ext?: unknown;
}

export interface Deal {
  id?: string;
  bidfloor?: number;
  bidfloorcur?: string;
  at?: number;
  wseat?: string[];
  wadomain?: string[];
  ext?: unknown;
}

export interface PMP {
  private_auction?: number;
  deals?: Deal[];
  ext?: unknown;
}

export interface Native {
  request?: string;
  ver?: string;
  api?: number[];
  battr?: number[];
  ext?: unknown;
}

export interface Audio {
  mimes?: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  startdelay?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  delivery?: number[];
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  maxseq?: number;
  feed?: number;
  stitched?: number;
  nvol?: number;
  ext?: unknown;
}

export interface Video {
  mimes?: string[];
  minduration?: number;
  maxduration?: number;
  protocols?: number[];
  protocol?: number;
  w?: number;
  h?: number;
  startdelay?: number;
  placement?: number;
  linearity?: number;
  skip?: number;
  skipmin?: number;
  skipafter?: number;
  sequence?: number;
  battr?: number[];
  maxextended?: number;
  minbitrate?: number;
  maxbitrate?: number;
  boxingallowed?: number;
  playbackmethod?: number[];
  playbackend?: number;
  delivery?: number[];
  pos?: number;
  companionad?: Banner[];
  api?: number[];
  companiontype?: number[];
  ext?: unknown;
}

export interface Format {
  w?: number;
  h?: number;
  wratio?: number;
  hratio?: number;
  wmin?: number;
  ext?: unknown;
}

export interface Banner {
  format?: Format[];
  w?: number;
  h?: number;
  wmax?: number;
  hmax?: number;
  wmin?: number;
  hmin?: number;
  btype?: number[];
  battr?: number[];
  pos?: number;
  mimes?: string[];
  topframe?: number;
  expdir?: number[];
  api?: number[];
  id?: string;
  vcm?: number;
  ext?: unknown;
}

export interface Metric {
  type?: string;
  value?: number;
  vendor?: string;
  ext?: unknown;
}

export interface Imp {
  id?: string;
  metric?: Metric[];
  banner?: Banner;
  video?: Video;
  audio?: Audio;
  native?: Native;
  pmp?: PMP;
  displaymanager?: string;
  displaymanagerver?: string;
  instl?: number;
  tagid?: string;
  bidfloor?: number;
  bidfloorcur?: string;
  clickbrowser?: number;
  secure?: number;
  iframebuster?: string[];
  exp?: number;
  ext?: ImpExt;
}

export interface ImpExt {
  adspot_id?: number;
  code?: string;
  responsive?: true;
  json: ImpJsonExt;
  adspot_branch_id?: number;
}

export interface ImpJsonExt {
  genre?: Genre;
  targeting?: KeyPairs;
}

/** Type guard checking whether an unknown value has the structure of a ImpJsonExt. */
export function isImpJsonExt(v: unknown): v is ImpJsonExt {
  const i = v as ImpJsonExt;
  return (
    i !== undefined &&
    (i.genre === undefined || isGenre(i.genre)) &&
    (i.targeting === undefined || isKeyPairs(i.targeting))
  );
}

function isKeyPairs(v: unknown): v is KeyPairs {
  const k = v as KeyPairs;
  return (
    isRecord(k) && Object.keys(k).every((key) => isArray(k[key], isString))
  );
}

export interface BidRequest {
  id?: string;
  imp?: Imp[];
  site?: Site;
  app?: App;
  device?: Device;
  user?: User;
  test?: number;
  at?: number;
  tmax?: number;
  wseat?: string[];
  bseat?: string[];
  allimps?: number;
  cur?: string[];
  wlang?: string[];
  bcat?: string[];
  badv?: string[];
  bapp?: string[];
  source?: Source;
  regs?: Regs;
  ext?: RootExt;
}

export interface RootExt {
  badvid?: number[];
}

export interface Bid {
  id?: string;
  impid?: string;
  price?: number;
  nurl?: string;
  burl?: string;
  lurl?: string;
  adm?: string;
  adid?: string;
  adomain?: string[];
  bundle?: string;
  iurl?: string;
  cid?: string;
  crid?: string;
  tactic?: string;
  cat?: string[];
  attr?: number[];
  api?: number;
  protocol?: number;
  qagmediarating?: number;
  language?: string;
  dealid?: string;
  w?: number;
  h?: number;
  wratio?: number;
  hratio?: number;
  exp?: number;
  ext?: BidExt;
}

function isBid(v: unknown): v is Bid {
  const b = v as Bid;
  return (
    b !== undefined &&
    isOptString(b.id) &&
    isOptString(b.impid) &&
    isOptNumber(b.price) &&
    isOptString(b.nurl) &&
    isOptString(b.burl) &&
    isOptString(b.lurl) &&
    isOptString(b.adm) &&
    isOptString(b.adid) &&
    isOptArray(b.adomain, isString) &&
    isOptString(b.bundle) &&
    isOptString(b.iurl) &&
    isOptString(b.cid) &&
    isOptString(b.crid) &&
    isOptString(b.tactic) &&
    isOptArray(b.cat, isString) &&
    isOptArray(b.attr, isNumber) &&
    isOptNumber(b.api) &&
    isOptNumber(b.protocol) &&
    isOptNumber(b.qagmediarating) &&
    isOptString(b.language) &&
    isOptString(b.dealid) &&
    isOptNumber(b.w) &&
    isOptNumber(b.h) &&
    isOptNumber(b.wratio) &&
    isOptNumber(b.hratio) &&
    isOptNumber(b.exp) &&
    (b.ext === undefined || isBidExt(b.ext))
  );
}

export interface BidExt {
  advid?: number;
  measured_url?: string;
  inview_url?: string;
}

function isBidExt(v: unknown): v is BidExt {
  const e = v as BidExt;
  return (
    e !== undefined &&
    isOptNumber(e.advid) &&
    isOptString(e.measured_url) &&
    isOptString(e.inview_url)
  );
}

export interface SeatBid {
  bid?: Bid[];
  seat?: string;
  group?: number;
  ext?: unknown;
}

function isSeatBid(v: unknown): v is SeatBid {
  const b = v as SeatBid;
  return (
    b !== undefined &&
    isOptArray(b.bid, isBid) &&
    isOptString(b.seat) &&
    isOptNumber(b.group)
  );
}

export interface BidResponse {
  id?: string;
  seatbid: SeatBid[];
  bidid?: string;
  cur?: string;
  customdata?: string;
  nbr?: number;
  ext?: unknown;
}

/** Type guard checking whether an unknown value has the structure of a BidResponse. */
export function isBidResponse(v: unknown): v is BidResponse {
  const r = v as BidResponse;
  return (
    r !== undefined &&
    isOptString(r.id) &&
    isArray(r.seatbid, isSeatBid) &&
    isOptString(r.bidid) &&
    isOptString(r.cur) &&
    isOptString(r.customdata) &&
    isOptNumber(r.nbr)
  );
}

export interface BidrequestExt {
  ifa?: string;
  rz?: string;
  badvid?: number[];
  hashedeasyid?: string;
  hashedemail?: string;
  rpoint?: number;
}
