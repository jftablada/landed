import { describe, expect, it, vi } from 'vitest';
import {
  hasLandedAccess,
  PAYMENT_REQUIRED_RESPONSE,
} from './entitlement';

describe('payment entitlement', () => {
  it('returns the access decision from the database function', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });

    await expect(hasLandedAccess({ rpc } as never)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith('has_landed_access');
  });

  it('does not grant access when the database function returns false', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: false, error: null });

    await expect(hasLandedAccess({ rpc } as never)).resolves.toBe(false);
  });

  it('gives a mismatched-email buyer a specific recovery path', () => {
    expect(PAYMENT_REQUIRED_RESPONSE).toEqual({
      error: 'payment_required',
      message:
        "We don't see a Landed purchase for this email. If you paid with a different address, email hello@getlanded.ca and I'll link it manually.",
    });
  });
});
