// app/roadmap/[id]/page.tsx
// Server component. Reads the roadmap (and linked intake) from Supabase
// using the logged-in session, then renders it.
//
// STYLED PROTOTYPE — brand tokens, dark canvas, green accent.
// Mode is shown tonally neutral (no alarm/celebration), per product values.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/app/components/LogoutButton';
import AuthenticatedNav from '@/app/components/AuthenticatedNav';
import DisclosureSection from '@/app/components/DisclosureSection';
import WeeklyTasksClient from './WeeklyTasksClient';
import ExploreRunway from './ExploreRunway';
import type { AdaptivePayload } from '@/lib/core/generateRoadmapForIntake';
import {
  getAuthedUserId,
  createSupabaseServerClient,
} from '@/lib/supabase/server';

interface RoadmapOutput {
  runway?: {
    display_state: 'exhausted' | 'critical' | 'normal';
    figure: string | null;
    show_date: boolean;
    runway_date: string | null;
    body: string;
    net_monthly_gap: number | null;
    runway_weeks: number | null;
  };
  adaptive?: AdaptivePayload;
  acknowledgment_line: string;
  pressure_points: string[];
  next_move: {
    action: string;
    why_first: string;
    boundary_note: string | null;
  };
  roadmap: {
    show: boolean;
    phases: { title: string; actions: string[] }[];
  };
  tools_surfaced: string[];
}

const MODE_LABEL: Record<string, string> = {
  critical: 'Stabilize first',
  survival: 'Short runway',
  balanced: 'Room to act',
  strategic: 'Room to choose',
};

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const userId = await getAuthedUserId();
  if (!userId) redirect('/login');

  const supabase = await createSupabaseServerClient();

  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!roadmap) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/start" className="text-sm text-muted hover:text-text">
            ← Back to my home
          </Link>
          <LogoutButton />
        </div>

        <h1 className="font-display text-4xl mb-2">Roadmap not found</h1>
        <p className="text-muted">
          This roadmap doesn’t exist, or it isn’t yours to view.
        </p>
        <Link href="/" className="text-brand mt-6 inline-block">
          ← Back home
        </Link>
      </main>
    );
  }

  const { data: intake } = await supabase
    .from('intakes')
    .select(
      'province, employment_type, housing_type, confirmed_cash, essential_burn, tax_obligation_status, tax_obligation_amount, tax_plan_monthly, ei_status, ei_monthly_amount, source, created_at',
    )
    .eq('id', roadmap.intake_id)
    .eq('user_id', userId)
    .maybeSingle();

  // ── BLOCKED (tax unsure) ────────────────────────────────────────────
  if (roadmap.blocked) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/start" className="text-sm text-muted hover:text-text">
            ← Back to my home
          </Link>
          <LogoutButton />
        </div>

        <h1 className="font-display text-4xl mb-3">Let’s get one number first</h1>
        <p className="text-text leading-relaxed">
          We can’t build an accurate plan until we know roughly what you owe
          in taxes. Even a rough range helps. Check your CRA balance, then
          start a check-in and we’ll build your plan around the real picture.
        </p>
        <Link
          href={`/checkin?journey=${roadmap.journey_id}`}
          className="mt-8 inline-block rounded-lg bg-brand px-5 py-3 font-medium text-black"
        >
          Start a check-in
        </Link>
      </main>
    );
  }

  const output: RoadmapOutput | null =
    typeof roadmap.output_json === 'string'
      ? JSON.parse(roadmap.output_json)
      : roadmap.output_json;

  const modeLabel = roadmap.computed_mode
    ? MODE_LABEL[roadmap.computed_mode] ?? roadmap.computed_mode
    : '—';

  const acknowledgmentParts = output?.acknowledgment_line.match(
    /^(.*?)\s*(\(until around [^)]+\))\.\s*(.+)$/,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-12">
      <AuthenticatedNav roadmapId={roadmap.id} />

      {/* Header */}
      <p className="mt-14 text-muted text-sm uppercase tracking-widest mb-2">
        Your plan
      </p>
      {output?.acknowledgment_line && (
        <h1 className="font-display text-4xl leading-[1.15] mb-8 w-full">
          {acknowledgmentParts ? (
            <>
              <span className="block">{acknowledgmentParts[1]}</span>
              <span className="mt-1 block">{acknowledgmentParts[2]}</span>
              <span className="mt-3 block">{acknowledgmentParts[3]}</span>
            </>
          ) : (
            output.acknowledgment_line
          )}
        </h1>
      )}

      {output?.next_move && (
        <section className="mb-10 rounded-2xl bg-surface p-7 shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:p-9">
          <p className="text-xs uppercase tracking-[0.18em] text-brand">Your next move</p>
          <h2 className="mt-3 text-3xl leading-snug text-text">{output.next_move.action}</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">{output.next_move.why_first}</p>
          {output.next_move.boundary_note ? <p className="mt-3 text-sm italic text-muted">{output.next_move.boundary_note}</p> : null}
          <a href="#weekly-tasks-heading" className="mt-7 inline-block rounded-xl bg-brand px-6 py-3.5 font-semibold text-black hover:opacity-90">Open this week’s actions</a>
        </section>
      )}

      <WeeklyTasksClient roadmapId={roadmap.id} />

      <div className="space-y-4">
        <DisclosureSection
          eyebrow="Your context"
          title="Financial runway"
          summary="The numbers behind your current room to move."
        >

      {/* Runway — the focal card */}
      <section className="rounded-xl bg-surface-2 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted text-sm uppercase tracking-widest">
            Where you stand
          </span>
          <span className="rounded-full border border-muted/60 bg-surface-2 px-3 py-1 text-sm font-medium text-text">
            {modeLabel}
          </span>
        </div>
        {output?.runway?.figure ? (
  <div className="flex items-baseline gap-2">
    <span className="font-display text-6xl text-brand">
      {output.runway.figure}
    </span>
  </div>
) : null}

{!output?.runway?.figure && output?.runway?.body && (
  <p className="text-muted mt-1">{output.runway.body}</p>
)}

{output?.runway?.show_date && output?.runway?.runway_date && (
  <p className="text-muted text-sm mt-1">
    until around {output.runway.runway_date}
  </p>
)}
        {roadmap.net_monthly_gap != null && (
          <p className="text-muted text-sm mt-3">
            Monthly gap: ${roadmap.net_monthly_gap}
          </p>
        )}
      </section>

      {intake && (
        <ExploreRunway
          baselineCash={Math.max(
            0,
            Number(intake.confirmed_cash) -
              (intake.tax_obligation_status === 'has_amount'
                ? Number(intake.tax_obligation_amount ?? 0)
                : 0),
          )}
          baselineMonthlyCosts={
            Number(intake.essential_burn) +
            (intake.tax_obligation_status === 'on_plan'
              ? Number(intake.tax_plan_monthly ?? 0)
              : 0)
          }
          baselineMonthlyIncome={
            intake.ei_status === 'receiving'
              ? Number(intake.ei_monthly_amount ?? 0)
              : 0
          }
        />
      )}
        </DisclosureSection>

      {/* Adaptive check-in — present only on activity-aware roadmaps */}
      {output?.adaptive ? (
        <DisclosureSection
          eyebrow="Progress"
          title="Since your last check-in"
          summary={output.adaptive.what_changed}
        >
        <section
          className={`rounded-xl bg-surface-2 p-6 ${
            output.adaptive.diagnosis_withheld
              ? 'border-hair'
              : 'border-brand-soft'
          }`}
        >
          <h2 className="text-muted text-sm uppercase tracking-widest mb-5">
            Since your last check-in
          </h2>
          <div className="space-y-5">
            <div>
              <h3 className="text-muted text-sm mb-1">What changed</h3>
              <p className="text-text leading-relaxed">
                {output.adaptive.what_changed}
              </p>
            </div>
            <div>
              <h3 className="text-muted text-sm mb-1">What this suggests</h3>
              <p className="text-text leading-relaxed">
                {output.adaptive.what_this_suggests}
              </p>
            </div>
            <div>
              <h3 className="text-muted text-sm mb-1">
                This week&apos;s priority
              </h3>
              <p className="text-text text-lg leading-relaxed">
                {output.adaptive.this_weeks_priority}
              </p>
            </div>
            <div>
              <h3 className="text-muted text-sm mb-1">Why</h3>
              <p className="text-muted leading-relaxed">
                {output.adaptive.why}
              </p>
            </div>
          </div>
        </section>
        </DisclosureSection>
      ) : null}

      {/* Pressure points */}
      {output?.pressure_points?.length ? (
        <DisclosureSection
          eyebrow="Strategy"
          title="What your plan is built around"
          summary="The pressures shaping your current priorities."
        >
        <section>
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            What your plan is built around
          </h2>
          <ul className="space-y-2">
            {output.pressure_points.map((p, i) => (
              <li
                key={i}
                className="rounded-xl bg-surface-2 px-4 py-3 text-text"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
        </DisclosureSection>
      ) : null}

      {/* Next move — emphasized */}
      {/* Phases */}
      {output?.roadmap?.show && output.roadmap.phases?.length ? (
        <DisclosureSection
          eyebrow="Your plan"
          title="30-day roadmap"
          summary="Open the full sequence when you’re ready to look beyond this week."
        >
        <section>
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            Your 30-day roadmap
          </h2>
          <div className="space-y-3">
            {output.roadmap.phases.map((phase, i) => (
              <div
                key={i}
                className="rounded-xl bg-surface-2 p-5"
              >
                <p className="font-display text-2xl mb-2">{phase.title}</p>
                <ul className="space-y-1.5">
                  {phase.actions.map((a, j) => (
                    <li key={j} className="text-text flex gap-2">
                      <span className="text-brand">→</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
        </DisclosureSection>
      ) : null}

      {/* Linked intake */}
      {intake && (
        <DisclosureSection
          eyebrow="Details"
          title="What this plan is based on"
          summary="Your latest location and financial snapshot."
        >
        <section>
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            Based on
          </h2>
          <div className="grid grid-cols-2 gap-y-2 rounded-xl bg-surface-2 p-5 text-sm">
            <span className="text-muted">Province</span>
            <span className="text-text">{intake.province}</span>
            <span className="text-muted">Cash on hand</span>
            <span className="text-text">${intake.confirmed_cash}</span>
            <span className="text-muted">Monthly costs</span>
            <span className="text-text">${intake.essential_burn}/mo</span>
            <span className="text-muted">EI status</span>
            <span className="text-text">{intake.ei_status}</span>
          </div>
        </section>
        </DisclosureSection>
      )}
      </div>

      {/* Check-in CTA */}
      <section className="mt-10 rounded-2xl bg-surface p-7 sm:p-8">
        <h2 className="font-display text-2xl mb-1">Something changed?</h2>
        <p className="text-muted mb-4">
          If your finances have shifted, do a check-in and we’ll update your
          plan around what’s real now.
        </p>
        
        <Link
          href={`/checkin?journey=${roadmap.journey_id}`}
          className="inline-block rounded-lg bg-brand px-5 py-3 font-medium text-black"
        >
          Start a check-in
        </Link>
        <p className="text-muted text-sm mt-4">
  Last updated {new Date(roadmap.created_at).toLocaleDateString()}
</p>
<p className="text-muted text-sm mt-2">
Your plan is built from your current cash, monthly obligations, tax status, and support eligibility. Check in anytime things change.
</p>
      </section>
    </main>
  );
}
