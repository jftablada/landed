export const CANADIAN_PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
] as const;

export type CanadianProvinceCode = (typeof CANADIAN_PROVINCES)[number]['code'];

const CANADIAN_PROVINCE_CODES = new Set<string>(
  CANADIAN_PROVINCES.map(({ code }) => code),
);

export function isCanadianProvinceCode(
  value: unknown,
): value is CanadianProvinceCode {
  return typeof value === 'string' && CANADIAN_PROVINCE_CODES.has(value);
}
