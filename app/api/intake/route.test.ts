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

const VALID_INTAKE = {
  situation_type: 'laid_off',
  employment_type: 'employee',
  housing_type: 'rent',
  province: 'ON',
  dependents_count: 0,
  confirmed_cash: 8000,
  essential_burn: 3000,
  debt_minimums: 500,
  tax_obligation_status: 'none',
  ei_status: 'not_applied',
};

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

  it('accepts dismissal and stores it on a new journey', async () => {
    const journeyInsert = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: 'journey-1' }, error: null }),
      }),
    }));
    const intakeInsert = vi.fn(() => ({
      select: () => ({
        single: async () => ({ data: { id: 'intake-1' }, error: null }),
      }),
    }));
    const from = vi.fn((table: string) => {
      if (table === 'journeys') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }),
          insert: journeyInsert,
        };
      }
      if (table === 'intakes') return { insert: intakeInsert };
      throw new Error(`Unexpected table: ${table}`);
    });
    mocks.getAuthedUserId.mockResolvedValue('paid-user');
    mocks.createSupabaseServerClient.mockResolvedValue({ from });
    mocks.hasLandedAccess.mockResolvedValue(true);

    const response = await POST(
      new Request('http://localhost/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...VALID_INTAKE, situation_type: 'dismissed' }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      intake_id: 'intake-1',
      journey_id: 'journey-1',
    });
    expect(journeyInsert).toHaveBeenCalledWith({
      user_id: 'paid-user',
      situation_type: 'dismissed',
      status: 'active',
    });
    expect(intakeInsert).toHaveBeenCalledWith(
      expect.objectContaining({ journey_id: 'journey-1', user_id: 'paid-user' }),
    );
  });

  it.each([
    [{ confirmed_cash: -1 }, 'Cash on hand'],
    [{ confirmed_cash: '8000' }, 'Cash on hand'],
    [{ essential_burn: 0 }, 'Monthly essential costs'],
    [{ debt_minimums: -1 }, 'Monthly debt minimums'],
    [{ province: 'XX' }, 'province'],
    [{ ei_status: 'receiving' }, 'monthly EI amount'],
    [{ tax_obligation_status: 'has_amount' }, 'tax you owe'],
  ] as const)(
    'rejects invalid financial data before creating a journey or intake: %j',
    async (change, expectedMessage) => {
      const from = vi.fn();
      mocks.getAuthedUserId.mockResolvedValue('paid-user');
      mocks.createSupabaseServerClient.mockResolvedValue({ from });
      mocks.hasLandedAccess.mockResolvedValue(true);

      const response = await POST(
        new Request('http://localhost/api/intake', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...VALID_INTAKE, ...change }),
        }),
      );

      expect(response.status).toBe(400);
      const result = await response.json();
      expect(result.error).toContain(expectedMessage);
      expect(from).not.toHaveBeenCalled();
    },
  );
});
