'use client';

// app/intake/page.tsx — STYLED to the Landed design system.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LogoutButton from '@/app/components/LogoutButton';

const PROVINCES = [
  'AB',
  'BC',
  'MB',
  'NB',
  'NL',
  'NS',
  'NT',
  'NU',
  'ON',
  'PE',
  'QC',
  'SK',
  'YT',
];

export default function IntakePage() {
  const router = useRouter();

  const [situationType, setSituationType] = useState('laid_off');
  const [employmentType, setEmploymentType] = useState('employee');
  const [province, setProvince] = useState('ON');
  const [housingType, setHousingType] = useState('rent');
  const [dependentsCount, setDependentsCount] = useState('0');
  const [confirmedCash, setConfirmedCash] = useState('');
  const [essentialBurn, setEssentialBurn] = useState('');
  const [debtMinimums, setDebtMinimums] = useState('0');
  const [taxStatus, setTaxStatus] = useState('none');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxPlanMonthly, setTaxPlanMonthly] = useState('');
  const [eiStatus, setEiStatus] = useState('not_applied');
  const [eiAmount, setEiAmount] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const taxUnsure = taxStatus === 'unsure';

  async function handleSubmit() {
    setError(null);

    if (taxUnsure) {
      setError('Please check your CRA balance first, then come back.');
      return;
    }
    if (confirmedCash === '' || isNaN(Number(confirmedCash))) {
      setError('Enter your confirmed cash (a number).');
      return;
    }
    if (essentialBurn === '' || Number(essentialBurn) <= 0) {
      setError('Enter your essential monthly burn (greater than 0).');
      return;
    }
    if (
      taxStatus === 'has_amount' &&
      (taxAmount === '' || isNaN(Number(taxAmount)))
    ) {
      setError('Enter roughly how much tax you owe.');
      return;
    }
    if (
      taxStatus === 'on_plan' &&
      (taxPlanMonthly === '' || isNaN(Number(taxPlanMonthly)))
    ) {
      setError('Enter your monthly tax payment.');
      return;
    }
    if (
      (eiStatus === 'approved' || eiStatus === 'receiving') &&
      (eiAmount === '' || isNaN(Number(eiAmount)))
    ) {
      setError('Enter your monthly EI amount.');
      return;
    }

    setSubmitting(true);
    try {
      const intakeBody = {
        situation_type: situationType,
        employment_type: employmentType,
        province,
        housing_type: housingType,
        dependents_count: Number(dependentsCount) || 0,
        confirmed_cash: Number(confirmedCash),
        essential_burn: Number(essentialBurn),
        debt_minimums: Number(debtMinimums) || 0,
        tax_obligation_status: taxStatus,
        tax_obligation_amount:
          taxStatus === 'has_amount' ? Number(taxAmount) : null,
        tax_plan_monthly:
          taxStatus === 'on_plan' ? Number(taxPlanMonthly) : null,
        ei_status: eiStatus,
        ei_monthly_amount:
          eiStatus === 'approved' || eiStatus === 'receiving'
            ? Number(eiAmount)
            : null,
      };

      const intakeRes = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intakeBody),
      });

      const intakeData = await intakeRes.json();
      if (!intakeRes.ok) {
        throw new Error(intakeData.error || 'Could not save your intake.');
      }

      const genRes = await fetch('/api/roadmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intake_id: intakeData.intake_id }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) {
        throw new Error(
          genData.error || 'Saved your intake, but could not build the plan.',
        );
      }

      router.push(`/roadmap/${genData.roadmap_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  }

  // Shared field classes for the dark form system.
  const labelCls = 'text-muted text-sm';
  const fieldCls =
    'rounded-lg border border-hair bg-surface px-3 py-2.5 text-text text-base ' +
    'focus:border-brand focus:outline-none';

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
        ← Back to my latest plan
      </a>
    </div>

    <p className="text-muted text-sm uppercase tracking-widest mb-2">
      Get started
    </p>

 
      <h1 className="font-display text-4xl leading-tight mb-2 max-w-md text-balance">
        Let’s build your plan
      </h1>
      <p className="text-muted mb-10">
        A few quick questions. Takes about two minutes.
      </p>

      <div className="space-y-5">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>What happened?</label>
          <select
            className={fieldCls}
            value={situationType}
            onChange={(e) => setSituationType(e.target.value)}
          >
            <option value="laid_off">I was laid off</option>
            <option value="non_renewal">My contract wasn’t renewed</option>
            <option value="contract_ending">My contract is ending soon</option>
            <option value="pivot">I’m changing careers</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Your work type</label>
          <select
            className={fieldCls}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="sole_proprietor">Sole proprietor</option>
            <option value="incorporated">Incorporated contractor</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Province</label>
            <select
              className={fieldCls}
              value={province}
              onChange={(e) => setProvince(e.target.value)}
            >
              {PROVINCES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Rent or own?</label>
            <select
              className={fieldCls}
              value={housingType}
              onChange={(e) => setHousingType(e.target.value)}
            >
              <option value="rent">I rent</option>
              <option value="own">I own</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>
            How many people depend on your income?
          </label>
          <input
            className={fieldCls}
            type="number"
            min="0"
            value={dependentsCount}
            onChange={(e) => setDependentsCount(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Cash on hand ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={confirmedCash}
              onChange={(e) => setConfirmedCash(e.target.value)}
              placeholder="8000"
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
              placeholder="3000"
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
          <label className={labelCls}>Do you owe any taxes?</label>
          <select
            className={fieldCls}
            value={taxStatus}
            onChange={(e) => setTaxStatus(e.target.value)}
          >
            <option value="none">No outstanding taxes</option>
            <option value="has_amount">Yes, and I know roughly how much</option>
            <option value="on_plan">Yes, but I’m on a payment plan</option>
            <option value="unsure">I’m not sure</option>
          </select>
        </div>

        {taxStatus === 'has_amount' && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Roughly how much do you owe? ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
          </div>
        )}

        {taxStatus === 'on_plan' && (
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Monthly payment on that plan ($)</label>
            <input
              className={fieldCls}
              type="number"
              min="0"
              value={taxPlanMonthly}
              onChange={(e) => setTaxPlanMonthly(e.target.value)}
            />
          </div>
        )}

        {taxUnsure && (
          <div className="rounded-lg border border-brand-soft bg-surface p-4">
            <p className="text-text font-medium mb-1">
              Let’s get one number first
            </p>
            <p className="text-muted text-sm">
              Check your CRA My Account for any balance owing — even a rough
              figure works — then come back and pick one of the other options.
              We can’t build an accurate plan without it.
            </p>
          </div>
        )}

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
          disabled={submitting || taxUnsure}
          className="mt-2 rounded-lg bg-brand px-5 py-3 font-medium text-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Building your plan…' : 'Build my plan'}
        </button>
      </div>
    </main>
  );
}