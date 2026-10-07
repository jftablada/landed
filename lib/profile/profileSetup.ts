import {
  isCanadianProvinceCode,
  type CanadianProvinceCode,
} from '../core/canadianProvinces';

export const PROFILE_WORK_TYPES = [
  { value: 'employee', label: 'Employee' },
  { value: 'sole_proprietor', label: 'Sole proprietor' },
  { value: 'incorporated', label: 'Incorporated contractor' },
] as const;

export type ProfileWorkType = (typeof PROFILE_WORK_TYPES)[number]['value'];

export type ProfileAnswers = {
  displayName: string;
  province: CanadianProvinceCode | '';
  workType: ProfileWorkType | '';
};

export function isProfileWorkType(value: unknown): value is ProfileWorkType {
  return PROFILE_WORK_TYPES.some(({ value: type }) => type === value);
}

export function readProfileAnswers(metadata: Record<string, unknown> | undefined): ProfileAnswers {
  return {
    displayName: typeof metadata?.display_name === 'string' ? metadata.display_name : '',
    province: isCanadianProvinceCode(metadata?.profile_province)
      ? metadata.profile_province
      : '',
    workType: isProfileWorkType(metadata?.profile_employment_type)
      ? metadata.profile_employment_type
      : '',
  };
}
