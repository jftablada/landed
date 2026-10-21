import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ create: vi.fn(), access: vi.fn() }));
vi.mock('../../../lib/supabase/server', () => ({
  createSupabaseServerClient: mocks.create,
}));
vi.mock('../../../lib/billing/entitlement', () => ({
  hasLandedAccess: mocks.access,
  PAYMENT_REQUIRED_RESPONSE: { error: 'payment_required' },
}));
import { POST, PATCH } from './route';

const payload = {
  company_name: 'Example',
  why_fit: '',
  target_role: '',
  next_step: 'research',
};
const id = '12345678-1234-1234-1234-123456789abc';
function request(
  body: unknown = payload,
  headers: Record<string, string> = {},
) {
  return new Request('https://landed.example/api/companies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}
describe('private company saves', () => {
  let db: ReturnType<typeof setup>;
  function setup() {
    const query = {
      insert: vi.fn(),
      update: vi.fn(),
      eq: vi.fn(),
      select: vi.fn(),
      maybeSingle: vi
        .fn()
        .mockResolvedValue({ data: { id, ...payload }, error: null }),
    };
    for (const key of ['insert', 'update', 'eq', 'select'] as const)
      query[key].mockReturnValue(query);
    return {
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'owner' } }, error: null }),
      },
      from: vi.fn().mockReturnValue(query),
      query,
    };
  }
  beforeEach(() => {
    vi.clearAllMocks();
    db = setup();
    mocks.create.mockResolvedValue(db);
    mocks.access.mockResolvedValue(true);
  });
  it('blocks signed-out users before writing', async () => {
    db.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    } as never);
    expect((await POST(request())).status).toBe(401);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('blocks unpaid accounts before writing', async () => {
    mocks.access.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(402);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('never trusts a supplied owner', async () => {
    expect(
      (await POST(request({ ...payload, user_id: 'intruder' }))).status,
    ).toBe(400);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('saves with the authenticated owner only', async () => {
    expect((await POST(request())).status).toBe(201);
    expect(db.query.insert).toHaveBeenCalledWith({
      ...payload,
      user_id: 'owner',
    });
  });
  it('scopes edits to both record and authenticated owner', async () => {
    expect((await PATCH(request({ ...payload, id }))).status).toBe(200);
    expect(db.query.eq).toHaveBeenCalledWith('id', id);
    expect(db.query.eq).toHaveBeenCalledWith('user_id', 'owner');
  });
  it('reports missing or unowned records without leaking data', async () => {
    db.query.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    } as never);
    expect((await PATCH(request({ ...payload, id }))).status).toBe(404);
  });
  it('handles duplicates without losing the form', async () => {
    db.query.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: '23505' },
    } as never);
    expect((await POST(request())).status).toBe(409);
  });
  it('does not expose database errors', async () => {
    db.query.maybeSingle.mockResolvedValue({
      data: null,
      error: { message: 'sensitive detail' },
    } as never);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('sensitive');
  });
  it('rejects cross-site writes', async () => {
    expect(
      (await POST(request(payload, { Origin: 'https://evil.example' }))).status,
    ).toBe(403);
    expect(db.from).not.toHaveBeenCalled();
  });
  it('rejects broken JSON', async () => {
    expect(
      (
        await POST(
          new Request('https://landed.example/api/companies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{',
          }),
        )
      ).status,
    ).toBe(400);
  });
});
