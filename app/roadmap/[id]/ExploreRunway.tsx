'use client';

import { useMemo, useRef, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { calculateRunwayScenario } from '@/lib/core/exploreRunway';

interface ExploreRunwayProps {
  baselineCash: number;
  baselineMonthlyCosts: number;
  baselineMonthlyIncome: number;
}

const money = new Intl.NumberFormat('en-CA', {
  style: 'currency',
  currency: 'CAD',
  maximumFractionDigits: 0,
});

function toAmount(value: string): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.max(0, amount) : 0;
}

export default function ExploreRunway({
  baselineCash,
  baselineMonthlyCosts,
  baselineMonthlyIncome,
}: ExploreRunwayProps) {
  const [monthlyCostReduction, setMonthlyCostReduction] = useState('0');
  const [addedMonthlyIncome, setAddedMonthlyIncome] = useState('0');
  const [addedCashCushion, setAddedCashCushion] = useState('0');
  const tracked = useRef(false);

  const scenario = useMemo(
    () =>
      calculateRunwayScenario({
        baselineCash,
        baselineMonthlyCosts,
        baselineMonthlyIncome,
        monthlyCostReduction: toAmount(monthlyCostReduction),
        addedMonthlyIncome: toAmount(addedMonthlyIncome),
        addedCashCushion: toAmount(addedCashCushion),
      }),
    [
      addedCashCushion,
      addedMonthlyIncome,
      baselineCash,
      baselineMonthlyCosts,
      baselineMonthlyIncome,
      monthlyCostReduction,
    ],
  );

  const changed =
    toAmount(monthlyCostReduction) > 0 ||
    toAmount(addedMonthlyIncome) > 0 ||
    toAmount(addedCashCushion) > 0;

  function recordExploration() {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent('runway_scenario_explored');
  }

  function update(
    setter: (value: string) => void,
    value: string,
  ) {
    setter(value);
    if (toAmount(value) > 0) recordExploration();
  }

  function reset() {
    setMonthlyCostReduction('0');
    setAddedMonthlyIncome('0');
    setAddedCashCushion('0');
  }

  const fieldClass =
    'mt-2 w-full rounded-lg border border-hair bg-surface-2 px-3 py-2.5 text-text focus:border-brand focus:outline-none';

  return (
    <section className="mb-12 rounded-xl border border-brand/30 bg-surface p-6 sm:p-8">
      <p className="text-sm uppercase tracking-widest text-brand">
        Explore your runway
      </p>
      <h2 className="mt-2 font-display text-3xl text-text">
        See what could give you more room
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Try a few hypothetical changes. These numbers stay in your browser and
        do not alter your saved roadmap.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <label className="text-sm text-muted">
          Reduce monthly costs by
          <input
            type="number"
            min="0"
            step="50"
            inputMode="decimal"
            value={monthlyCostReduction}
            onChange={(event) =>
              update(setMonthlyCostReduction, event.target.value)
            }
            className={fieldClass}
          />
        </label>
        <label className="text-sm text-muted">
          Add monthly income
          <input
            type="number"
            min="0"
            step="50"
            inputMode="decimal"
            value={addedMonthlyIncome}
            onChange={(event) => update(setAddedMonthlyIncome, event.target.value)}
            className={fieldClass}
          />
        </label>
        <label className="text-sm text-muted">
          Add a one-time cash cushion
          <input
            type="number"
            min="0"
            step="100"
            inputMode="decimal"
            value={addedCashCushion}
            onChange={(event) => update(setAddedCashCushion, event.target.value)}
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-7 rounded-xl bg-surface-2 p-5">
        <p className="text-xs uppercase tracking-widest text-muted">
          {changed ? 'In this scenario' : 'Your current effective runway'}
        </p>
        {scenario.costsCovered ? (
          <>
            <p className="mt-2 font-display text-4xl text-brand">
              Monthly costs covered
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              At these amounts, monthly income meets or exceeds ongoing costs.
              A fixed runway date is not shown.
            </p>
          </>
        ) : (
          <>
            <p className="mt-2 font-display text-5xl text-brand">
              About {Math.max(0, Math.round(scenario.runwayWeeks ?? 0))} weeks
            </p>
            <p className="mt-2 text-sm text-muted">
              Through approximately {scenario.runwayDate} · monthly gap{' '}
              {money.format(Math.max(0, scenario.monthlyGap))}
            </p>
            {changed && scenario.weeksChanged !== null && (
              <p className="mt-3 text-sm font-medium text-text">
                {scenario.weeksChanged >= 0 ? '+' : ''}
                {Math.round(scenario.weeksChanged)} weeks compared with your
                current effective runway
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-lg text-xs leading-relaxed text-muted">
          Scenario only—not financial, legal, tax, or benefits advice. Confirm
          real changes through a check-in before relying on an updated plan.
        </p>
        {changed && (
          <button
            type="button"
            onClick={reset}
            className="text-sm text-muted underline underline-offset-4 hover:text-text"
          >
            Reset scenario
          </button>
        )}
      </div>
    </section>
  );
}
