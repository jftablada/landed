'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [checkingLink, setCheckingLink] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'PASSWORD_RECOVERY' || session) {
        setRecoveryReady(true);
        setCheckingLink(false);
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;

      if (error || !data.session) {
        setStatus(
          'This reset link is invalid or has expired. Request a new link and try again.',
        );
        setCheckingLink(false);
        return;
      }

      setRecoveryReady(true);
      setCheckingLink(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword() {
    setStatus(null);

    if (password.length < 8) {
      setStatus('Choose a password with at least 8 characters.');
      return;
    }

    if (password !== confirmation) {
      setStatus('The passwords don’t match.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setStatus(`We couldn’t update your password: ${error.message}`);
      return;
    }

    setStatus('Password updated. Taking you to your plan…');
    router.push('/start');
  }

  const fieldCls =
    'w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-20">
      <p className="text-muted text-sm uppercase tracking-widest mb-2">
        Landed
      </p>
      <h1 className="font-display text-4xl leading-tight mb-2">
        Choose a new password
      </h1>

      {checkingLink ? (
        <p className="text-muted mt-6">Checking your reset link…</p>
      ) : recoveryReady ? (
        <div className="mt-10 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-muted text-sm" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              className={fieldCls}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-muted text-sm" htmlFor="confirmation">
              Confirm new password
            </label>
            <input
              id="confirmation"
              className={fieldCls}
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={updatePassword}
            disabled={busy || !password || !confirmation}
            className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </div>
      ) : (
        <a
          href="/forgot-password"
          className="mt-8 inline-block text-sm text-brand underline"
        >
          Request a new reset link
        </a>
      )}

      {status && (
        <p className="text-muted mt-5 text-sm leading-relaxed" aria-live="polite">
          {status}
        </p>
      )}
    </main>
  );
}
