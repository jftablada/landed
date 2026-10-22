'use client';

// app/checkin/CheckinClient.tsx

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedNav from '@/app/components/AuthenticatedNav';
import { CANADIAN_PROVINCES } from '@/lib/core/canadianProvinces';
import { protectUnsavedForm } from '@/lib/forms/unsavedFormGuard';
import {
  activityPeriod,
  validateFinancialDetails,
  validateSearchActivity,
  type FinancialDetails,
} from '@/lib/checkin/checkinForm';
import CheckinReview, { FinancialSummary } from './CheckinReview';

export default function CheckinClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const journeyId = searchParams.get('journey');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [dirty, setDirty] = useState(false);
  const [navigationNotice, setNavigationNotice] = useState(false);
  const [activitySince, setActivitySince] = useState<string | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const releaseGuard = useRef<(() => void) | null>(null);
  const posting = useRef(false);

  const [original, setOriginal] = useState<FinancialDetails | null>(null);

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
  const details = {
    province,
    confirmedCash,
    essentialBurn,
    debtMinimums,
    eiStatus,
    eiAmount,
  };
  const activity = {
    applicationsSubmitted,
    employerResponses,
    interviewsSecured,
    offersReceived,
    biggestBarrier,
  };
  const period = activityPeriod(activitySince);

  useEffect(() => {
    if (!dirty && !submitting) return;
    const cleanup = protectUnsavedForm(() => {
      setError(null);
      setNavigationNotice(true);
    });
    releaseGuard.current = cleanup;
    return () => {
      cleanup();
      releaseGuard.current = null;
    };
  }, [dirty, submitting]);

  useEffect(() => {
    if (!loading) heading.current?.focus();
  }, [step, loading]);
  useEffect(() => {
    if (error || navigationNotice)
      document.getElementById('checkin-message')?.focus();
  }, [error, navigationNotice]);

  function moveTo(next: 0 | 1 | 2) {
    setError(null);
    setNavigationNotice(false);
    setStep(next);
  }

  function continueStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || !original) return;
    if (step === 2) {
      void handleSubmit();
      return;
    }
    const message =
      step === 0
        ? validateSearchActivity(activity)
        : validateFinancialDetails(details);
    if (message) {
      setError(message);
      return;
    }
    moveTo(step === 0 ? 1 : 2);
  }

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
        setActivitySince(
          typeof data.activity_since === 'string' ? data.activity_since : null,
        );
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
    if (posting.current) return;
    setError(null);

    if (!journeyId) {
      setError('Missing journey.');
      return;
    }

    if (!original) {
      setError('Your current plan has not loaded yet.');
      return;
    }

    const searchError = validateSearchActivity(activity);
    const financialError = validateFinancialDetails(details);
    if (searchError || financialError) {
      setStep(searchError ? 0 : 1);
      setError(searchError || financialError);
      return;
    }
    const applicationsSubmittedNumber = Number(applicationsSubmitted);
    const employerResponsesNumber = Number(employerResponses);
    const interviewsSecuredNumber = Number(interviewsSecured);
    const offersReceivedNumber = Number(offersReceived);

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

    posting.current = true;
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

      if (typeof data.roadmap_id !== 'string' || !data.roadmap_id)
        throw new Error('Your plan could not be opened. Please try again.');
      releaseGuard.current?.();
      setDirty(false);
      router.push(`/roadmap/${data.roadmap_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
      posting.current = false;
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

      <p className="mb-4 text-sm text-muted" aria-live="polite">
        Step {step + 1} of 3 ·{' '}
        {['Your search', 'Your situation', 'Review'][step]}
      </p>
      <h1
        ref={heading}
        tabIndex={-1}
        className="font-display text-4xl leading-tight mb-2 max-w-xl text-balance focus:outline-none"
      >
        {
          [
            'How has your search been?',
            'Is your situation still current?',
            'Ready to update your plan?',
          ][step]
        }
      </h1>

      <p className="max-w-xl text-muted mb-10">
        {step === 0
          ? `${period}. Enter 0 where nothing happened yet—there’s no target to hit.`
          : step === 1
            ? 'We’ve kept your saved details. Review them and edit only what changed.'
            : 'Check your answers. Nothing is submitted until you choose Update my plan.'}
      </p>

      <form
        noValidate
        onSubmit={continueStep}
        onChange={() => setDirty(true)}
        className="max-w-xl rounded-2xl bg-surface p-6 shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:p-8"
        aria-busy={submitting}
      >
        <fieldset disabled={submitting || !original}>
          <div hidden={step !== 0} className="space-y-6">
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
          </div>
          <div hidden={step !== 1}>
            {original ? (
              <FinancialSummary details={details} original={original} />
            ) : null}
            <details
              className="group mt-6 overflow-hidden rounded-xl bg-surface-2"
              open={error && step === 1 ? true : undefined}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 hover:bg-surface-2/50">
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted">
                    Optional update
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-text">
                    Edit saved details
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Open only if your province, cash, costs, debt, or EI
                    changed.
                  </p>
                </div>
                <span
                  aria-hidden
                  className="text-xl text-brand transition-transform group-open:rotate-45"
                >
                  +
                </span>
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
                    <label className={labelCls} htmlFor="cash">
                      Cash on hand ($)
                    </label>
                    <input
                      id="cash"
                      className={fieldCls}
                      type="number"
                      min="0"
                      value={confirmedCash}
                      onChange={(e) => setConfirmedCash(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls} htmlFor="costs">
                      Monthly essential costs ($)
                    </label>
                    <input
                      id="costs"
                      className={fieldCls}
                      type="number"
                      min="0"
                      value={essentialBurn}
                      onChange={(e) => setEssentialBurn(e.target.value)}
                    />
                    <p className="text-xs leading-relaxed text-muted">
                      Exclude debt minimums and tax-plan payments entered
                      separately.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls} htmlFor="debt">
                    Monthly minimum debt payments ($)
                  </label>
                  <input
                    id="debt"
                    className={fieldCls}
                    type="number"
                    min="0"
                    value={debtMinimums}
                    onChange={(e) => setDebtMinimums(e.target.value)}
                  />
                  <p className="text-xs leading-relaxed text-muted">
                    Tracked in your plan, but not included in the displayed
                    runway.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={labelCls} htmlFor="ei-status">
                    EI status
                  </label>
                  <select
                    id="ei-status"
                    className={fieldCls}
                    value={eiStatus}
                    onChange={(e) => setEiStatus(e.target.value)}
                  >
                    <option value="not_applied">Haven’t applied yet</option>
                    <option value="applied">Applied, waiting to hear</option>
                    <option value="approved">
                      Approved, payments haven’t started
                    </option>
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
                      Pick “Receiving payments now” once the money is actually
                      landing.
                    </p>
                  </div>
                )}

                {(eiStatus === 'approved' || eiStatus === 'receiving') && (
                  <div className="flex flex-col gap-1.5">
                    <label className={labelCls} htmlFor="ei-amount">
                      EI amount per month ($)
                    </label>
                    <input
                      id="ei-amount"
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
          </div>
          {step === 2 && original ? (
            <CheckinReview
              activity={activity}
              details={details}
              original={original}
              period={period}
              onEdit={moveTo}
            />
          ) : null}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <button
              type="submit"
              className="min-h-12 rounded-xl bg-brand px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting
                ? 'Updating your plan…'
                : step === 0
                  ? 'Continue to your situation'
                  : step === 1
                    ? 'Review my check-in'
                    : 'Update my plan'}
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => moveTo(step === 2 ? 1 : 0)}
                className="min-h-12 text-sm text-muted hover:text-text"
              >
                Back
              </button>
            ) : null}
          </div>
        </fieldset>
        {error || navigationNotice ? (
          <div
            id="checkin-message"
            tabIndex={-1}
            role="alert"
            className="mt-6 rounded-xl border border-hair bg-surface-2 p-4 text-sm leading-relaxed text-text"
          >
            <p>
              {error ||
                (submitting
                  ? 'Your plan is updating. Please wait before leaving.'
                  : 'Your answers haven’t been submitted. Finish your check-in or discard your answers before leaving.')}
            </p>
            {navigationNotice && !submitting ? (
              <button
                type="button"
                onClick={() => {
                  releaseGuard.current?.();
                  setDirty(false);
                  router.push('/start');
                }}
                className="mt-3 min-h-11 text-muted underline underline-offset-4"
              >
                Discard answers and return to Today
              </button>
            ) : null}
          </div>
        ) : null}
        <p className="mt-5 text-xs leading-relaxed text-muted">
          Answers stay on this page until you submit. They aren’t saved as a
          draft.
        </p>
      </form>
    </main>
  );
}
