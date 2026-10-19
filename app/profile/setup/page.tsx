import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import LogoutButton from '@/app/components/LogoutButton';
import ProfileDetailsForm from '@/app/profile/ProfileDetailsForm';
import { needsProfileSetup, readProfileAnswers } from '@/lib/profile/profileSetup';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Set up your profile',
  robots: { index: false, follow: false },
};

export default async function ProfileSetupPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');
  if (!needsProfileSetup(user.user_metadata)) redirect('/start');

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16 sm:py-20">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm uppercase tracking-widest text-brand">Landed · Your profile</p>
        <LogoutButton />
      </div>
      <h1 className="mt-4 font-display text-4xl leading-tight text-text sm:text-5xl">
        A little about you.
      </h1>
      <p className="mt-4 max-w-lg leading-relaxed text-muted">
        Tell us your name, province, and work type before you start. You can
        update these details later in your profile.
      </p>
      <section className="mt-9 rounded-2xl bg-surface p-7 sm:p-9" aria-label="Profile setup">
        <ProfileDetailsForm initialAnswers={readProfileAnswers(user.user_metadata)} setup />
      </section>
    </main>
  );
}
