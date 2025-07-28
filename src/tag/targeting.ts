import { KeyPairs } from '../types/targeting';

export class Targeting {
  private _values: KeyPairs;
  public constructor(vs: KeyPairs = {}) {
    this._values = vs;
  }
  public get values(): KeyPairs {
    const obj: KeyPairs = {};
    for (const k of Object.keys(this._values)) {
      const newVal = this._values[k];
      if (newVal !== undefined) {
        obj[k] = newVal;
      }
    }
    return obj;
  }
  public get(key: string): string[] | undefined {
    return this._values[key];
  }
  public set(key: string, value: string[] | string): void {
    if (value instanceof Array) {
      this._values[key] = value;
    } else {
      this._values[key] = [value];
    }
  }

  public mergeMap(m: { [key: string]: string[] | string }): void {
    for (const k of Object.keys(m)) {
      const v = m[k];
      if (v) {
        this.set(k, v);
      }
    }
  }
}
