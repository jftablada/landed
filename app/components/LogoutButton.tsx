'use client';

import { useState } from 'react';

// app/components/LogoutButton.tsx
// Small reusable sign-out button. Posts to /api/logout, which clears the
// session and redirects to /login. Drop it onto any page.

export default function LogoutButton() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    setError(null);
    try {
      // The route follows its redirect only when Supabase confirms sign-out.
      const res = await fetch('/api/logout', { method: 'POST' });
      if (!res.ok) {
        setError('Could not sign out. Please try again.');
        return;
      }
      window.location.href = res.url || '/login';
    } catch {
      setError('Could not sign out. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        data-leaves-page
        onClick={handleLogout}
        disabled={busy}
        className="text-muted text-sm hover:text-text disabled:cursor-wait disabled:opacity-50"
      >
        {busy ? 'Signing out…' : 'Sign out'}
      </button>
      {error && <span role="alert" className="text-xs text-muted">{error}</span>}
    </span>
  );
}
