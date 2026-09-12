import { describe, expect, it } from 'vitest';
import {
  CANADIAN_PROVINCES,
  isCanadianProvinceCode,
} from './canadianProvinces';

describe('Canadian provinces and territories', () => {
  it('contains all 13 supported province and territory codes', () => {
    expect(CANADIAN_PROVINCES).toHaveLength(13);
    expect(CANADIAN_PROVINCES.map(({ code }) => code)).toEqual([
      'AB',
      'BC',
      'MB',
      'NB',
      'NL',
      'NS',
      'NT',
      'NU',
      'ON',
      'PE',
      'QC',
      'SK',
      'YT',
    ]);
  });

  it('accepts supported codes and rejects missing or unknown values', () => {
    expect(isCanadianProvinceCode('BC')).toBe(true);
    expect(isCanadianProvinceCode('ON')).toBe(true);
    expect(isCanadianProvinceCode('ZZ')).toBe(false);
    expect(isCanadianProvinceCode('')).toBe(false);
    expect(isCanadianProvinceCode(null)).toBe(false);
  });
});
