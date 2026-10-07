import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

import AuthenticatedNav from '@/app/components/AuthenticatedNav';
import { hasLandedAccess } from '@/lib/billing/entitlement';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import ProfileDetailsForm from './ProfileDetailsForm';
import { readProfileAnswers } from '@/lib/profile/profileSetup';

export const metadata: Metadata = {
  title: 'Your profile',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const [hasAccess, { data: journey, error: journeyError }] = await Promise.all([
    hasLandedAccess(supabase),
    supabase
      .from('journeys')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (journeyError) throw new Error('Could not load your plan status.');

  const { data: roadmap, error: roadmapError } = journey
    ? await supabase
        .from('roadmaps')
        .select('id')
        .eq('user_id', user.id)
        .eq('journey_id', journey.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };
  if (roadmapError) throw new Error('Could not load your plan status.');

  const profileAnswers = readProfileAnswers(user.user_metadata);
  const joinedAt = new Date(user.created_at);
  const memberSince = Number.isNaN(joinedAt.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(joinedAt);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
      <AuthenticatedNav roadmapId={roadmap?.id} />

      <header className="mt-14">
        <p className="text-sm uppercase tracking-widest text-brand">Account</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-text sm:text-6xl">
          Your profile.
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted">
          Your details and the access connected to this sign-in.
        </p>
      </header>

      <div className="mt-10 space-y-5">
        <section aria-labelledby="profile-details" className="rounded-2xl bg-surface p-7 sm:p-9">
          <h2 id="profile-details" className="font-display text-2xl text-text">
            About you
          </h2>
          <div className="mt-6">
            <ProfileDetailsForm initialAnswers={profileAnswers} />
          </div>
          <dl className="mt-6 divide-y divide-hair/70">
            <div className="py-4 first:pt-0 sm:flex sm:justify-between sm:gap-8">
              <dt className="text-sm text-muted">Sign-in email</dt>
              <dd className="mt-1 break-all text-text sm:mt-0 sm:text-right">
                {user.email ?? 'Email unavailable'}
              </dd>
            </div>
            <div className="py-4 last:pb-0 sm:flex sm:justify-between sm:gap-8">
              <dt className="text-sm text-muted">Member since</dt>
              <dd className="mt-1 text-text sm:mt-0 sm:text-right">
                {memberSince}
              </dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="profile-access" className="rounded-2xl bg-surface p-7 sm:p-9">
          <h2 id="profile-access" className="font-display text-2xl text-text">
            Your access
          </h2>
          <dl className="mt-6">
            <div className="sm:flex sm:justify-between sm:gap-8">
              <dt className="text-sm text-muted">Landed access</dt>
              <dd className="mt-1 text-text sm:mt-0 sm:text-right">
                {hasAccess ? 'Active' : 'Purchase not connected'}
              </dd>
            </div>
          </dl>
          <p className="mt-6 font-medium leading-relaxed text-text">
            One-time purchase. Nothing recurring, nothing to cancel.
          </p>
          {hasAccess ? (
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Includes your private roadmap and updated guidance after check-ins.
            </p>
          ) : null}
          {!hasAccess ? (
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If you already paid using another email, contact{' '}
              <a href="mailto:hello@getlanded.ca" className="text-text underline underline-offset-4">
                hello@getlanded.ca
              </a>{' '}
              and we’ll help connect your purchase. Never send your password.
            </p>
          ) : null}
          <Link
            href={roadmap ? `/roadmap/${roadmap.id}` : '/start'}
            className="mt-8 inline-block text-sm text-brand underline underline-offset-4 hover:text-text"
          >
            {roadmap ? 'View my roadmap →' : 'Go to my home →'}
          </Link>
          {hasAccess ? (
            <p className="mt-6 text-sm text-muted">
              Need help?{' '}
              <a href="mailto:hello@getlanded.ca" className="text-text underline underline-offset-4">
                Contact support
              </a>
              .
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
