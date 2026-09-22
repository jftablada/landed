'use client';

// app/checkin/CheckinClient.tsx

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedNav from '@/app/components/AuthenticatedNav';
import {
  CANADIAN_PROVINCES,
  isCanadianProvinceCode,
} from '@/lib/core/canadianProvinces';
import { validateRunwayInputs } from '@/lib/core/validateIntakeSnapshot';

export default function CheckinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journeyId = searchParams.get('journey');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [original, setOriginal] = useState<{
    province: string;
    confirmedCash: string;
    essentialBurn: string;
    debtMinimums: string;
    eiStatus: string;
    eiAmount: string;
  } | null>(null);

  const [confirmedCash, setConfirmedCash] = useState('');
  const [province, setProvince] = useState('');
  const [essentialBurn, setEssentialBurn] = useState('');
  const [debtMinimums, setDebtMinimums] = useState('0');
  const [eiStatus, setEiStatus] = useState('not_applied');
  const [eiAmount, setEiAmount] = useState('');
  const [applicationsSubmitted, setApplicationsSubmitted] = useState('');
  const [employerResponses, setEmployerResponses] = useState('');
  const [interviewsSecured, setInterviewsSecured] = useState('');
  const [offersReceived, setOffersReceived] = useState('');
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
          province: String(data.province ?? ''),
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
        setProvince(loaded.province);
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

    if (!isCanadianProvinceCode(province)) {
      setError('Choose your province or territory.');
      return;
    }

    if (confirmedCash === '' || isNaN(Number(confirmedCash))) {
      setError('Enter your confirmed cash.');
      return;
    }

    if (essentialBurn === '' || Number(essentialBurn) <= 0) {
      setError('Enter your monthly essential costs.');
      return;
    }

    const runwayError = validateRunwayInputs(
      Number(confirmedCash),
      Number(essentialBurn),
      Number(debtMinimums),
    );
    if (runwayError) {
      setError(runwayError);
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
    const offersReceivedNumber = Number(offersReceived);

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

    if (
      offersReceived === '' ||
      !Number.isInteger(offersReceivedNumber) ||
      offersReceivedNumber < 0
    ) {
      setError('Enter offers received as a whole number.');
      return;
    }

    if (!biggestBarrier) {
      setError('Choose your biggest barrier.');
      return;
    }

    const changes: Record<string, number | string | null> = {};

    if (province !== original.province) {
      changes.province = province;
    }

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
          offers_received: offersReceivedNumber,
          biggest_barrier: biggestBarrier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || 'Could not update your plan.',
        );
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
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
      <AuthenticatedNav />

      <p className="mt-14 text-muted text-sm uppercase tracking-widest mb-2">
        Check in
      </p>

      <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
        What changed?
      </h1>

      <p className="max-w-xl text-muted mb-10">
        Tell us what happened in your search, then update any financial details
        that changed.
      </p>

      <div className="max-w-xl space-y-6">
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
          <label className={labelCls} htmlFor="offers-received">
            How many job offers did you receive since your last check-in?
          </label>
          <input
            id="offers-received"
            className={fieldCls}
            type="number"
            min="0"
            step="1"
            value={offersReceived}
            onChange={(e) => setOffersReceived(e.target.value)}
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

        <details className="group mt-10 overflow-hidden rounded-2xl bg-surface shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-surface-2/50">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Optional update</p>
              <h2 className="mt-1 font-display text-2xl text-text">Financial details</h2>
              <p className="mt-1 text-sm text-muted">Open only if your province, cash, costs, debt, or EI changed.</p>
            </div>
            <span aria-hidden className="text-xl text-brand transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="space-y-5 border-t border-hair px-6 py-6">
            <h3 className="font-display text-xl text-text">Your details</h3>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls} htmlFor="province">
            Province or territory
          </label>
          <select
            id="province"
            className={fieldCls}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          >
            <option value="">Select one</option>
            {CANADIAN_PROVINCES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
          <p className="text-muted text-xs">
            Used for provincial resources and your updated plan.
          </p>
        </div>

        <h3 className="pt-4 font-display text-xl text-text">
          Your financial situation
        </h3>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <label className={labelCls}>Monthly essential costs ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={essentialBurn}
              onChange={(e) => setEssentialBurn(e.target.value)}
            />
            <p className="text-xs leading-relaxed text-muted">
              Exclude debt minimums and tax-plan payments entered separately.
            </p>
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
          <p className="text-xs leading-relaxed text-muted">
            Tracked in your plan, but not included in the displayed runway.
          </p>
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
          </div>
        </details>

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
