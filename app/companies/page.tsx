import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import AuthenticatedNav from '../components/AuthenticatedNav';
import { createSupabaseServerClient } from '../../lib/supabase/server';
import { hasLandedAccess } from '../../lib/billing/entitlement';
import { needsProfileSetup } from '../../lib/profile/profileSetup';
import {
  COMPANY_COLUMNS,
  type TargetCompany,
} from '../../lib/companies/companyInput';
import CompanyWorkspace from './CompanyWorkspace';

export const metadata: Metadata = {
  title: 'Your target companies',
  robots: { index: false, follow: false },
};

export default async function CompaniesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');
  if (needsProfileSetup(user.user_metadata)) redirect('/profile/setup');
  if (!(await hasLandedAccess(supabase))) redirect('/start');
  const { data, error } = await supabase
    .from('target_companies')
    .select(COMPANY_COLUMNS)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
      <AuthenticatedNav />
      <header className="mb-10 mt-14">
        <Link href="/start" className="text-sm text-muted hover:text-text">
          ← Back to Today
        </Link>
        <p className="mt-8 text-sm uppercase tracking-widest text-brand">
          Your search, with direction
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none text-text sm:text-6xl">
          Your target companies.
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">
          A few places worth exploring. A reason for each. One next step you can
          return to.
        </p>
        <p className="mt-3 text-sm text-muted">
          Private to your account. Adding a company does not mark a weekly task
          complete.
        </p>
      </header>
      {error ? (
        <section role="alert" className="rounded-2xl bg-surface p-8">
          <p>
            Your list couldn’t load. Your saved companies haven’t been changed.
          </p>
          <Link
            href="/companies"
            className="mt-4 inline-block text-brand underline"
          >
            Try loading again
          </Link>
        </section>
      ) : (
        <CompanyWorkspace initialCompanies={(data ?? []) as TargetCompany[]} />
      )}
    </main>
  );
}
