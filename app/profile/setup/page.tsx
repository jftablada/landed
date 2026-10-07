import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import ProfileDetailsForm from '@/app/profile/ProfileDetailsForm';
import { readProfileAnswers } from '@/lib/profile/profileSetup';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false, follow: false },
};

export default async function ProfileSetupPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  if (user.user_metadata?.profile_setup_status !== 'pending') redirect('/start');

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16 sm:py-20">
      <p className="text-sm uppercase tracking-widest text-brand">Landed · Your profile</p>
      <h1 className="mt-4 font-display text-4xl leading-tight text-text sm:text-5xl">
        A little about you.
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-muted">
        Add what you’d like us to know before you start. Nothing here is required,
        and you can update it later.
      </p>
      <section className="mt-9 rounded-2xl bg-surface p-7 sm:p-9" aria-label="Profile setup">
        <ProfileDetailsForm initialAnswers={readProfileAnswers(user.user_metadata)} setup />
      </section>
    </main>
  );
}
