import Cookies from 'js-cookie';

export interface RunaABWindow extends Window {
  runaab: RunaAB;
}

export class RunaAB {
  private readonly _basedNumber: number;

  public constructor(basedNumber: number) {
    this._basedNumber = basedNumber;
  }

  /**
   * Gets index of ratio Array
   * @param targetNumber must be less this._basedNumber
   * @param ratios e.g. [1,1,2]
   * @returns index of ratio Array or undefined
   */
  public getIndexFromRatio(
    targetNumber: number,
    ratios: number[]
  ): number | undefined {
    if (!ratios || ratios.length == 0) {
      return undefined;
    }
    // targetNumber must be less this._basedNumber
    if (targetNumber >= this._basedNumber) {
      // invalid targetNumber
      return undefined;
    }

    const sum = ratios.reduce((a: number, x: number) => {
      return a + x;
    });

    if (sum > this._basedNumber) {
      // sum should be equal to this._basedNumber or less then this._basedNumber
      return undefined;
    }

    let calculated = 0;
    for (const [idx, ratio] of ratios.entries()) {
      const target = Math.round((this._basedNumber / sum) * ratio);
      calculated += target;
      // adjustment for last index
      if (idx + 1 == ratios.length) {
        calculated = this._basedNumber;
      }
      if (targetNumber < calculated) {
        return idx;
      }
    }
    return undefined;
  }

  public getHexFromRp(): number | undefined {
    // get RP cookie
    const rp = Cookies.get('Rp');
    if (rp) {
      console.log(rp, rp.charAt(0));
      // hex to decimal number which must be 0 to 15
      return parseInt(rp.charAt(0), 16);
    }
    // no RP cookie
    return undefined;
  }

  // for debug use on localhost
  public setRPCookie(value: string): void {
    Cookies.set('Rp', value);
  }
}
