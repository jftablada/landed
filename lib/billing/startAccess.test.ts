import { describe, expect, it } from 'vitest';
import { resolveStartAccessState } from './startAccess';

describe('authenticated start access state', () => {
  it('stops an unpaid new account before intake', () => {
    expect(resolveStartAccessState(false, false)).toBe('missing_purchase');
  });

  it('sends a paid new account into onboarding', () => {
    expect(resolveStartAccessState(true, false)).toBe('ready_for_intake');
  });

  it('keeps an existing customer in the returning experience', () => {
    expect(resolveStartAccessState(true, true)).toBe('returning_user');
  });
});
