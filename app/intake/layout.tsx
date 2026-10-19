import { redirect } from 'next/navigation';
import { needsProfileSetup } from '@/lib/profile/profileSetup';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function IntakeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  if (needsProfileSetup(user.user_metadata)) redirect('/profile/setup');
  return children;
}
