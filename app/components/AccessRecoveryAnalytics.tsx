'use client';

import { useEffect } from 'react';

import { trackEvent } from '@/lib/analytics';

const ACCESS_RECHECK_PENDING_KEY = 'landed_access_recheck_pending';

function hasPendingAccessRecheck(): boolean {
  try {
    return window.sessionStorage.getItem(ACCESS_RECHECK_PENDING_KEY) === '1';
  } catch {
    return false;
  }
}

function markAccessRecheckPending() {
  try {
    window.sessionStorage.setItem(ACCESS_RECHECK_PENDING_KEY, '1');
  } catch {
    // Analytics must never interfere with the access check itself.
  }
}

function clearPendingAccessRecheck() {
  try {
    window.sessionStorage.removeItem(ACCESS_RECHECK_PENDING_KEY);
  } catch {
    // The recovery flow still works when browser storage is unavailable.
  }
}

export function AccessRecoveryTracker({
  accessGranted,
}: {
  accessGranted: boolean;
}) {
  useEffect(() => {
    if (!accessGranted) return;
    if (!hasPendingAccessRecheck()) return;

    trackEvent('purchase_access_recovered');
    clearPendingAccessRecheck();
  }, [accessGranted]);

  return null;
}

export function AccessRecheckButton() {
  function handleRecheck() {
    markAccessRecheckPending();
    trackEvent('purchase_access_recheck_clicked');
  }

  return (
    <form action="/start" method="get" onSubmit={handleRecheck}>
      <button
        type="submit"
        className="mt-5 rounded-xl bg-brand px-6 py-3.5 font-semibold text-black hover:opacity-90"
      >
        Check my access again
      </button>
    </form>
  );
}

export function AccessSupportLink() {
  return (
    <a
      href="mailto:hello@getlanded.ca?subject=Connect%20my%20Landed%20purchase"
      onClick={() => trackEvent('purchase_access_support_clicked')}
      className="mt-4 inline-block text-sm font-medium text-text underline decoration-hair underline-offset-4 hover:text-brand"
    >
      Email hello@getlanded.ca
    </a>
  );
}
