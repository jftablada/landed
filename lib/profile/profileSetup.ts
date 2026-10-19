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

export function needsProfileSetup(metadata: Record<string, unknown> | undefined): boolean {
  if (metadata?.profile_setup_status === 'pending') return true;
  if (metadata?.profile_setup_status !== 'complete') return false;
  return validateRequiredProfile(readProfileAnswers(metadata)) !== null;
}

export function validateRequiredProfile(answers: ProfileAnswers): string | null {
  if (!answers.displayName.trim()) return 'Enter the name you’d like us to use.';
  if (answers.displayName.trim().length > 80) return 'Please use 80 characters or fewer for your name.';
  if (!isCanadianProvinceCode(answers.province)) return 'Choose your province or territory.';
  if (!isProfileWorkType(answers.workType)) return 'Choose your work type.';
  return null;
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
