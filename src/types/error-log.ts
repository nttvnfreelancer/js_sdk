export const jsTag = {
  aa: 'aa',
  cd: 'cd',
  vw: 'vw',
  amp: 'amp',
  rtg: 'rtg',
  activity: 'activity',
} as const;

export type JSTag = (typeof jsTag)[keyof typeof jsTag];

export enum DeviceType {
  MobileOrTablet = 1,
  PersonalComputer,
  ConnectedTV,
  Phone,
  Tablet,
  ConnectedDevice,
  SetTopBox,
}

export enum ConnectionType {
  Unknown,
  Ethernet,
  WiFi,
  CellularNetwork,
}

export interface NNavigator extends Navigator {
  connection: { type: string };
  mozConnection: { type: string };
  webkitConnection: { type: string };
}

export interface User {
  id?: string;
  ext: {
    rz?: string;
    hashedEmail?: string;
    hashedEasyId?: string;
  };
}

export interface Device {
  ua: string;
  model: undefined;
  build_name: undefined;
  type: DeviceType | undefined;
  ifa: string | undefined;
  lmt: number;
  os_version: string | undefined;
  connection_method: ConnectionType;
  w: number;
  h: number;
  ratio: number;
}

export interface AdspotIdInfo {
  adspot_id?: number;
  sr_adspot_ids?: number[];
}
