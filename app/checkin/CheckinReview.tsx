import { CANADIAN_PROVINCES } from '../../lib/core/canadianProvinces';
import {
  ACTIVITY_FIELDS,
  EI_LABELS,
  type FinancialDetails,
  type SearchActivity,
} from '../../lib/checkin/checkinForm';

export function FinancialSummary({
  details,
  original,
}: {
  details: FinancialDetails;
  original?: FinancialDetails;
}) {
  const money = (value: string) =>
    value !== '' && Number.isFinite(Number(value))
      ? new Intl.NumberFormat('en-CA', {
          style: 'currency',
          currency: 'CAD',
          maximumFractionDigits: 2,
        }).format(Number(value))
      : 'Check amount';
  const rows: [keyof FinancialDetails, string, string][] = [
    [
      'province',
      'Province or territory',
      CANADIAN_PROVINCES.find(({ code }) => code === details.province)?.name ??
        'Not set',
    ],
    ['confirmedCash', 'Cash on hand', money(details.confirmedCash)],
    ['essentialBurn', 'Monthly essential costs', money(details.essentialBurn)],
    ['debtMinimums', 'Monthly debt minimums', money(details.debtMinimums)],
    ['eiStatus', 'EI status', EI_LABELS[details.eiStatus] ?? 'Not set'],
  ];
  if (details.eiStatus === 'approved' || details.eiStatus === 'receiving')
    rows.push(['eiAmount', 'Monthly EI amount', money(details.eiAmount)]);
  return (
    <dl className="divide-y divide-hair">
      {rows.map(([key, label, value]) => (
        <div
          key={key}
          className="flex flex-wrap justify-between gap-x-5 gap-y-1 py-3 text-sm"
        >
          <dt className="text-muted">{label}</dt>
          <dd className="text-right text-text">
            {value}
            {original && details[key] !== original[key] ? (
              <span className="ml-2 text-xs text-brand">Updated</span>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function CheckinReview({
  activity,
  details,
  original,
  period,
  onEdit,
}: {
  activity: SearchActivity;
  details: FinancialDetails;
  original: FinancialDetails;
  period: string;
  onEdit: (step: 0 | 1) => void;
}) {
  return (
    <div className="space-y-8">
      <section aria-labelledby="review-search">
        <div className="flex items-center justify-between gap-4">
          <h2 id="review-search" className="font-display text-2xl">
            Your search
          </h2>
          <button
            type="button"
            onClick={() => onEdit(0)}
            className="min-h-11 text-sm text-brand hover:underline"
          >
            Edit search
          </button>
        </div>
        <p className="mt-1 text-sm text-muted">{period}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTIVITY_FIELDS.map(([key, label]) => (
            <div key={key} className="rounded-xl bg-surface-2 px-4 py-4">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1 font-display text-3xl">{activity[key]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-sm text-muted">Biggest barrier</p>
        <p className="mt-1 text-text">{activity.biggestBarrier}</p>
      </section>
      <section aria-labelledby="review-finances">
        <div className="flex items-center justify-between gap-4">
          <h2 id="review-finances" className="font-display text-2xl">
            Your situation
          </h2>
          <button
            type="button"
            onClick={() => onEdit(1)}
            className="min-h-11 text-sm text-brand hover:underline"
          >
            Edit situation
          </button>
        </div>
        <FinancialSummary details={details} original={original} />
      </section>
      <p className="text-sm leading-relaxed text-muted">
        Updating creates a new roadmap. Your previous plan stays in your
        history.
      </p>
    </div>
  );
}
