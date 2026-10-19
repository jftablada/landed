import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getUser, redirect } = vi.hoisted(() => ({
  getUser: vi.fn(),
  redirect: vi.fn((path: string): never => { throw new Error(`redirect:${path}`); }),
}));

vi.mock('next/navigation', () => ({ redirect }));
vi.mock('@/lib/profile/profileSetup', () => import('../../lib/profile/profileSetup'));
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: async () => ({ auth: { getUser } }),
}));

import IntakeLayout from './layout';

describe('required profile before intake', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('sends unauthenticated visitors to sign in', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(IntakeLayout({ children: 'intake' })).rejects.toThrow('redirect:/login');
  });

  it('sends an unfinished profile to setup even on a direct intake visit', async () => {
    getUser.mockResolvedValue({
      data: { user: { user_metadata: { profile_setup_status: 'pending' } } }, error: null,
    });
    await expect(IntakeLayout({ children: 'intake' })).rejects.toThrow('redirect:/profile/setup');
  });

  it('opens intake after all required profile answers are saved', async () => {
    getUser.mockResolvedValue({
      data: { user: { user_metadata: {
        profile_setup_status: 'complete', display_name: 'Alex',
        profile_province: 'BC', profile_employment_type: 'employee',
      } } }, error: null,
    });
    await expect(IntakeLayout({ children: 'intake' })).resolves.toBe('intake');
    expect(redirect).not.toHaveBeenCalled();
  });

  it('keeps accounts created before profile setup able to continue', async () => {
    getUser.mockResolvedValue({ data: { user: { user_metadata: {} } }, error: null });
    await expect(IntakeLayout({ children: 'intake' })).resolves.toBe('intake');
    expect(redirect).not.toHaveBeenCalled();
  });
});
