import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createSupabaseServerClient: vi.fn(),
  getAuthedUserId: vi.fn(),
  hasLandedAccess: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.createSupabaseServerClient,
  getAuthedUserId: mocks.getAuthedUserId,
}));
vi.mock('@/lib/billing/entitlement', () => ({
  hasLandedAccess: mocks.hasLandedAccess,
  PAYMENT_REQUIRED_RESPONSE: { error: 'payment_required' },
}));
vi.mock('@/lib/db/supabaseDbClient', () => ({
  createSupabaseDbClient: vi.fn(),
}));
vi.mock('@/lib/core/generateRoadmapForIntake.impl', () => ({
  generateRoadmapForIntake: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
}));
vi.mock('@/lib/ai/templateStubClient', () => ({ templateStubClient: {} }));
vi.mock('@/lib/ai/systemPrompt', () => ({ SYSTEM_PROMPT: '' }));

import { POST } from './route';

const previousSnapshot = {
  employment_type: 'employee',
  housing_type: 'rent',
  province: 'ON',
  dependents_count: 0,
  job_target: null,
  confirmed_cash: 8000,
  essential_burn: 3000,
  debt_minimums: 500,
  tax_obligation_status: 'none',
  tax_obligation_amount: null,
  tax_plan_monthly: null,
  ei_status: 'not_applied',
  ei_monthly_amount: null,
  pending_invoice_amount: null,
  pending_invoice_confirmed: false,
  upside_notes: null,
};

describe('POST /api/checkin financial validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects invalid money before inserting an immutable snapshot', async () => {
    const insert = vi.fn();
    const journeyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'journey-1', status: 'active' },
        error: null,
      }),
    };
    const snapshotQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: previousSnapshot,
        error: null,
      }),
      insert,
    };
    const from = vi.fn((table: string) =>
      table === 'journeys' ? journeyQuery : snapshotQuery,
    );
    mocks.getAuthedUserId.mockResolvedValue('paid-user');
    mocks.createSupabaseServerClient.mockResolvedValue({ from });
    mocks.hasLandedAccess.mockResolvedValue(true);

    const response = await POST(
      new Request('http://localhost/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: 'journey-1',
          changes: { confirmed_cash: -1 },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Cash on hand must be a number from $0 to $1 billion.',
    });
    expect(insert).not.toHaveBeenCalled();
  });
});
