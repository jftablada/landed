import Link from 'next/link';
import { redirect } from 'next/navigation';

import LogoutButton from '@/app/components/LogoutButton';
import { deriveWeeklyTasks } from '@/lib/core/deriveWeeklyTasks';
import type { RoadmapOutput } from '@/lib/core/generateRoadmapForIntake';
import {
  createSupabaseServerClient,
  getAuthedUserId,
} from '@/lib/supabase/server';

const MODE_LABEL: Record<string, string> = {
  critical: 'Stabilize first',
  survival: 'Short runway',
  balanced: 'Room to act',
  strategic: 'Room to choose',
};

function parseOutput(value: unknown): RoadmapOutput | null {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object'
      ? (parsed as RoadmapOutput)
      : null;
  } catch {
    return null;
  }
}

function updateLabel(isoDate: string): string {
  const elapsed = Date.now() - new Date(isoDate).getTime();
  const days = Math.max(0, Math.floor(elapsed / 86_400_000));
  if (days === 0) return 'Updated today';
  if (days === 1) return 'Updated yesterday';
  return `Updated ${days} days ago`;
}

export default async function StartPage() {
  const userId = await getAuthedUserId();
  if (!userId) redirect('/login');

  const supabase = await createSupabaseServerClient();
  const { data: journey } = await supabase
    .from('journeys')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!journey) redirect('/intake');

  const { data: roadmaps } = await supabase
    .from('roadmaps')
    .select('id, journey_id, blocked, computed_mode, created_at, output_json')
    .eq('user_id', userId)
    .eq('journey_id', journey.id)
    .order('created_at', { ascending: false })
    .limit(6);

  const roadmap = roadmaps?.[0];
  if (!roadmap) redirect('/intake');

  const output = parseOutput(roadmap.output_json);
  const weeklyTasks =
    !roadmap.blocked && output ? deriveWeeklyTasks(output) : [];
  const [{ data: progress }, { data: checkIns }] = await Promise.all([
    supabase
      .from('roadmap_task_progress')
      .select('task_key, completed')
      .eq('roadmap_id', roadmap.id)
      .eq('user_id', userId),
    supabase
      .from('check_ins')
      .select(
        'new_roadmap_id, previous_roadmap_id, mode_changed, previous_mode, new_mode, change_summary, applications_submitted, employer_responses, interviews_secured, offers_received, created_at',
      )
      .eq('user_id', userId)
      .in(
        'new_roadmap_id',
        (roadmaps ?? []).map((item) => item.id),
      ),
  ]);
  const latestCheckIn = checkIns?.find(
    (checkIn) => checkIn.new_roadmap_id === roadmap.id,
  );

  const completedKeys = new Set(
    (progress ?? [])
      .filter((item) => item.completed)
      .map((item) => item.task_key),
  );
  const nextTask = weeklyTasks.find((task) => !completedKeys.has(task.key));
  const completedCount = weeklyTasks.filter((task) =>
    completedKeys.has(task.key),
  ).length;
  const completionPercent = weeklyTasks.length
    ? Math.round((completedCount / weeklyTasks.length) * 100)
    : 0;
  const hasActivity =
    latestCheckIn?.applications_submitted != null ||
    latestCheckIn?.employer_responses != null ||
    latestCheckIn?.interviews_secured != null ||
    latestCheckIn?.offers_received != null;
  const modeLabel = roadmap.computed_mode
    ? MODE_LABEL[roadmap.computed_mode] ?? roadmap.computed_mode
    : 'Current plan';
  const checkInByRoadmap = new Map(
    (checkIns ?? []).map((checkIn) => [checkIn.new_roadmap_id, checkIn]),
  );

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:py-12">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl tracking-widest text-text">
          LANDED
        </Link>
        <LogoutButton />
      </div>

      <header className="mt-12 border-b border-hair pb-10">
        <p className="text-sm uppercase tracking-widest text-brand">
          Your command centre
        </p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-5xl leading-none text-text sm:text-6xl">
              What matters today.
            </h1>
            <p className="mt-4 text-muted">
              {updateLabel(roadmap.created_at)} · {modeLabel}
            </p>
          </div>
          <Link
            href={`/roadmap/${roadmap.id}`}
            className="w-fit text-sm text-muted underline underline-offset-4 hover:text-text"
          >
            View full roadmap →
          </Link>
        </div>
      </header>

      {roadmap.blocked ? (
        <section className="mt-8 rounded-xl border border-brand/30 bg-surface p-6 sm:p-8">
          <p className="text-sm uppercase tracking-widest text-brand">
            One detail needed
          </p>
          <h2 className="mt-3 font-display text-3xl text-text">
            Confirm your tax balance to unlock your plan.
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Landed needs a rough tax amount before it can calculate a responsible
            roadmap. Check your CRA balance, then update your information.
          </p>
          <Link
            href={`/checkin?journey=${roadmap.journey_id}`}
            className="mt-6 inline-block rounded-lg bg-brand px-5 py-3 font-medium text-black"
          >
            Complete a check-in
          </Link>
        </section>
      ) : (
        <>
          <section className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-xl border border-brand/30 bg-surface p-6 sm:p-8">
              <p className="text-sm uppercase tracking-widest text-brand">
                Your next move
              </p>
              <h2 className="mt-3 text-2xl leading-snug text-text">
                {nextTask?.label ??
                  output?.next_move?.action ??
                  'Review your roadmap and choose one useful action.'}
              </h2>
              {weeklyTasks.length > 0 ? (
                <div className="mt-7">
                  <div className="mb-2 flex justify-between text-sm text-muted">
                    <span>This week</span>
                    <span>{completedCount} of {weeklyTasks.length} done</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              ) : null}
              <Link
                href={`/roadmap/${roadmap.id}#weekly-tasks-heading`}
                className="mt-7 inline-block rounded-lg bg-brand px-5 py-3 font-medium text-black"
              >
                {weeklyTasks.length ? 'Open this week’s tasks' : 'Open my roadmap'}
              </Link>
            </div>

            <div className="rounded-xl border border-hair bg-surface p-6 sm:p-8">
              <p className="text-sm uppercase tracking-widest text-muted">
                Current runway
              </p>
              {output?.runway?.figure ? (
                <p className="mt-3 font-display text-5xl text-brand">
                  {output.runway.figure}
                </p>
              ) : (
                <p className="mt-3 text-lg leading-relaxed text-text">
                  {output?.runway?.body ?? 'See your full plan for the latest view.'}
                </p>
              )}
              {output?.runway?.show_date && output.runway.runway_date ? (
                <p className="mt-2 text-sm text-muted">
                  Through approximately {output.runway.runway_date}
                </p>
              ) : null}
              <p className="mt-5 text-sm text-muted">{modeLabel}</p>
            </div>
          </section>

          <section className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl border border-hair bg-surface p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-widest text-muted">
                    Job-search pulse
                  </p>
                  <h2 className="mt-2 font-display text-2xl text-text">
                    Latest activity
                  </h2>
                </div>
                <Link
                  href={`/checkin?journey=${roadmap.journey_id}`}
                  className="text-sm text-brand hover:underline"
                >
                  Check in
                </Link>
              </div>
              {hasActivity ? (
                <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                  {[
                    ['Applications', latestCheckIn?.applications_submitted ?? 0],
                    ['Responses', latestCheckIn?.employer_responses ?? 0],
                    ['Interviews', latestCheckIn?.interviews_secured ?? 0],
                    ['Offers', latestCheckIn?.offers_received ?? 0],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-surface-2 px-2 py-4">
                      <p className="font-display text-3xl text-text">{value}</p>
                      <p className="mt-1 text-xs text-muted">{label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-5 text-sm leading-relaxed text-muted">
                  Your activity pulse will appear after your first job-search
                  check-in.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-hair bg-surface p-6">
              <p className="text-sm uppercase tracking-widest text-muted">
                What changed
              </p>
              {output?.adaptive ? (
                <>
                  <h2 className="mt-3 text-lg leading-relaxed text-text">
                    {output.adaptive.what_this_suggests}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    This week: {output.adaptive.this_weeks_priority}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-3 font-display text-2xl text-text">
                    Your baseline is set.
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    When your finances or job search change, check in and Landed
                    will explain how your priorities should move with them.
                  </p>
                </>
              )}
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-hair bg-surface p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-muted">
                  Keep the plan current
                </p>
                <h2 className="mt-2 font-display text-2xl text-text">
                  Has anything changed?
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  Update your finances and job-search activity whenever the real
                  picture moves. Your next roadmap preserves this one as history.
                </p>
              </div>
              <Link
                href={`/checkin?journey=${roadmap.journey_id}`}
                className="shrink-0 rounded-lg border border-brand px-5 py-3 text-sm font-medium text-brand hover:bg-brand-soft/20"
              >
                Start a check-in
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-hair bg-surface p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-muted">
                  Recovery timeline
                </p>
                <h2 className="mt-2 font-display text-3xl text-text">
                  How your plan has moved
                </h2>
              </div>
              <p className="text-sm text-muted">
                {roadmaps?.length ?? 0} saved plan{roadmaps?.length === 1 ? '' : 's'}
              </p>
            </div>

            <ol className="mt-7 space-y-0">
              {(roadmaps ?? []).map((savedRoadmap, index) => {
                const savedOutput = parseOutput(savedRoadmap.output_json);
                const transition = checkInByRoadmap.get(savedRoadmap.id);
                const savedMode = savedRoadmap.computed_mode
                  ? MODE_LABEL[savedRoadmap.computed_mode] ?? savedRoadmap.computed_mode
                  : 'Plan paused';
                const priority = savedRoadmap.blocked
                  ? 'Waiting for the financial detail needed to complete this plan.'
                  : savedOutput?.adaptive?.this_weeks_priority ??
                    savedOutput?.next_move?.action ??
                    'Open this plan to review its priorities.';

                return (
                  <li key={savedRoadmap.id} className="relative flex gap-4 pb-7 last:pb-0">
                    {index < (roadmaps?.length ?? 0) - 1 ? (
                      <span
                        aria-hidden
                        className="absolute left-[11px] top-6 h-full w-px bg-hair"
                      />
                    ) : null}
                    <span
                      aria-hidden
                      className={`relative mt-1 h-6 w-6 shrink-0 rounded-full border-4 border-surface ${
                        index === 0 ? 'bg-brand' : 'bg-surface-2'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-medium text-text">
                          {index === 0 ? 'Current plan' : savedMode}
                        </p>
                        <time className="text-xs text-muted" dateTime={savedRoadmap.created_at}>
                          {new Date(savedRoadmap.created_at).toLocaleDateString(
                            'en-CA',
                            { year: 'numeric', month: 'short', day: 'numeric' },
                          )}
                        </time>
                      </div>
                      {transition?.mode_changed ? (
                        <p className="mt-1 text-xs text-brand">
                          Mode changed from{' '}
                          {transition.previous_mode
                            ? MODE_LABEL[transition.previous_mode] ?? transition.previous_mode
                            : 'the previous plan'}{' '}
                          to {savedMode}
                        </p>
                      ) : index === (roadmaps?.length ?? 0) - 1 &&
                        !transition?.previous_roadmap_id ? (
                        <p className="mt-1 text-xs text-muted">Starting baseline</p>
                      ) : null}
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {priority}
                      </p>
                      <Link
                        href={`/roadmap/${savedRoadmap.id}`}
                        className="mt-2 inline-block text-xs text-muted underline underline-offset-4 hover:text-text"
                      >
                        View this plan
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-hair pt-6 text-sm text-muted">
        <Link href={`/roadmap/${roadmap.id}`} className="hover:text-text">
          Full roadmap
        </Link>
        <Link href="/intake" className="hover:text-text">
          Canadian resources
        </Link>
        <a href="mailto:hello@getlanded.ca" className="hover:text-text">
          Contact support
        </a>
      </nav>
    </main>
  );
}
