'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function LoginPage() {
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      setStatus(`Couldn’t sign up: ${error.message}`);
      return;
    }
    // Email confirmation is off in dev, so a new account can go straight in.
    setStatus('Account created. Taking you to your plan…');
    router.push('/start');
  }

  async function signIn() {
    setBusy(true);
    setStatus(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setStatus('That email or password didn’t match. Try again.');
      return;
    }
    setStatus('Welcome back. Taking you to your plan…');
    router.push('/start');
  }

  const fieldCls =
    'w-full rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  return (
    <main className="mx-auto w-full max-w-sm px-5 py-20">
      <p className="text-muted text-sm uppercase tracking-widest mb-2">Landed</p>
      <h1 className="font-display text-4xl leading-tight mb-2 max-w-xs text-balance">
        You just got the call. Now what?
      </h1>
      <p className="text-muted mb-10">
        Sign in, or create an account to build your recovery plan.
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
          <label className="text-muted text-sm">Password</label>
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

        {status && <p className="text-muted text-sm pt-1">{status}</p>}
      </div>
    </main>
  );
}
