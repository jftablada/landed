import { describe, expect, it } from 'vitest';
import { readProfileAnswers } from './profileSetup';

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
});
