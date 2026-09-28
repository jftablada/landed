import { describe, expect, it } from 'vitest';
import { resolveCheckoutUrl } from './checkoutUrl';

describe('resolveCheckoutUrl', () => {
  it('keeps the existing checkout URL on production', () => {
    expect(resolveCheckoutUrl('production', undefined)).toBe(
      'https://buy.stripe.com/00wbITdDtgag2rV9Ez5gc02',
    );
  });

  it('disables checkout outside production until a test link is configured', () => {
    expect(resolveCheckoutUrl('preview', undefined)).toBeNull();
    expect(resolveCheckoutUrl(undefined, undefined)).toBeNull();
  });

  it('accepts a Stripe test payment link outside production', () => {
    expect(resolveCheckoutUrl('preview', 'https://buy.stripe.com/test_example')).toBe(
      'https://buy.stripe.com/test_example',
    );
  });

  it('rejects a live or non-Stripe link outside production', () => {
    expect(() =>
      resolveCheckoutUrl('preview', 'https://buy.stripe.com/live_example'),
    ).toThrow('Non-production checkout must use a Stripe test payment link');
    expect(() =>
      resolveCheckoutUrl('preview', 'https://example.com/test_example'),
    ).toThrow('Non-production checkout must use a Stripe test payment link');
  });
});
