// app/roadmap/[id]/page.tsx
// Server component. Reads the roadmap (and linked intake) from Supabase
// using the logged-in session, then renders it.
//
// STYLED PROTOTYPE — brand tokens, dark canvas, green accent.
// Mode is shown tonally neutral (no alarm/celebration), per product values.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import LogoutButton from '@/app/components/LogoutButton';
import {
  getAuthedUserId,
  createSupabaseServerClient,
} from '@/lib/supabase/server';

interface RoadmapOutput {
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
        <div className="mb-8 flex justify-end">
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
      'province, employment_type, housing_type, confirmed_cash, essential_burn, ei_status, source, created_at',
    )
    .eq('id', roadmap.intake_id)
    .eq('user_id', userId)
    .maybeSingle();

  // ── BLOCKED (tax unsure) ────────────────────────────────────────────
  if (roadmap.blocked) {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-16">
        <div className="mb-8 flex justify-end">
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

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12">
      <div className="mb-8 flex justify-end">
        <LogoutButton />
      </div>

      {/* Header */}
      <p className="text-muted text-sm uppercase tracking-widest mb-2">
        Your plan
      </p>
      {output?.acknowledgment_line && (
        <h1 className="font-display text-4xl leading-tight mb-8 max-w-md text-balance">
          {output.acknowledgment_line}
        </h1>
      )}

      {/* Runway — the focal card */}
      <section className="rounded-xl border border-hair bg-surface p-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <span className="text-muted text-sm uppercase tracking-widest">
            Where you stand
          </span>
          <span className="rounded-full border border-muted/60 bg-surface-2 px-3 py-1 text-sm font-medium text-text">
            {modeLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-6xl text-brand">
            {roadmap.runway_weeks != null
              ? Number(roadmap.runway_weeks).toFixed(1)
              : '—'}
          </span>
          <span className="text-muted">weeks of runway</span>
        </div>
        {roadmap.runway_date && (
          <p className="text-muted mt-1">until around {roadmap.runway_date}</p>
        )}
        {roadmap.net_monthly_gap != null && (
          <p className="text-muted text-sm mt-3">
            Monthly gap: ${roadmap.net_monthly_gap}
          </p>
        )}
      </section>

      {/* Pressure points */}
      {output?.pressure_points?.length ? (
        <section className="mb-12">
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            What your plan is built around
          </h2>
          <ul className="space-y-2">
            {output.pressure_points.map((p, i) => (
              <li
                key={i}
                className="rounded-lg border border-hair bg-surface px-4 py-3 text-text"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Next move — emphasized */}
      {output?.next_move && (
        <section className="mb-12">
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            Your next move
          </h2>
          <div className="rounded-xl border border-brand-soft bg-surface p-6">
            <p className="text-xl text-text mb-3">{output.next_move.action}</p>
            <p className="text-muted">
              <span className="text-brand">Why this first: </span>
              {output.next_move.why_first}
            </p>
            {output.next_move.boundary_note && (
              <p className="text-muted text-sm mt-3 italic">
                {output.next_move.boundary_note}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Phases */}
      {output?.roadmap?.show && output.roadmap.phases?.length ? (
        <section className="mb-12">
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            Your 30-day roadmap
          </h2>
          <div className="space-y-3">
            {output.roadmap.phases.map((phase, i) => (
              <div
                key={i}
                className="rounded-lg border border-hair bg-surface p-5"
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
      ) : null}

      {/* Linked intake */}
      {intake && (
        <section className="mb-12">
          <h2 className="text-muted text-sm uppercase tracking-widest mb-3">
            Based on
          </h2>
          <div className="rounded-lg border border-hair bg-surface p-5 grid grid-cols-2 gap-y-2 text-sm">
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
      )}

      {/* Check-in CTA */}
      <section className="rounded-xl border border-hair bg-surface p-6">
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