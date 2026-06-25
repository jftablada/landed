// app/api/roadmap/generate/route.ts
// POST /api/roadmap/generate
//
// Thin route. The real work lives in generateRoadmapForIntake (orchestrator).
// This route only:
//   1. confirms the user is logged in (401 if not)
//   2. reads intake_id from the request body
//   3. builds the Deps bundle: real DbClient + stub AI + system prompt
//   4. calls the orchestrator
//   5. maps its four possible results to clean HTTP responses
//
// AI is the STUB for now (no key needed). Swap lib/ai/stubAiClient for a
// real client later — this route does not change.

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

export async function POST(req: Request) {
  try {
    // ── 1. auth ───────────────────────────────────────────────────────
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // ── 2. input ──────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const intakeId: string | undefined = body?.intake_id;
    if (!intakeId) {
      return NextResponse.json(
        { error: 'intake_id is required' },
        { status: 400 },
      );
    }

    // ── 3. dependencies ───────────────────────────────────────────────
    const supabase = await createSupabaseServerClient();
    console.log('ROADMAP ROUTE userId:', userId);
    const db = createSupabaseDbClient(supabase, userId);

    // ── 4. orchestrate (compute → AI → atomic DB write) ───────────────
    const result = await generateRoadmapForIntake(
      { intakeId, userId },
      { db, ai: templateStubClient, systemPrompt: SYSTEM_PROMPT },
    );

    // ── 5. map result → HTTP response ─────────────────────────────────
    switch (result.status) {
      case 'ok':
        return NextResponse.json(
          {
            success: true,
            roadmap_id: result.roadmapId,
            mode: result.mode,
            runway: result.runway,
            emergency_programs: result.emergencyPrograms,
            output: result.output,
          },
          { status: 201 },
        );

      case 'existing':
        // Idempotent: a roadmap already existed for this intake.
        return NextResponse.json(
          {
            success: true,
            existing: true,
            roadmap_id: result.roadmapId,
            mode: result.mode,
            runway: result.runway,
            output: result.output,
            blocked: result.blocked,
          },
          { status: 200 },
        );

      case 'blocked':
        // Tax-unsure holding state. Not an error — a designed outcome.
        return NextResponse.json(
          {
            success: true,
            blocked: true,
            roadmap_id: result.roadmapId,
            block_reason: result.blockReason,
          },
          { status: 200 },
        );

      case 'ai_failed':
        // Snapshot is intact; generation can be retried safely.
        return NextResponse.json(
          {
            error: 'generation_failed',
            message: 'Could not build the plan right now. Please try again.',
            intake_id: result.intakeId,
          },
          { status: 503 },
        );

      default:
        // Exhaustiveness guard — should be unreachable.
        return NextResponse.json(
          { error: 'Unknown generation result' },
          { status: 500 },
        );
    }
  } catch (err) {
    // NotFoundError from the orchestrator (intake missing / not owned).
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Intake not found' }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}