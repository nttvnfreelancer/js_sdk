import { Targeting } from './targeting';
import { Genre } from '../types/genre';
import { KeyPairs } from '../types/targeting';
import Hex from 'crypto-js/enc-hex';
import md5 from 'crypto-js/md5';
import sha256 from 'crypto-js/sha256';
import { v4 as uuidv4 } from 'uuid';

export enum AdType {
  banner = 1,
  interstitial = 2,
}

export enum RenderStatus {
  NotYet = 'no',
  Queued = 'queued',
  Done = 'done',
  Failed = 'failed',
}

export class Ad {
  private readonly _elID: string;
  private readonly _adspotID?: number;
  private readonly _code?: string;
  private _responsive: boolean;
  private _flexible: boolean;
  private readonly _targeting: Targeting;
  private _type: AdType;
  private _genre: Genre;
  private _json?: unknown;
  private _impId: string;
  private _singleRequest: boolean;
  private _debug: boolean;
  private _ifa?: string;
  private _rz?: string;
  private _badv?: number[];
  private _hashedEasyId?: string;
  private _hashedEmail?: string;
  private _rpoint?: number;
  private _adspotBranchId?: number;

  public constructor(adspotID: number, elID: string, code?: string) {
    if (code) {
      this._code = code;
    } else {
      this._adspotID = adspotID;
    }
    this._elID = elID;
    this._responsive = false;
    this._flexible = false;
    this._targeting = new Targeting();
    this._type = AdType.banner;
    this._genre = {};
    this._impId = uuidv4();
    this._debug = false;
    this._singleRequest = false;
  }

  public get adspotID(): number | undefined {
    return this._adspotID;
  }

  public get code(): string | undefined {
    return this._code;
  }

  public get key(): string {
    return this._elID;
  }

  public setType(t: AdType): this {
    this._type = t;
    return this;
  }

  public getType(): AdType {
    return this._type;
  }

  public setResponsive(v: boolean): this {
    this._responsive = v;
    return this;
  }

  public getResponsive(): boolean {
    return this._responsive;
  }

  public setGenre(v: Genre): this {
    this._genre = v;
    return this;
  }

  public getGenre(): Genre {
    return this._genre;
  }

  public setJSON(v: unknown): this {
    this._json = v;
    return this;
  }

  public getJSON(): unknown {
    return this._json;
  }

  public setTargeting(key: string, value: string[] | string): this {
    this._targeting.set(key, value);
    return this;
  }

  public mergeTargetingMap(m: KeyPairs): this {
    this._targeting.mergeMap(m);
    return this;
  }

  public getTargetingMap(): Targeting {
    return this._targeting;
  }

  public getSortedTargetingMap(): Targeting {
    return Object.keys(this._targeting.values)
      .sort()
      .reduce((acc, key) => {
        const value = this._targeting.get(key);
        if (value) {
          acc.set(key, value);
        }
        return acc;
      }, new Targeting());
  }

  public isSingleRequest(): boolean {
    return this._singleRequest;
  }

  public enableSingleRequest(): this {
    this._singleRequest = true;
    return this;
  }

  public getImpId(): string {
    return this._impId;
  }

  // just for testing
  public setImpId(impId: string): this {
    this._impId = impId;
    return this;
  }

  public setDebug(debug: boolean): this {
    this._debug = debug;
    return this;
  }

  public getDebug(): boolean {
    return this._debug;
  }

  public setIFA(s: string): this {
    this._ifa = s;
    return this;
  }

  public getIFA(): string | undefined {
    return this._ifa;
  }

  public setRz(s: string): this {
    this._rz = s;
    return this;
  }

  public getRz(): string | undefined {
    return this._rz;
  }

  public setBlockedAdvertiser(badv: number[]): this {
    this._badv = badv;
    return this;
  }

  public getBlockedAdvertiser(): number[] | undefined {
    return this._badv;
  }

  /**
   * Get the Easy ID in hashed form.
   *
   * @returns The hashed Easy ID if present.
   */
  public getHashedEasyId(): string | undefined {
    return this._hashedEasyId;
  }

  /**
   * The a unhashed Easy ID. The value is immediately hashed internally to avoid exposure.
   *
   * @param id The cleartext Easy ID.
   * @returns The ad itself to allow method chaining.
   */
  public setEasyId(id: string): this {
    this._hashedEasyId = Hex.stringify(md5(id));
    return this;
  }

  /**
   * Set a pre-hashed Easy ID.
   *
   * @param id The hashed Easy ID.
   * @returns The ad itself to allow method chaining.
   */
  public setHashedEasyId(id: string): this {
    this._hashedEasyId = id;
    return this;
  }

  /**
   * Get the E-mail in hashed form.
   *
   * @returns The hased E-mail address if present.
   */
  public getHashedEmail(): string | undefined {
    return this._hashedEmail;
  }

  /**
   * Set a unhashed E-mail. The value is immediately hashed internally to avoid exposure.
   *
   * @param email The cleartext E-mail.
   * @returns The ad itself to allow method chaining.
   */
  public setEmail(email: string): this {
    this._hashedEmail = Hex.stringify(sha256(email));
    return this;
  }

  /**
   * Set a pre-hashed E-mail address.
   *
   * @param email The hashed E-mail.
   * @returns The ad itself to allow method chaining.
   */
  public setHashedEmail(email: string): this {
    this._hashedEmail = email;
    return this;
  }

  /**
   * Get Rakuten Point
   *
   * @returns User's Rakuten Point if present.
   */
  public getRPoint(): number | undefined {
    return this._rpoint;
  }

  /**
   * Set Rakuten Point
   *
   * @param point Rakuten Point
   * @returns The ad itself to allow method chaining.
   */
  public setRPoint(point: number): this {
    if (Number.isInteger(point) && point > 0) {
      this._rpoint = point;
    }
    return this;
  }

  /**
   * Get Adspot Branch ID
   *
   * @returns Adspot Branch ID.
   */
  public getAdspotBranchId(): number | undefined {
    return this._adspotBranchId;
  }

  /**
   * Set Adspot Branch ID
   *
   * @param id Adspot Branch ID
   */
  public setAdspotBranchId(id: number): this {
    if (Number.isInteger(id) && id > 0 && id < 21) {
      this._adspotBranchId = id;
    }
    return this;
  }

  /**
   * Tell whether this ad has any extra data set.
   *
   * @returns Whether extra data exists.
   */
  public hasExtData(): boolean {
    return (
      this._ifa !== undefined ||
      this._rz !== undefined ||
      this._badv !== undefined ||
      this._hashedEasyId !== undefined ||
      this._hashedEmail !== undefined ||
      this._rpoint !== undefined
    );
  }

  /**
   *  Tell whether flexible size mode enabled.
   *
   * @returns Whether flexible size mode enabled.
   */
  public getFlexible(): boolean {
    return this._flexible;
  }

  /**
   * Enable flexible size mode
   *
   * @param enabled Enable flexible size mode
   */
  public setFlexible(enabled: boolean): this {
    this._flexible = enabled;
    return this;
  }
}
