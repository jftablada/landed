// generateRoadmapForIntake.impl.ts
// V1 implementation of the orchestration contract defined in
// generateRoadmapForIntake.ts.
//
// Seams (swap for real SDKs without touching orchestration):
//   • DbClient    — thin Supabase wrapper (service-role, RLS still on).
//   • AiClient    — your Claude/GPT call. Returns raw string.
//   • The validator (validateRoadmapOutput) is local + dependency-free.
//
// Invariants enforced here (see contract):
//   1. computeMode/computeRunway/buildRunwayView run BEFORE any AI call.
//   2. AI generates language only; numbers/programs are injected + echoed
//      from the COMPUTED values, never from the model.
//   3. Append-only: only INSERTs of roadmap + check_in. No UPDATEs.
//   4. roadmap INSERT and check_in INSERT share ONE transaction.
//   5. AI call is OUTSIDE that transaction.
//   6. Idempotent: existing roadmap short-circuits, no AI, no insert.
//   7. Snapshot-safe: AI failure writes nothing, returns ai_failed.

import { computeMode, type Intake, type ModeResultOk } from './computeMode';
import { buildRunwayView, formatRunway } from './runwayDisplay';
import type {
  GenerateOptions,
  GenerateResult,
  RoadmapOutput,
  RunwayPayload,
  CheckInRecord,
} from './generateRoadmapForIntake';

// ─────────────────────────────────────────────────────────────────────
// SEAM: minimal DB surface this function needs. Implement with Supabase.
// All reads are scoped to userId by the caller's RLS context; we also
// pass userId explicitly so the queries filter defensively.
// ─────────────────────────────────────────────────────────────────────
export interface IntakeRow extends Intake {
  id: string;
  journey_id: string;
  user_id: string;
  source: 'intake' | 'checkin';
  tax_obligation_status: Intake['tax_obligation_status'] | 'unsure';
  // Fields stored on the intake row but not part of the runway-math Intake
  // interface. Declared here so prompt assembly can read them type-safely.
  housing_type: 'rent' | 'own';
  dependents_count: number;
  job_target: string | null;
  has_interview_activity?: boolean;
}

export interface RoadmapRow {
  id: string;
  intake_id: string;
  journey_id: string;
  user_id: string;
  computed_mode: string | null;
  runway_weeks: number | null;
  runway_date: string | null;
  net_monthly_gap: number | null;
  display_state: string | null;
  blocked: boolean;
  block_reason: string | null;
  output_json: RoadmapOutput | null;
}

export interface RoadmapInsert {
  intake_id: string;
  journey_id: string;
  user_id: string;
  computed_mode: string | null;
  runway_weeks: number | null;
  runway_date: string | null;
  net_monthly_gap: number | null;
  display_state: string | null;
  blocked: boolean;
  block_reason: string | null;
  output_json: RoadmapOutput | null;
}

export interface CheckInInsert {
  journey_id: string;
  user_id: string;
  previous_roadmap_id: string | null;
  new_roadmap_id: string;
  mode_changed: boolean;
  previous_mode: string | null;
  new_mode: string | null;
  change_summary: string | null;
}

export interface DbClient {
  // 3a — intake by id, scoped to user. null if missing/not owned.
  getIntake(intakeId: string, userId: string): Promise<IntakeRow | null>;
  // 3b — existing roadmap for this intake (idempotency). null if none.
  getRoadmapByIntake(intakeId: string, userId: string): Promise<RoadmapRow | null>;
  // 3d — most recent prior roadmap in the journey (for check_in linkage).
  //      Excludes the current intake's roadmap (there isn't one yet).
  getLatestRoadmapInJourney(
    journeyId: string,
    userId: string,
  ): Promise<RoadmapRow | null>;

  // Atomic: insert roadmap + check_in in ONE transaction. Returns both ids.
  // MUST be a single DB transaction (see invariant 4).
  insertRoadmapAndCheckIn(
    roadmap: RoadmapInsert,
    checkInFor: (newRoadmapId: string) => CheckInInsert,
  ): Promise<{ roadmapId: string; checkIn: CheckInRecord }>;
}

// ─────────────────────────────────────────────────────────────────────
// SEAM: AI client. One method, returns the raw model string.
// ─────────────────────────────────────────────────────────────────────
export interface AiClient {
  generate(prompt: string): Promise<string>;
}

// ─────────────────────────────────────────────────────────────────────
// Dependencies bundle so the function is testable with fakes.
// ─────────────────────────────────────────────────────────────────────
export interface Deps {
  db: DbClient;
  ai: AiClient;
  systemPrompt: string;   // the V1 master system prompt
  now?: Date;             // injectable for deterministic runway dates
  formatDate?: (iso: string) => string; // e.g. "August 3"
}

// ═════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════
export async function generateRoadmapForIntake(
  opts: GenerateOptions,
  deps: Deps,
): Promise<GenerateResult> {
  const { intakeId, userId } = opts;
  const now = deps.now ?? new Date();

  // ── 3a: load intake (ownership-scoped) ──────────────────────────────
  const intake = await deps.db.getIntake(intakeId, userId);
  if (!intake) {
    // Not found OR not owned — caller maps to 404, no leak. We model this
    // as ai_failed-shaped? No: it's a hard not-found. Throw a typed error
    // so the route returns 404 rather than a generation outcome.
    throw new NotFoundError(intakeId);
  }
  const journeyId = intake.journey_id;

  // ── 12: idempotency — existing roadmap short-circuits everything ────
  const existing = await deps.db.getRoadmapByIntake(intakeId, userId);
  if (existing) {
    return {
      status: 'existing',
      roadmapId: existing.id,
      intakeId,
      journeyId,
      mode: existing.computed_mode,
      runway: hydrateRunwayFromRow(existing),
      emergencyPrograms: emergencyFromOutput(existing.output_json),
      output: existing.output_json,
      blocked: existing.blocked,
      blockReason: existing.block_reason,
    };
  }

  // ── 3d: prior roadmap in journey, for check_in linkage ──────────────
  const prior = await deps.db.getLatestRoadmapInJourney(journeyId, userId);
  const previousRoadmapId = prior?.id ?? null;
  const previousMode = prior?.computed_mode ?? null;

  // ── 5/6: compute mode FIRST (hardcoded, before any AI) ──────────────
  const modeResult = computeMode(intake as Intake, now);

  // ── 6: BLOCKED path (tax_unsure) — no AI, write audit roadmap ───────
  if (modeResult.blocked) {
    const roadmapInsert: RoadmapInsert = {
      intake_id: intakeId,
      journey_id: journeyId,
      user_id: userId,
      computed_mode: null,        // allowed: schema permits null when blocked
      runway_weeks: null,
      runway_date: null,
      net_monthly_gap: null,
      display_state: null,
      blocked: true,
      block_reason: modeResult.reason, // 'tax_unsure'
      output_json: null,
    };

    const { roadmapId, checkIn } = await deps.db.insertRoadmapAndCheckIn(
      roadmapInsert,
      (newRoadmapId) => ({
        journey_id: journeyId,
        user_id: userId,
        previous_roadmap_id: previousRoadmapId,
        new_roadmap_id: newRoadmapId,
        mode_changed: false,
        previous_mode: previousMode,
        new_mode: null,
        change_summary: opts.changeSummary ?? null,
      }),
    );

    return {
      status: 'blocked',
      roadmapId,
      intakeId,
      journeyId,
      blockReason: 'tax_unsure',
      checkIn,
    };
  }

  // ── 5: runway + display (hardcoded, still before AI) ────────────────
  const okMode = modeResult as ModeResultOk;
  const dateLabel = deps.formatDate
    ? deps.formatDate(okMode.runwayDate)
    : okMode.runwayDate;
  const runwayView = buildRunwayView(okMode, dateLabel);
  const figure = formatRunway(okMode);

  const runwayPayload: RunwayPayload = {
    display_state: runwayView.state,
    figure,
    show_date: runwayView.showDate,
    runway_date: runwayView.showDate ? okMode.runwayDate : null,
    body: runwayView.body,
    net_monthly_gap: okMode.netMonthlyGap,
    runway_weeks: okMode.baseRunwayWeeks,
  };

  // ── 8: assemble prompt — inject all numbers/programs/flags ──────────
  const prompt = assemblePrompt(deps.systemPrompt, intake, okMode, runwayPayload);

  // ── 9: AI call + validate + retry ONCE. OUTSIDE any transaction. ────
  let aiOutput: RoadmapOutput | null = null;
  for (let attempt = 0; attempt < 2 && !aiOutput; attempt++) {
    const stricter = attempt === 1;
    const raw = await safeGenerate(
      deps.ai,
      stricter ? prompt + STRICT_SUFFIX : prompt,
    );
    aiOutput = raw ? validateRoadmapOutput(raw, okMode) : null;
  }

  // ── 13: AI failed after retry → write NOTHING, snapshot intact ──────
  if (!aiOutput) {
    return { status: 'ai_failed', intakeId, journeyId };
  }

  // ── 7 + tools: enforce critical/suppression server-side, not via AI ─
  const finalOutput = applyServerRules(aiOutput, okMode, intake);

  // ── 10 + 11: ONE transaction — roadmap INSERT + check_in INSERT ─────
  const newMode = okMode.mode;
  const roadmapInsert: RoadmapInsert = {
    intake_id: intakeId,
    journey_id: journeyId,
    user_id: userId,
    computed_mode: newMode,                 // from computeMode, not AI
    runway_weeks: okMode.baseRunwayWeeks,    // from computeMode
    runway_date: okMode.runwayDate,          // computed
    net_monthly_gap: okMode.netMonthlyGap,   // computed
    display_state: runwayView.state,         // from buildRunwayView
    blocked: false,
    block_reason: null,
    output_json: finalOutput,
  };

  const { roadmapId, checkIn } = await deps.db.insertRoadmapAndCheckIn(
    roadmapInsert,
    (newRoadmapId) => ({
      journey_id: journeyId,
      user_id: userId,
      previous_roadmap_id: previousRoadmapId,
      new_roadmap_id: newRoadmapId,
      mode_changed: previousMode !== null && previousMode !== newMode,
      previous_mode: previousMode,
      new_mode: newMode,
      change_summary: opts.changeSummary ?? null,
    }),
  );

  return {
    status: 'ok',
    roadmapId,
    intakeId,
    journeyId,
    mode: newMode,
    runway: runwayPayload,
    emergencyPrograms: okMode.emergencyPrograms,
    output: finalOutput,
    checkIn,
  };
}

// ═════════════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════════════

export class NotFoundError extends Error {
  constructor(public intakeId: string) {
    super(`intake not found or not owned: ${intakeId}`);
    this.name = 'NotFoundError';
  }
}

const STRICT_SUFFIX =
  '\n\nIMPORTANT: Respond with ONLY valid JSON matching the required ' +
  'schema. No prose, no markdown fences, no commentary. Numbers must be ' +
  'exactly the injected values.';

// Never let an AI client throw bubble up as a crash — treat as a miss.
async function safeGenerate(ai: AiClient, prompt: string): Promise<string | null> {
  try {
    return await ai.generate(prompt);
  } catch {
    return null;
  }
}

// Assemble the prompt: system prompt + injected fixed context. The model
// receives mode, numbers, programs, and intake context as data it must
// not alter — its job is language only.
function assemblePrompt(
  systemPrompt: string,
  intake: IntakeRow,
  mode: ModeResultOk,
  runway: RunwayPayload,
): string {
  const injected = {
    mode: mode.mode,
    runway_figure: runway.figure,
    show_date: runway.show_date,
    runway_date: runway.runway_date,
    confirmed_cash: mode.adjustedCash,
    essential_burn: mode.effectiveBurn,
    net_monthly_gap: mode.netMonthlyGap,
    emergency_programs: mode.emergencyPrograms, // critical only
    suppress_search_phases: mode.suppressSearchPhases,
    context: {
      employment_type: intake.employment_type,
      province: intake.province,
      housing_type: intake.housing_type,
      dependents_count: intake.dependents_count,
      job_target: intake.job_target,
      ei_status: intake.ei_status,
      pending_invoice_amount: intake.pending_invoice_amount,
      pending_invoice_confirmed: intake.pending_invoice_confirmed,
      tax_obligation_status: intake.tax_obligation_status,
      has_interview_activity: intake.has_interview_activity ?? false,
    },
  };

  return (
    systemPrompt +
    '\n\n=== FIXED CONTEXT (do not alter these values) ===\n' +
    JSON.stringify(injected, null, 2) +
    '\n\nGenerate the roadmap output as JSON.'
  );
}

// Dependency-free validation of the AI's JSON against RoadmapOutput.
// Returns the parsed object or null (caller retries / fails).
export function validateRoadmapOutput(
  raw: string,
  _mode: ModeResultOk,
): RoadmapOutput | null {
  let parsed: unknown;
  try {
    // Strip accidental code fences if the model added them.
    const cleaned = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }

  const o = parsed as Record<string, unknown>;
  if (typeof o !== 'object' || o === null) return null;

  if (typeof o.acknowledgment_line !== 'string') return null;

  if (!Array.isArray(o.pressure_points)) return null;
  if (o.pressure_points.length > 3) return null;
  if (!o.pressure_points.every((p) => typeof p === 'string')) return null;

  const nm = o.next_move as Record<string, unknown> | undefined;
  if (!nm || typeof nm.action !== 'string' || typeof nm.why_first !== 'string') {
    return null;
  }
  if (nm.boundary_note != null && typeof nm.boundary_note !== 'string') return null;

  const rm = o.roadmap as Record<string, unknown> | undefined;
  if (!rm || typeof rm.show !== 'boolean' || !Array.isArray(rm.phases)) return null;
  if (rm.phases.length > 3) return null;
  for (const ph of rm.phases) {
    const p = ph as Record<string, unknown>;
    if (typeof p.title !== 'string' || !Array.isArray(p.actions)) return null;
    if (!p.actions.every((a) => typeof a === 'string')) return null;
  }

  if (!Array.isArray(o.tools_surfaced)) return null;
  if (!o.tools_surfaced.every((t) => typeof t === 'string')) return null;

  return parsed as RoadmapOutput;
}

// Server-authoritative rules applied AFTER the AI. The model is instructed
// to follow these, but we enforce them deterministically so a non-compliant
// model can never override product logic.
function applyServerRules(
  output: RoadmapOutput,
  mode: ModeResultOk,
  intake: IntakeRow,
): RoadmapOutput {
  const next = structuredCloneSafe(output);

  // Critical: no roadmap phases, no search. The referral is the output.
  if (mode.mode === 'critical') {
    next.roadmap.show = false;
    next.roadmap.phases = [];
  }

  // Contractor unconfirmed-invoice: suppress search phases (render flag).
  // We don't try to classify which phases are "search" — the flag tells
  // the renderer to collapse them; here we ensure show=false in the tight
  // modes the flag applies to, matching computeMode's suppression scope.
  if (mode.suppressSearchPhases) {
    next.roadmap.show = false;
  }

  // Interview Prep surfacing: Strategic + active interviews only.
  const hasInterview = intake.has_interview_activity ?? false;
  const wantInterviewPrep = mode.mode === 'strategic' && hasInterview;
  const set = new Set(next.tools_surfaced);
  if (wantInterviewPrep) set.add('interview_prep');
  else set.delete('interview_prep'); // never surface outside the rule
  next.tools_surfaced = [...set];

  return next;
}

// RRunwayPayload reconstruction from a stored roadmap row (idempotent return).
function hydrateRunwayFromRow(row: RoadmapRow): RunwayPayload | null {
  if (row.blocked) return null;
  return {
    display_state: (row.display_state as RunwayPayload['display_state']) ?? 'normal',
    figure: null, // stored body carries the rendered figure; see note below
    show_date: row.runway_date != null,
    runway_date: row.runway_date,
    body: '', // caller should read output_json/body; kept minimal in V1
    net_monthly_gap: row.net_monthly_gap ?? 0,
    runway_weeks: row.runway_weeks ?? 0,
  };
}

function emergencyFromOutput(_o: RoadmapOutput | null): string[] | null {
  // Emergency programs are not stored separately in V1; they live in the
  // rendered output. Return null on the idempotent path; the live path
  // returns them from computeMode. (V2: persist them explicitly.)
  return null;
}

// structuredClone may be unavailable in some runtimes; fall back to JSON.
function structuredCloneSafe<T>(v: T): T {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}
