import { RunaAB } from '../../abtest/ab';

describe('getIndexFromRatio()', () => {
  test('happy path', () => {
    const ab = new RunaAB(16);

    // skip call getHexFromRp()

    // 1 element in ratios
    for (let i = 0; i < 16; i++) {
      expect(ab.getIndexFromRatio(i, [1])).toEqual(0);
    }
    for (let i = 0; i < 16; i++) {
      expect(ab.getIndexFromRatio(1, [i + 1])).toEqual(0);
    }
    // 2 elements in ratios
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      if (i > 7) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [2, 2])).toEqual(expected);
    }
    // 3 elements in ratios
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      if (i > 7) {
        expected = 2;
      } else if (i > 3) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [1, 1, 2])).toEqual(expected);
    }
    // what if order is descending? 3 elements in ratios
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      if (i > 11) {
        expected = 2;
      } else if (i > 7) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [2, 1, 1])).toEqual(expected);
    }
    // 4 elements in ratios
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      if (i > 7) {
        expected = 3;
      } else if (i > 3) {
        expected = 2;
      } else if (i > 1) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [1, 1, 2, 4])).toEqual(expected);
    }
    // what if sum of ratios is not divisor of 16?
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      // 1: target would be 0 to 4
      // 2: target would be 5 to 15
      if (i > 4) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [1, 2])).toEqual(expected);
    }
    for (let i = 0; i < 16; i++) {
      let expected = 0;
      // 1: target would be 0 to 2
      // 2: target would be 3 to 7
      // 3: target would be 8 to 15
      if (i > 7) {
        expected = 2;
      } else if (i > 2) {
        expected = 1;
      }
      expect(ab.getIndexFromRatio(i, [1, 2, 3])).toEqual(expected);
    }
  });
  test('unhappy path', () => {
    const ab = new RunaAB(16);

    // no ratios
    for (let i = 0; i < 16; i++) {
      expect(ab.getIndexFromRatio(i, [])).toEqual(undefined);
    }
    // if targetValue is this._baseNumber or over this._baseNumber, undefined should be returned
    for (let i = 16; i < 20; i++) {
      expect(ab.getIndexFromRatio(i, [])).toEqual(undefined);
      expect(ab.getIndexFromRatio(i, [1])).toEqual(undefined);
      expect(ab.getIndexFromRatio(i, [1, 1, 2])).toEqual(undefined);
      expect(ab.getIndexFromRatio(i, [1, 2])).toEqual(undefined);
    }
    // sum of ratios is over this._baseNumber
    expect(ab.getIndexFromRatio(5, [17])).toEqual(undefined);
    expect(ab.getIndexFromRatio(5, [1, 2, 3, 4, 5, 6])).toEqual(undefined);
  });
});
