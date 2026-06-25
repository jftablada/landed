import { Suspense } from 'react';
import CheckinClient from '@/app/checkin/CheckinClient';

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-xl px-5 py-12">
          <p className="text-muted">Loading your check-in…</p>
        </main>
      }
    >
      <CheckinClient />
    </Suspense>
  );
}