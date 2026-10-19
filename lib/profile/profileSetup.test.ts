import { describe, expect, it } from 'vitest';
import { needsProfileSetup, readProfileAnswers, validateRequiredProfile } from './profileSetup';

describe('profile setup answers', () => {
  it('starts empty for existing accounts', () => {
    expect(readProfileAnswers(undefined)).toEqual({
      displayName: '', province: '', workType: '',
    });
  });

  it('accepts only supported province and work type values', () => {
    expect(readProfileAnswers({
      display_name: 'Alex', profile_province: 'BC', profile_employment_type: 'employee',
    })).toEqual({ displayName: 'Alex', province: 'BC', workType: 'employee' });
    expect(readProfileAnswers({
      profile_province: 'XX', profile_employment_type: 'guess',
    })).toEqual({ displayName: '', province: '', workType: '' });
  });

  it('requires all three setup answers for new accounts only', () => {
    expect(needsProfileSetup(undefined)).toBe(false);
    expect(needsProfileSetup({ profile_setup_status: 'pending' })).toBe(true);
    expect(needsProfileSetup({
      profile_setup_status: 'complete', display_name: 'Alex',
      profile_province: 'ON', profile_employment_type: 'employee',
    })).toBe(false);
    expect(needsProfileSetup({ profile_setup_status: 'skipped' })).toBe(false);

    expect(validateRequiredProfile({ displayName: ' ', province: 'ON', workType: 'employee' }))
      .toMatch(/name/);
    expect(validateRequiredProfile({ displayName: 'Alex', province: '', workType: 'employee' }))
      .toMatch(/province/);
    expect(validateRequiredProfile({ displayName: 'Alex', province: 'ON', workType: '' }))
      .toMatch(/work type/);
    expect(validateRequiredProfile({ displayName: 'Alex', province: 'ON', workType: 'employee' }))
      .toBeNull();
  });

  it('returns incomplete completed profiles to setup', () => {
    expect(needsProfileSetup({ profile_setup_status: 'complete' })).toBe(true);
    expect(needsProfileSetup({
      profile_setup_status: 'complete', display_name: 'Alex',
      profile_province: 'XX', profile_employment_type: 'employee',
    })).toBe(true);
    expect(validateRequiredProfile({
      displayName: 'A'.repeat(81), province: 'ON', workType: 'employee',
    })).toMatch(/80 characters/);
  });
});
