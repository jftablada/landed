import { beforeEach, describe, expect, it, vi } from 'vitest';

const signOut = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ auth: { signOut } }),
}));

import { POST } from './route';

describe('sign-out route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to login after Supabase confirms sign-out', async () => {
    signOut.mockResolvedValue({ error: null });

    const response = await POST(new Request('https://www.getlanded.ca/api/logout'));

    expect(signOut).toHaveBeenCalledOnce();
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('https://www.getlanded.ca/login');
  });

  it('keeps the user on the current page when sign-out fails', async () => {
    signOut.mockResolvedValue({ error: { message: 'Provider unavailable' } });

    const response = await POST(new Request('https://www.getlanded.ca/api/logout'));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Could not sign out. Please try again.',
    });
    expect(response.headers.get('location')).toBeNull();
  });
});
