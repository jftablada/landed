// generateRoadmapForIntake.impl.test.ts
// Run with: npx vitest run
//
// Proves the orchestration logic with in-memory fakes for DB + AI.
// No real Supabase / model needed. Focus: control flow + invariants.

import { describe, it, expect, vi } from 'vitest';
import {
  generateRoadmapForIntake,
  validateRoadmapOutput,
  NotFoundError,
  type DbClient,
  type AiClient,
  type IntakeRow,
  type RoadmapRow,
  type RoadmapInsert,
  type CheckInInsert,
  type Deps,
} from './generateRoadmapForIntake.impl';
import type { ModeResultOk } from './computeMode';

const NOW = new Date('2026-06-16T00:00:00.000Z');

const GOOD_AI_JSON = JSON.stringify({
  acknowledgment_line: 'You have some room to plan.',
  pressure_points: ['housing is your largest cost'],
  next_move: { action: 'Define your target roles.', why_first: 'Focus saves time.', boundary_note: null },
  roadmap: { show: true, phases: [{ title: 'Week 1', actions: ['do x'] }] },
  tools_surfaced: [],
});

function baseIntake(over: Partial<IntakeRow> = {}): IntakeRow {
  return {
    id: 'intake-1',
    journey_id: 'journey-1',
    user_id: 'user-1',
    source: 'intake',
    province: 'ON',
    employment_type: 'employee',
    housing_type: 'rent',
    dependents_count: 0,
    job_target: 'PM roles',
    confirmed_cash: 11000,
    essential_burn: 3000,
    debt_minimums: 0,
    tax_obligation_status: 'none',
    tax_obligation_amount: null,
    tax_plan_monthly: null,
    ei_status: 'not_applied',
    ei_monthly_amount: null,
    pending_invoice_amount: null,
    pending_invoice_confirmed: false,
    has_interview_activity: false,
    ...over,
  } as IntakeRow;
}

// Configurable fake DB. Records inserts for assertions.
function fakeDb(opts: {
  intake: IntakeRow | null;
  existingRoadmap?: RoadmapRow | null;
  priorRoadmap?: RoadmapRow | null;
}): DbClient & { inserts: { roadmap: RoadmapInsert; checkIn: CheckInInsert }[] } {
  const inserts: { roadmap: RoadmapInsert; checkIn: CheckInInsert }[] = [];
  return {
    inserts,
    async getIntake(id, userId) {
      if (!opts.intake) return null;
      if (opts.intake.id !== id || opts.intake.user_id !== userId) return null;
      return opts.intake;
    },
    async getRoadmapByIntake() {
      return opts.existingRoadmap ?? null;
    },
    async getLatestRoadmapInJourney() {
      return opts.priorRoadmap ?? null;
    },
    async insertRoadmapAndCheckIn(roadmap, checkInFor) {
      const roadmapId = 'roadmap-new';
      const ci = checkInFor(roadmapId);
      inserts.push({ roadmap, checkIn: ci });
      return {
        roadmapId,
        checkIn: {
          id: 'checkin-new',
          previous_roadmap_id: ci.previous_roadmap_id,
          new_roadmap_id: roadmapId,
          mode_changed: ci.mode_changed,
          previous_mode: ci.previous_mode,
          new_mode: ci.new_mode,
        },
      };
    },
  };
}

function fakeAi(responses: (string | Error)[]): AiClient {
  let i = 0;
  return {
    async generate() {
      const r = responses[Math.min(i, responses.length - 1)];
      i++;
      if (r instanceof Error) throw r;
      return r;
    },
  };
}

function deps(db: DbClient, ai: AiClient): Deps {
  return { db, ai, systemPrompt: 'SYS', now: NOW, formatDate: () => 'August 3' };
}

// ─────────────────────────────────────────────────────────────────────
describe('not found / ownership', () => {
  it('throws NotFoundError when intake missing', async () => {
    const db = fakeDb({ intake: null });
    await expect(
      generateRoadmapForIntake({ intakeId: 'x', userId: 'user-1' }, deps(db, fakeAi([GOOD_AI_JSON]))),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('throws NotFoundError when intake owned by another user', async () => {
    const db = fakeDb({ intake: baseIntake({ user_id: 'someone-else' }) });
    await expect(
      generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, fakeAi([GOOD_AI_JSON]))),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('idempotency', () => {
  it('returns existing roadmap, never calls AI or inserts', async () => {
    const existing: RoadmapRow = {
      id: 'roadmap-existing', intake_id: 'intake-1', journey_id: 'journey-1',
      user_id: 'user-1', computed_mode: 'balanced', runway_weeks: 5,
      runway_date: '2026-07-20', net_monthly_gap: 3000, display_state: 'normal',
      blocked: false, block_reason: null, output_json: null,
    };
    const db = fakeDb({ intake: baseIntake(), existingRoadmap: existing });
    const ai = fakeAi([GOOD_AI_JSON]);
    const aiSpy = vi.spyOn(ai, 'generate');

    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));

    expect(res.status).toBe('existing');
    if (res.status === 'existing') expect(res.roadmapId).toBe('roadmap-existing');
    expect(aiSpy).not.toHaveBeenCalled();
    expect(db.inserts).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('blocked path (tax unsure)', () => {
  it('writes a blocked roadmap with null mode/runway, no AI call', async () => {
    const db = fakeDb({ intake: baseIntake({ tax_obligation_status: 'unsure' }) });
    const ai = fakeAi([GOOD_AI_JSON]);
    const aiSpy = vi.spyOn(ai, 'generate');

    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));

    expect(res.status).toBe('blocked');
    expect(aiSpy).not.toHaveBeenCalled();
    expect(db.inserts).toHaveLength(1);
    const ins = db.inserts[0].roadmap;
    expect(ins.blocked).toBe(true);
    expect(ins.block_reason).toBe('tax_unsure');
    expect(ins.computed_mode).toBeNull();
    expect(ins.runway_weeks).toBeNull();
    expect(ins.output_json).toBeNull();
    // check_in still written, anchoring the blocked attempt
    expect(db.inserts[0].checkIn.new_mode).toBeNull();
    expect(db.inserts[0].checkIn.mode_changed).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('happy path', () => {
  it('computes mode, calls AI once, inserts roadmap + check_in', async () => {
    const db = fakeDb({ intake: baseIntake() }); // 11000/3000 ≈ 15.9 wk → strategic
    const ai = fakeAi([GOOD_AI_JSON]);
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));

    expect(res.status).toBe('ok');
    if (res.status === 'ok') {
      expect(res.mode).toBe('strategic');
      expect(res.runway.runway_weeks).toBeCloseTo(15.93, 1);
      expect(res.checkIn.previous_roadmap_id).toBeNull(); // first roadmap
      expect(res.checkIn.mode_changed).toBe(false);
    }
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0].roadmap.computed_mode).toBe('strategic');
    expect(db.inserts[0].roadmap.blocked).toBe(false);
  });

  it('mode_changed true when prior roadmap had a different mode', async () => {
    const prior: RoadmapRow = {
      id: 'roadmap-prior', intake_id: 'intake-0', journey_id: 'journey-1',
      user_id: 'user-1', computed_mode: 'survival', runway_weeks: 2,
      runway_date: '2026-06-30', net_monthly_gap: 3000, display_state: 'normal',
      blocked: false, block_reason: null, output_json: null,
    };
    const db = fakeDb({ intake: baseIntake(), priorRoadmap: prior });
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, fakeAi([GOOD_AI_JSON])));
    if (res.status === 'ok') {
      expect(res.checkIn.previous_mode).toBe('survival');
      expect(res.checkIn.new_mode).toBe('strategic');
      expect(res.checkIn.mode_changed).toBe(true);
    } else {
      throw new Error('expected ok');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('check-in activity persistence', () => {
  it('forwards activity values through the blocked-path check-in builder', async () => {
    const db = fakeDb({ intake: baseIntake({ tax_obligation_status: 'unsure' }) });

    await generateRoadmapForIntake(
      {
        intakeId: 'intake-1',
        userId: 'user-1',
        applicationsSubmitted: 7,
        employerResponses: 2,
        interviewsSecured: 1,
        biggestBarrier: 'Motivation/energy',
      },
      deps(db, fakeAi([GOOD_AI_JSON])),
    );

    expect(db.inserts[0].checkIn).toMatchObject({
      applications_submitted: 7,
      employer_responses: 2,
      interviews_secured: 1,
      biggest_barrier: 'Motivation/energy',
    });
  });

  it('writes null activity values through the successful-path check-in builder when omitted', async () => {
    const db = fakeDb({ intake: baseIntake() });

    await generateRoadmapForIntake(
      { intakeId: 'intake-1', userId: 'user-1' },
      deps(db, fakeAi([GOOD_AI_JSON])),
    );

    expect(db.inserts[0].checkIn).toMatchObject({
      applications_submitted: null,
      employer_responses: null,
      interviews_secured: null,
      biggest_barrier: null,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('AI failure is snapshot-safe', () => {
  it('returns ai_failed and writes NOTHING after two bad responses', async () => {
    const db = fakeDb({ intake: baseIntake() });
    const ai = fakeAi(['not json', 'still not json']);
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));
    expect(res.status).toBe('ai_failed');
    expect(db.inserts).toHaveLength(0); // nothing persisted
  });

  it('retries once then succeeds on second valid response', async () => {
    const db = fakeDb({ intake: baseIntake() });
    const ai = fakeAi(['garbage', GOOD_AI_JSON]);
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));
    expect(res.status).toBe('ok');
    expect(db.inserts).toHaveLength(1);
  });

  it('AI throwing is treated as a miss, not a crash', async () => {
    const db = fakeDb({ intake: baseIntake() });
    const ai = fakeAi([new Error('network'), new Error('network')]);
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, ai));
    expect(res.status).toBe('ai_failed');
    expect(db.inserts).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('server rules override AI', () => {
  it('critical mode forces roadmap.show=false and empties phases', async () => {
    // cash 100 / burn 3000 → < 1 week → critical
    const db = fakeDb({ intake: baseIntake({ confirmed_cash: 100, essential_burn: 3000 }) });
    const aiWithPhases = JSON.stringify({
      acknowledgment_line: 'x', pressure_points: [],
      next_move: { action: 'call 211', why_first: 'stabilize', boundary_note: null },
      roadmap: { show: true, phases: [{ title: 'should be removed', actions: ['nope'] }] },
      tools_surfaced: [],
    });
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, fakeAi([aiWithPhases])));
    if (res.status === 'ok') {
      expect(res.mode).toBe('critical');
      expect(res.output.roadmap.show).toBe(false);
      expect(res.output.roadmap.phases).toHaveLength(0);
      expect(res.emergencyPrograms).toEqual(['211 (free, confidential, 24/7)', 'Ontario Works']);
    } else {
      throw new Error('expected ok');
    }
  });

  it('interview_prep surfaced only in strategic + active interviews', async () => {
    // strategic + interviews → present
    const dbYes = fakeDb({ intake: baseIntake({ has_interview_activity: true }) });
    const resYes = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(dbYes, fakeAi([GOOD_AI_JSON])));
    if (resYes.status === 'ok') expect(resYes.output.tools_surfaced).toContain('interview_prep');

    // strategic + NO interviews → absent even if AI tried to add it
    const aiTriesPrep = JSON.stringify({
      acknowledgment_line: 'x', pressure_points: [],
      next_move: { action: 'a', why_first: 'b', boundary_note: null },
      roadmap: { show: true, phases: [] },
      tools_surfaced: ['interview_prep'],
    });
    const dbNo = fakeDb({ intake: baseIntake({ has_interview_activity: false }) });
    const resNo = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(dbNo, fakeAi([aiTriesPrep])));
    if (resNo.status === 'ok') expect(resNo.output.tools_surfaced).not.toContain('interview_prep');
  });

  it('contractor unconfirmed invoice in survival suppresses roadmap.show', async () => {
    // cash 1200 / burn 2900 ≈ 1.8 wk → survival, unconfirmed invoice → suppress
    const db = fakeDb({ intake: baseIntake({
      employment_type: 'incorporated', confirmed_cash: 1200, essential_burn: 2900,
      pending_invoice_amount: 6800, pending_invoice_confirmed: false,
    }) });
    const res = await generateRoadmapForIntake({ intakeId: 'intake-1', userId: 'user-1' }, deps(db, fakeAi([GOOD_AI_JSON])));
    if (res.status === 'ok') {
      expect(res.mode).toBe('survival');
      expect(res.output.roadmap.show).toBe(false);
    } else {
      throw new Error('expected ok');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('validateRoadmapOutput', () => {
  const fakeMode = {} as ModeResultOk;
  it('accepts well-formed JSON', () => {
    expect(validateRoadmapOutput(GOOD_AI_JSON, fakeMode)).not.toBeNull();
  });
  it('strips code fences', () => {
    expect(validateRoadmapOutput('```json\n' + GOOD_AI_JSON + '\n```', fakeMode)).not.toBeNull();
  });
  it('accepts up to 4 pressure points', () => {
    const good = JSON.parse(GOOD_AI_JSON);
    good.pressure_points = ['a', 'b', 'c', 'd'];
    expect(validateRoadmapOutput(JSON.stringify(good), fakeMode)).not.toBeNull();
  });
  it('rejects > 3 phases', () => {
    const bad = JSON.parse(GOOD_AI_JSON);
    bad.roadmap.phases = [1,2,3,4].map((n) => ({ title: 't'+n, actions: [] }));
    expect(validateRoadmapOutput(JSON.stringify(bad), fakeMode)).toBeNull();
  });
  it('rejects missing next_move', () => {
    const bad = JSON.parse(GOOD_AI_JSON); delete bad.next_move;
    expect(validateRoadmapOutput(JSON.stringify(bad), fakeMode)).toBeNull();
  });
  it('rejects non-JSON', () => {
    expect(validateRoadmapOutput('hello world', fakeMode)).toBeNull();
  });
});
