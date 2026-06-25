// app/api/checkin/route.ts
// POST /api/checkin
//
// A check-in creates a NEW immutable intake snapshot (append-only) by
// carrying forward the most recent snapshot and applying only the changed
// fields, then regenerates the roadmap via the shared orchestrator (which
// writes the new roadmap + transition check_in atomically).
//
// Input:  { journey_id, changes: { ...fields that changed... }, change_summary? }
// Output: { success, intake_id, roadmap_id, mode_changed, previous_mode,
//           new_mode, mode, runway, output }
//
// The route NEVER edits existing rows. EI confirmation logic lives in the
// form; the route simply applies whatever `changes` it receives.

import { NextResponse } from 'next/server';
import {
  getAuthedUserId,
  createSupabaseServerClient,
} from '@/lib/supabase/server';
import { createSupabaseDbClient } from '@/lib/db/supabaseDbClient';
import {
  generateRoadmapForIntake,
  NotFoundError,
} from '@/lib/core/generateRoadmapForIntake.impl';
import { templateStubClient } from '@/lib/ai/templateStubClient';
import { SYSTEM_PROMPT } from '@/lib/ai/systemPrompt';

// The 17 carry-forward fields — everything on intakes EXCEPT the
// db-managed columns (id, journey_id, user_id, created_at, source).
const CARRY_FORWARD_FIELDS = [
  'employment_type',
  'housing_type',
  'province',
  'dependents_count',
  'job_target',
  'confirmed_cash',
  'essential_burn',
  'debt_minimums',
  'tax_obligation_status',
  'tax_obligation_amount',
  'tax_plan_monthly',
  'ei_status',
  'ei_monthly_amount',
  'pending_invoice_amount',
  'pending_invoice_confirmed',
  'upside_notes',
] as const;

export async function POST(req: Request) {
  try {
    // ── 1. auth ───────────────────────────────────────────────────────
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. input ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const journeyId: string | undefined = body?.journey_id;
    const changes: Record<string, unknown> = body?.changes ?? {};
    const changeSummary: string | null = body?.change_summary ?? null;

    if (!journeyId) {
      return NextResponse.json(
        { error: 'journey_id is required' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();

    // ── 3. verify journey: exists, owned, active ──────────────────────
    const { data: journey, error: journeyErr } = await supabase
      .from('journeys')
      .select('id, status')
      .eq('id', journeyId)
      .eq('user_id', userId)
      .maybeSingle();

    if (journeyErr) {
      return NextResponse.json({ error: journeyErr.message }, { status: 500 });
    }
    if (!journey) {
      return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    }
    if (journey.status !== 'active') {
      return NextResponse.json(
        { error: 'Journey is not active' },
        { status: 409 },
      );
    }

    // ── 4. load most recent snapshot (carry-forward base) ─────────────
    const { data: lastSnapshot, error: snapErr } = await supabase
      .from('intakes')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapErr) {
      return NextResponse.json({ error: snapErr.message }, { status: 500 });
    }
    if (!lastSnapshot) {
      return NextResponse.json(
        { error: 'No prior intake to check in against' },
        { status: 409 },
      );
    }

    // ── 5. merge: carry forward, apply only changed fields ────────────
    const merged: Record<string, unknown> = {};
    for (const field of CARRY_FORWARD_FIELDS) {
      merged[field] = field in changes ? changes[field] : lastSnapshot[field];
    }

    // ── 6. re-validate merged as a full intake (same rules as /api/intake)
    const taxStatus = merged.tax_obligation_status;

    // tax-unsure is a client-side block; reject here as defense in depth.
    if (taxStatus === 'unsure') {
      return NextResponse.json(
        { error: 'Resolve tax status before checking in' },
        { status: 400 },
      );
    }
    if (
      !merged.employment_type ||
      !merged.housing_type ||
      !merged.province ||
      merged.confirmed_cash == null ||
      merged.essential_burn == null ||
      !taxStatus
    ) {
      return NextResponse.json(
        { error: 'Merged intake is missing required fields' },
        { status: 400 },
      );
    }
    if (taxStatus === 'has_amount' && merged.tax_obligation_amount == null) {
      return NextResponse.json(
        { error: 'tax_obligation_amount required when status is has_amount' },
        { status: 400 },
      );
    }
    if (taxStatus === 'on_plan' && merged.tax_plan_monthly == null) {
      return NextResponse.json(
        { error: 'tax_plan_monthly required when status is on_plan' },
        { status: 400 },
      );
    }
    if (Number(merged.essential_burn) <= 0) {
      return NextResponse.json(
        { error: 'essential_burn must be greater than 0' },
        { status: 400 },
      );
    }

    // ── 7. insert NEW immutable snapshot (source: 'checkin') ──────────
    const { data: newIntake, error: insertErr } = await supabase
      .from('intakes')
      .insert({
        journey_id: journeyId,
        user_id: userId,
        source: 'checkin',
        ...merged,
      })
      .select('id')
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // ── 8. regenerate roadmap via shared orchestrator ─────────────────
    // Writes the new roadmap + the transition check_in atomically, with
    // previous_roadmap_id set and mode_changed computed.
    const db = createSupabaseDbClient(supabase, userId);
    const result = await generateRoadmapForIntake(
      { intakeId: newIntake.id, userId, changeSummary },
      { db, ai: templateStubClient, systemPrompt: SYSTEM_PROMPT },
    );

    // ── 9. map result → response ──────────────────────────────────────
    switch (result.status) {
      case 'ok':
        return NextResponse.json(
          {
            success: true,
            intake_id: newIntake.id,
            roadmap_id: result.roadmapId,
            mode: result.mode,
            mode_changed: result.checkIn.mode_changed,
            previous_mode: result.checkIn.previous_mode,
            new_mode: result.checkIn.new_mode,
            runway: result.runway,
            output: result.output,
          },
          { status: 201 },
        );

      case 'blocked':
        return NextResponse.json(
          {
            success: true,
            blocked: true,
            intake_id: newIntake.id,
            roadmap_id: result.roadmapId,
            block_reason: result.blockReason,
          },
          { status: 200 },
        );

      case 'existing':
        // Shouldn't normally happen for a brand-new snapshot, but handle it.
        return NextResponse.json(
          {
            success: true,
            existing: true,
            intake_id: newIntake.id,
            roadmap_id: result.roadmapId,
            mode: result.mode,
            runway: result.runway,
            output: result.output,
          },
          { status: 200 },
        );

      case 'ai_failed':
        // The new snapshot IS saved (append-only); generation can retry.
        return NextResponse.json(
          {
            error: 'generation_failed',
            message: 'Snapshot saved, but the plan could not be built. Retry.',
            intake_id: newIntake.id,
          },
          { status: 503 },
        );

      default:
        return NextResponse.json(
          { error: 'Unknown generation result' },
          { status: 500 },
        );
    }
  } catch (err) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}