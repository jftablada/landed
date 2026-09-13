import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getAuthedUserId: vi.fn(),
  hasLandedAccess: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  getAuthedUserId: mocks.getAuthedUserId,
  createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

vi.mock('@/lib/billing/entitlement', () => ({
  hasLandedAccess: mocks.hasLandedAccess,
  PAYMENT_REQUIRED_RESPONSE: {
    error: 'payment_required',
    message:
      "We don't see a Landed purchase for this email. If you paid with a different address, email hello@getlanded.ca and I'll link it manually.",
  },
}));

import { POST } from './route';

describe('POST /api/intake paid access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks an authenticated user without access before any intake write', async () => {
    const from = vi.fn();
    mocks.getAuthedUserId.mockResolvedValue('unpaid-user');
    mocks.createSupabaseServerClient.mockResolvedValue({ from });
    mocks.hasLandedAccess.mockResolvedValue(false);

    const response = await POST(
      new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(402);
    await expect(response.json()).resolves.toEqual({
      error: 'payment_required',
      message:
        "We don't see a Landed purchase for this email. If you paid with a different address, email hello@getlanded.ca and I'll link it manually.",
    });
    expect(from).not.toHaveBeenCalled();
  });
});
