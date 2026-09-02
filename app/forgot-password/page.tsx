'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function ForgotPasswordPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ),
  );

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function requestReset() {
    setBusy(true);
    setStatus(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setBusy(false);

    if (error) {
      setStatus(
        'We couldn\'t send a reset email right now. Try again shortly or email hello@getlanded.ca.',
      );
      return;
    }

    setStatus(
      'If an account exists for that email, a password-reset link is on its way. Check your inbox and junk/spam folder.',
    );
  }

  const fieldCls =
    'w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-20">
      <a href="/login" className="text-muted text-sm hover:text-text">
        ← Back to sign in
      </a>

      <p className="mt-10 text-muted text-sm uppercase tracking-widest mb-2">
        Landed
      </p>
      <h1 className="font-display text-4xl leading-tight mb-2">
        Reset your password
      </h1>
      <p className="text-muted mb-10">
        Enter your Landed email and we’ll send you a secure reset link.
      </p>

      <div className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-muted text-sm" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className={fieldCls}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={requestReset}
          disabled={busy || !email.trim()}
          className="w-full rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Sending…' : 'Send reset link'}
        </button>

        {status && (
          <p className="text-muted text-sm leading-relaxed" aria-live="polite">
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
