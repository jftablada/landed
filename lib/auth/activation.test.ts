import { describe, expect, it } from 'vitest';
import {
  buildConfirmationRedirect,
  getLoginArrivalState,
} from './activation';

describe('account activation flow', () => {
  it('prioritizes a confirmed-email return over checkout context', () => {
    expect(
      getLoginArrivalState('?checkout=success&confirmed=1'),
    ).toBe('confirmed');
  });

  it('recognizes a checkout arrival', () => {
    expect(getLoginArrivalState('?checkout=success')).toBe('checkout');
  });

  it('uses the standard login state for unrelated parameters', () => {
    expect(getLoginArrivalState('?next=/start')).toBe('standard');
  });

  it('builds a stable confirmation return URL', () => {
    expect(buildConfirmationRedirect('https://www.getlanded.ca/')).toBe(
      'https://www.getlanded.ca/login?confirmed=1',
    );
  });
});
