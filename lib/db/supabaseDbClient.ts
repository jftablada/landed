// supabaseDbClient.ts
// Real Supabase implementation of the DbClient interface the orchestrator
// (generateRoadmapForIntake.impl.ts) depends on.
//
// Key design points:
//   • insertRoadmapAndCheckIn calls the Postgres RPC
//     insert_roadmap_and_checkin, which runs both inserts in ONE
//     transaction (the JS client cannot do real multi-statement txns).
//   • The Supabase client is created PER REQUEST with the user's auth
//     context, so RLS applies and auth.uid() resolves to the real user.
//   • user_id is taken from the session, never from a payload.
//   • Errors are normalized so nothing leaks raw DB internals to callers.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  DbClient,
  IntakeRow,
  RoadmapRow,
  RoadmapInsert,
  CheckInInsert,
} from '../core/generateRoadmapForIntake.impl';
import type { CheckInRecord } from '../core/generateRoadmapForIntake';

// The RPC returns one of these shapes (see SQL).
interface RpcExisting {
  status: 'existing';
  roadmap_id: string;
  blocked: boolean;
}
interface RpcInserted {
  status: 'inserted';
  roadmap_id: string;
  check_in: {
    id: string;
    previous_roadmap_id: string | null;
    new_roadmap_id: string;
    mode_changed: boolean;
    previous_mode: string | null;
    new_mode: string | null;
  };
}
type RpcResult = RpcExisting | RpcInserted;

export class DbError extends Error {
  constructor(
    public code: 'forbidden' | 'not_found' | 'conflict' | 'db_error',
    message: string,
  ) {
    super(message);
    this.name = 'DbError';
  }
}

/**
 * Build a DbClient bound to a request-scoped Supabase client.
 * The caller is responsible for creating `supabase` with the user's JWT
 * (e.g. from the route's auth context) so RLS + auth.uid() are correct.
 *
 * @param supabase  request-scoped client (user auth context)
 * @param userId    auth.uid() resolved at the route — never from payload
 */
export function createSupabaseDbClient(
  supabase: SupabaseClient,
  userId: string,
): DbClient {
  return {
    // ── 3a: intake by id, scoped to the authenticated user ────────────
    async getIntake(intakeId: string, uid: string): Promise<IntakeRow | null> {
      assertSameUser(uid, userId);
      const { data, error } = await supabase
        .from('intakes')
        .select('*')
        .eq('id', intakeId)
        .eq('user_id', userId) // explicit, in addition to RLS
        .maybeSingle();
      if (error) throw normalize(error);
      return (data as IntakeRow) ?? null;
    },

    // ── 3b: existing roadmap for the intake (idempotency read) ────────
    async getRoadmapByIntake(
      intakeId: string,
      uid: string,
    ): Promise<RoadmapRow | null> {
      assertSameUser(uid, userId);
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('intake_id', intakeId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw normalize(error);
      return (data as RoadmapRow) ?? null;
    },

    // ── 3d: most recent prior roadmap in the journey (check_in linkage)─
    async getLatestRoadmapInJourney(
      journeyId: string,
      uid: string,
    ): Promise<RoadmapRow | null> {
      assertSameUser(uid, userId);
      const { data, error } = await supabase
        .from('roadmaps')
        .select('*')
        .eq('journey_id', journeyId)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw normalize(error);
      return (data as RoadmapRow) ?? null;
    },

    // ── Atomic roadmap + check_in via RPC (one Postgres transaction) ──
    async insertRoadmapAndCheckIn(
      roadmap: RoadmapInsert,
      checkInFor: (newRoadmapId: string) => CheckInInsert,
    ): Promise<{ roadmapId: string; checkIn: CheckInRecord }> {
      // The check_in's fields don't depend on the new roadmap id for any
      // value EXCEPT new_roadmap_id, which the RPC fills itself. We call
      // checkInFor with a placeholder only to extract the caller's chosen
      // linkage fields; new_roadmap_id from here is ignored by the RPC.
      const ci = checkInFor('__rpc_fills_this__');

      // Guard: caller must not have smuggled a different user_id in.
      if (roadmap.user_id !== userId || ci.user_id !== userId) {
        throw new DbError('forbidden', 'user_id must match session');
      }

      const { data, error } = await supabase.rpc('insert_roadmap_and_checkin', {
        p_intake_id: roadmap.intake_id,
        p_journey_id: roadmap.journey_id,
        p_user_id: userId, // session, not payload
        p_computed_mode: roadmap.computed_mode,
        p_runway_weeks: roadmap.runway_weeks,
        p_runway_date: roadmap.runway_date,
        p_net_monthly_gap: roadmap.net_monthly_gap,
        p_display_state: roadmap.display_state,
        p_blocked: roadmap.blocked,
        p_block_reason: roadmap.block_reason,
        p_output_json: roadmap.output_json,
        p_previous_roadmap_id: ci.previous_roadmap_id,
        p_mode_changed: ci.mode_changed,
        p_previous_mode: ci.previous_mode,
        p_new_mode: ci.new_mode,
        p_change_summary: ci.change_summary,
      });

      if (error) throw normalize(error);

      const result = data as RpcResult;

      // Idempotent return: the RPC found an existing roadmap. We need its
      // check_in too, to satisfy the CheckInRecord return. Because roadmap
      // and check_in are written atomically, an existing roadmap implies an
      // existing check_in — fetch it.
      if (result.status === 'existing') {
        const checkIn = await fetchCheckInForRoadmap(
          supabase,
          userId,
          result.roadmap_id,
        );
        return { roadmapId: result.roadmap_id, checkIn };
      }

      // Freshly inserted.
      return {
        roadmapId: result.roadmap_id,
        checkIn: {
          id: result.check_in.id,
          previous_roadmap_id: result.check_in.previous_roadmap_id,
          new_roadmap_id: result.check_in.new_roadmap_id,
          mode_changed: result.check_in.mode_changed,
          previous_mode: result.check_in.previous_mode,
          new_mode: result.check_in.new_mode,
        },
      };
    },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────

async function fetchCheckInForRoadmap(
  supabase: SupabaseClient,
  userId: string,
  roadmapId: string,
): Promise<CheckInRecord> {
  const { data, error } = await supabase
    .from('check_ins')
    .select('id, previous_roadmap_id, new_roadmap_id, mode_changed, previous_mode, new_mode')
    .eq('new_roadmap_id', roadmapId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw normalize(error);
  if (!data) {
    // Should be impossible given atomic writes; treat as a data integrity
    // error rather than returning a fabricated record.
    throw new DbError('db_error', 'check_in missing for existing roadmap');
  }
  return data as CheckInRecord;
}

function assertSameUser(a: string, b: string): void {
  if (a !== b) throw new DbError('forbidden', 'user mismatch');
}

// Normalize Supabase/Postgres errors into safe, typed DbErrors. Never
// surface raw DB messages to the route response; log the original
// upstream if needed, return a clean code here.
function normalize(error: { code?: string; message?: string }): DbError {
  switch (error.code) {
    case '42501': // insufficient_privilege (our forbidden raise / RLS)
      return new DbError('forbidden', 'forbidden');
    case 'P0002': // no_data_found (our not-found raise)
    case 'PGRST116': // PostgREST: no rows where one expected
      return new DbError('not_found', 'not found');
    case '23505': // unique_violation
      return new DbError('conflict', 'already exists');
    case '23514': // check_violation
      return new DbError('db_error', 'invalid row');
    default:
      return new DbError('db_error', 'database error');
  }
}
