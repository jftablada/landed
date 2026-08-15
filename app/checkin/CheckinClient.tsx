'use client';

// app/checkin/CheckinClient.tsx

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

export default function CheckinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journeyId = searchParams.get('journey');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [original, setOriginal] = useState<{
    confirmedCash: string;
    essentialBurn: string;
    debtMinimums: string;
    eiStatus: string;
    eiAmount: string;
  } | null>(null);

  const [confirmedCash, setConfirmedCash] = useState('');
  const [essentialBurn, setEssentialBurn] = useState('');
  const [debtMinimums, setDebtMinimums] = useState('0');
  const [eiStatus, setEiStatus] = useState('not_applied');
  const [eiAmount, setEiAmount] = useState('');
  const [applicationsSubmitted, setApplicationsSubmitted] = useState('');
  const [employerResponses, setEmployerResponses] = useState('');
  const [interviewsSecured, setInterviewsSecured] = useState('');
  const [biggestBarrier, setBiggestBarrier] = useState('');

  const labelCls = 'text-muted text-sm';
  const fieldCls =
    'rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

  useEffect(() => {
    async function loadLatest() {
      if (!journeyId) {
        setError('Missing journey.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/checkin/latest?journey_id=${journeyId}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Could not load your current plan.');
        }

        const loaded = {
          confirmedCash: String(data.confirmed_cash ?? ''),
          essentialBurn: String(data.essential_burn ?? ''),
          debtMinimums: String(data.debt_minimums ?? '0'),
          eiStatus: String(data.ei_status ?? 'not_applied'),
          eiAmount:
            data.ei_monthly_amount === null ||
            data.ei_monthly_amount === undefined
              ? ''
              : String(data.ei_monthly_amount),
        };

        setOriginal(loaded);
        setConfirmedCash(loaded.confirmedCash);
        setEssentialBurn(loaded.essentialBurn);
        setDebtMinimums(loaded.debtMinimums);
        setEiStatus(loaded.eiStatus);
        setEiAmount(loaded.eiAmount);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    }

    loadLatest();
  }, [journeyId]);

  async function handleSubmit() {
    setError(null);

    if (!journeyId) {
      setError('Missing journey.');
      return;
    }

    if (!original) {
      setError('Your current plan has not loaded yet.');
      return;
    }

    if (confirmedCash === '' || isNaN(Number(confirmedCash))) {
      setError('Enter your confirmed cash.');
      return;
    }

    if (essentialBurn === '' || Number(essentialBurn) <= 0) {
      setError('Enter your monthly costs.');
      return;
    }

    if (
      (eiStatus === 'approved' || eiStatus === 'receiving') &&
      (eiAmount === '' || isNaN(Number(eiAmount)))
    ) {
      setError('Enter your monthly EI amount.');
      return;
    }

    const applicationsSubmittedNumber = Number(applicationsSubmitted);
    const employerResponsesNumber = Number(employerResponses);
    const interviewsSecuredNumber = Number(interviewsSecured);

    if (
      applicationsSubmitted === '' ||
      !Number.isInteger(applicationsSubmittedNumber) ||
      applicationsSubmittedNumber < 0
    ) {
      setError('Enter applications submitted as a whole number.');
      return;
    }

    if (
      employerResponses === '' ||
      !Number.isInteger(employerResponsesNumber) ||
      employerResponsesNumber < 0
    ) {
      setError('Enter employer responses as a whole number.');
      return;
    }

    if (
      interviewsSecured === '' ||
      !Number.isInteger(interviewsSecuredNumber) ||
      interviewsSecuredNumber < 0
    ) {
      setError('Enter interviews secured as a whole number.');
      return;
    }

    if (!biggestBarrier) {
      setError('Choose your biggest barrier.');
      return;
    }

    const changes: Record<string, number | string | null> = {};

    if (confirmedCash !== original.confirmedCash) {
      changes.confirmed_cash = Number(confirmedCash);
    }

    if (essentialBurn !== original.essentialBurn) {
      changes.essential_burn = Number(essentialBurn);
    }

    if (debtMinimums !== original.debtMinimums) {
      changes.debt_minimums = Number(debtMinimums) || 0;
    }

    if (eiStatus !== original.eiStatus) {
      changes.ei_status = eiStatus;
    }

    if (eiAmount !== original.eiAmount) {
      changes.ei_monthly_amount =
        eiStatus === 'approved' || eiStatus === 'receiving'
          ? Number(eiAmount)
          : null;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journey_id: journeyId,
          changes,
          applications_submitted: applicationsSubmittedNumber,
          employer_responses: employerResponsesNumber,
          interviews_secured: interviewsSecuredNumber,
          biggest_barrier: biggestBarrier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Could not update your plan.');
      }

      router.push(`/roadmap/${data.roadmap_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-xl px-5 py-12">
        <p className="text-muted">Loading your current plan…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-12">
      <div className="mb-8 flex justify-end">
        <LogoutButton />
      </div>

      <div className="mb-6">
        <a
          href="/start"
          className="text-sm text-muted hover:text-text transition-colors"
        >
          ← Back to my plan
        </a>
      </div>

      <p className="text-muted text-sm uppercase tracking-widest mb-2">
        Check in
      </p>

      <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
        What changed?
      </h1>

      <p className="text-muted mb-10">
        Tell us what happened in your search, then update any financial details
        that changed.
      </p>

      <div className="space-y-5">
        <h2 className="font-display text-2xl text-text">Your job search</h2>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="applications-submitted">
            How many jobs have you applied to since your last check-in?
          </label>
          <input
            id="applications-submitted"
            className={fieldCls}
            type="number"
            min="0"
            step="1"
            value={applicationsSubmitted}
            onChange={(e) => setApplicationsSubmitted(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="employer-responses">
            How many employers or recruiters responded since your last
            check-in?
          </label>
          <input
            id="employer-responses"
            className={fieldCls}
            type="number"
            min="0"
            step="1"
            value={employerResponses}
            onChange={(e) => setEmployerResponses(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="interviews-secured">
            How many interviews did you secure since your last check-in?
          </label>
          <input
            id="interviews-secured"
            className={fieldCls}
            type="number"
            min="0"
            step="1"
            value={interviewsSecured}
            onChange={(e) => setInterviewsSecured(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="biggest-barrier">
            What was your biggest barrier?
          </label>
          <select
            id="biggest-barrier"
            className={fieldCls}
            value={biggestBarrier}
            onChange={(e) => setBiggestBarrier(e.target.value)}
          >
            <option value="">Select one</option>
            <option value="Couldn't find enough suitable jobs">
              Couldn’t find enough suitable jobs
            </option>
            <option value="Unsure which jobs were worth applying to">
              Unsure which jobs were worth applying to
            </option>
            <option value="Resume/applications took too long">
              Resume/applications took too long
            </option>
            <option value="Applied but wasn't hearing back">
              Applied but wasn’t hearing back
            </option>
            <option value="Interview preparation">
              Interview preparation
            </option>
            <option value="Motivation/energy">Motivation/energy</option>
            <option value="Financial pressure">Financial pressure</option>
            <option value="Personal responsibilities">
              Personal responsibilities
            </option>
            <option value="Something else">Something else</option>
          </select>
        </div>

        <h2 className="pt-4 font-display text-2xl text-text">
          Your financial situation
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cash on hand ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={confirmedCash}
              onChange={(e) => setConfirmedCash(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Monthly costs ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={essentialBurn}
              onChange={(e) => setEssentialBurn(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Monthly minimum debt payments ($)</label>
          <input
            className={fieldCls}
            type="number"
            min="0"
            value={debtMinimums}
            onChange={(e) => setDebtMinimums(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>EI status</label>
          <select
            className={fieldCls}
            value={eiStatus}
            onChange={(e) => setEiStatus(e.target.value)}
          >
            <option value="not_applied">Haven’t applied yet</option>
            <option value="applied">Applied, waiting to hear</option>
            <option value="approved">Approved, payments haven’t started</option>
            <option value="receiving">Receiving payments now</option>
            <option value="not_eligible">I don’t qualify</option>
          </select>
        </div>

        {eiStatus === 'approved' && (
          <div className="rounded-lg border border-brand-soft bg-surface p-4">
            <p className="text-text font-medium mb-1">
              Confirm when payments actually arrive
            </p>
            <p className="text-muted text-sm">
              Pick “Receiving payments now” once the money is actually landing.
            </p>
          </div>
        )}

        {(eiStatus === 'approved' || eiStatus === 'receiving') && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>EI amount per month ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={eiAmount}
              onChange={(e) => setEiAmount(e.target.value)}
            />
          </div>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-2 rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Updating your plan…' : 'Update my plan'}
        </button>
      </div>
    </main>
  );
}
