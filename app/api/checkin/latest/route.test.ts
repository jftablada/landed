import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAuthedUserId: vi.fn(),
  createSupabaseServerClient: vi.fn(),
}));
vi.mock('@/lib/supabase/server', () => mocks);
import { GET } from './route';

describe('check-in latest presentation date', () => {
  beforeEach(() => vi.clearAllMocks());
  it('requires authentication before a database read', async () => {
    mocks.getAuthedUserId.mockResolvedValue(null);
    expect(
      (
        await GET(
          new Request('https://landed.example/api/checkin/latest?journey_id=j'),
        )
      ).status,
    ).toBe(401);
    expect(mocks.createSupabaseServerClient).not.toHaveBeenCalled();
  });
  it('checks ownership before returning the snapshot date', async () => {
    mocks.getAuthedUserId.mockResolvedValue('user-1');
    const eq = vi.fn().mockReturnThis();
    const snapshot = {
      province: 'ON',
      confirmed_cash: 8000,
      essential_burn: 3000,
      debt_minimums: 500,
      ei_status: 'not_applied',
      ei_monthly_amount: null,
      created_at: '2026-10-20T12:00:00Z',
      private_unused_field: 'not returned',
    };
    const query = {
      select: vi.fn().mockReturnThis(),
      eq,
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi
        .fn()
        .mockResolvedValueOnce({ data: { id: 'j' }, error: null })
        .mockResolvedValueOnce({ data: snapshot, error: null }),
    };
    mocks.createSupabaseServerClient.mockResolvedValue({
      from: vi.fn().mockReturnValue(query),
    });
    const response = await GET(
      new Request('https://landed.example/api/checkin/latest?journey_id=j'),
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(body.activity_since).toBe(snapshot.created_at);
    expect(body).not.toHaveProperty('private_unused_field');
  });
  it('does not return data from another journey', async () => {
    mocks.getAuthedUserId.mockResolvedValue('user-1');
    const from = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    mocks.createSupabaseServerClient.mockResolvedValue({ from });
    expect(
      (
        await GET(
          new Request(
            'https://landed.example/api/checkin/latest?journey_id=foreign',
          ),
        )
      ).status,
    ).toBe(404);
    expect(from).toHaveBeenCalledTimes(1);
  });
});
