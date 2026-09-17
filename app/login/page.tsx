'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { trackEvent } from '@/lib/analytics';
import {
  buildConfirmationRedirect,
  getLoginArrivalState,
  type LoginArrivalState,
} from '@/lib/auth/activation';
import OnboardingProgress from '@/app/components/OnboardingProgress';

export default function LoginPage() {
  const router = useRouter();

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [arrivalState, setArrivalState] =
    useState<LoginArrivalState>('standard');

  useEffect(() => {
    const nextArrivalState = getLoginArrivalState(window.location.search);
    setArrivalState(nextArrivalState);
    if (nextArrivalState === 'confirmed') {
      trackEvent('email_confirmation_returned');
    }
  }, []);

  const arrivedFromCheckout = arrivalState === 'checkout';
  const emailConfirmed = arrivalState === 'confirmed';

  async function signUp() {
    setBusy(true);
    setStatus(null);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: buildConfirmationRedirect(window.location.origin),
      },
    });
    setBusy(false);

    if (error) {
      setStatus(`Couldn’t sign up: ${error.message}`);
      return;
    }
    trackEvent('account_created');
    if (data.session) {
      setStatus('Account created. Taking you to your plan…');
      router.push('/start');
      return;
    }

    setStatus(
      'Account created. Check your inbox or junk/spam folder for the confirmation email. Its link will bring you back here.',
    );
  }

  async function resendConfirmation() {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setStatus('Enter the email address you used to create your account first.');
      return;
    }

    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: buildConfirmationRedirect(window.location.origin),
      },
    });
    setBusy(false);

    if (error) {
      setStatus(`Couldn’t resend the confirmation email: ${error.message}`);
      return;
    }

    trackEvent('confirmation_email_resent');
    setStatus(
      'Confirmation email sent. Check your inbox and junk/spam folder.',
    );
  }

  async function signIn() {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setStatus(
          'Confirm your email before signing in. Check your inbox or junk/spam folder for the Landed confirmation email.',
        );
        return;
      }
      setStatus('That email or password didn’t match. Try again.');
      return;
    }
    trackEvent('sign_in_completed', {
      arrival:
        arrivalState === 'confirmed'
          ? 'confirmation_return'
          : arrivalState === 'checkout'
            ? 'checkout'
            : 'standard',
    });
    setStatus('Welcome back. Taking you to your plan…');
    router.push('/start');
  }

  const fieldCls =
    'w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-20">
      {(arrivedFromCheckout || emailConfirmed) && (
        <OnboardingProgress
          currentStep={2}
          detail={
            emailConfirmed
              ? 'Your email is confirmed. Sign in to continue to your Landed account.'
              : 'Payment is complete. Account setup usually takes about two minutes.'
          }
        />
      )}
      <p className="text-muted text-sm uppercase tracking-widest mb-2">Landed</p>
      <h1 className="font-display text-4xl leading-tight mb-2 max-w-xs text-balance">
        {emailConfirmed
          ? 'Email confirmed. Sign in to continue.'
          : arrivedFromCheckout
            ? 'Payment received. Let’s get you started.'
            : 'You just got the call. Now what?'}
      </h1>
      <p className="text-muted mb-10">
        {emailConfirmed
          ? 'Use the email and password you chose when creating your account.'
          : arrivedFromCheckout
            ? 'Create your Landed account below using the email address from checkout.'
            : 'Sign in, or create an account to build your recovery plan.'}
      </p>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm">Email</label>
          <input
            className={fieldCls}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-4">
            <label className="text-muted text-sm">Password</label>
            <a
              href="/forgot-password"
              className="text-muted text-xs underline hover:text-text"
            >
              Forgot password?
            </a>
          </div>
          <input
            className={fieldCls}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={signIn}
            disabled={busy}
            className="flex-1 rounded-lg bg-brand px-5 py-3 font-medium text-black
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={signUp}
            disabled={busy}
            className="flex-1 rounded-lg border border-hair bg-surface px-5 py-3
                       font-medium text-text disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create account
          </button>
        </div>
        <p className="text-muted text-xs leading-relaxed pt-1">
          Didn’t receive the confirmation email?{' '}
          <button
            type="button"
            onClick={resendConfirmation}
            disabled={busy}
            className="underline hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resend it
          </button>
          .
        </p>
        <p className="text-muted text-xs leading-relaxed pt-1">
          Still having trouble? Email{' '}
          <a
            href="mailto:hello@getlanded.ca"
            className="underline hover:text-text"
          >
            hello@getlanded.ca
          </a>
        </p>
        <p className="text-muted text-xs leading-relaxed pt-1">
          After signing up, check your inbox or junk/spam folder for your Landed confirmation email.
          If it lands in junk, mark it as "Not junk" before opening the link.
        </p>
        {status && <p className="text-muted text-sm pt-1">{status}</p>}
      </div>
    </main>
  );
}
