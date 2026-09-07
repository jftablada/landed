import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createSupabaseServerClient,
  getAuthedUserId,
} from '../../../../lib/supabase/server';

import { GET, PATCH } from './route';

vi.mock('../../../../lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn(),
  getAuthedUserId: vi.fn(),
}));

const ROADMAP_ID = '8ad78f6b-2e69-4cc0-bee4-bcf3c1fc57c2';
const USER_ID = '6cc30279-6bc1-40f3-947a-431c4fa5cb56';

const output = {
  acknowledgment_line: 'You have room to choose.',
  pressure_points: [],
  next_move: {
    action: 'Make a focused company list.',
    why_first: 'Focus helps.',
    boundary_note: null,
  },
  roadmap: {
    show: true,
    phases: [
      { title: 'This week', actions: ['Choose ten companies.', 'Call a peer.'] },
    ],
  },
  tools_surfaced: [],
};

function queryResult(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    maybeSingle: vi.fn(async () => result),
  };
  return chain;
}

function progressRead(result: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    then: (resolve: (value: unknown) => unknown) => resolve(result),
  };
  return chain;
}

function progressWrite(result: unknown) {
  const chain = {
    upsert: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => result),
  };
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getAuthedUserId).mockResolvedValue(USER_ID);
});

describe('roadmap task progress API', () => {
  it('requires authentication', async () => {
    vi.mocked(getAuthedUserId).mockResolvedValue(null);

    const response = await GET(
      new Request(`http://localhost/api/roadmap/task-progress?roadmap_id=${ROADMAP_ID}`),
    );

    expect(response.status).toBe(401);
  });

  it('returns derived tasks merged with saved progress', async () => {
    const roadmapQuery = queryResult({
      data: { id: ROADMAP_ID, blocked: false, output_json: output },
      error: null,
    });
    const savedProgress = progressRead({
      data: [
        {
          task_key: 'phase_0_action_0',
          completed: true,
          completed_at: '2026-09-07T12:00:00.000Z',
        },
      ],
      error: null,
    });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn((table: string) =>
        table === 'roadmaps' ? roadmapQuery : savedProgress,
      ),
    } as never);

    const response = await GET(
      new Request(`http://localhost/api/roadmap/task-progress?roadmap_id=${ROADMAP_ID}`),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tasks).toHaveLength(3);
    expect(body.tasks[0]).toMatchObject({ key: 'next_move', completed: false });
    expect(body.tasks[1]).toMatchObject({
      key: 'phase_0_action_0',
      completed: true,
    });
  });

  it('rejects a task key that was not derived from the roadmap', async () => {
    const roadmapQuery = queryResult({
      data: { id: ROADMAP_ID, blocked: false, output_json: output },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn(() => roadmapQuery),
    } as never);

    const response = await PATCH(
      new Request('http://localhost/api/roadmap/task-progress', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: ROADMAP_ID,
          task_key: 'phase_99_action_99',
          completed: true,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Task does not belong to this roadmap',
    });
  });

  it('upserts a valid completion using the authenticated user id', async () => {
    const roadmapQuery = queryResult({
      data: { id: ROADMAP_ID, blocked: false, output_json: output },
      error: null,
    });
    const saved = {
      task_key: 'next_move',
      completed: true,
      completed_at: '2026-09-07T12:00:00.000Z',
    };
    const write = progressWrite({ data: saved, error: null });

    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      from: vi.fn((table: string) =>
        table === 'roadmaps' ? roadmapQuery : write,
      ),
    } as never);

    const response = await PATCH(
      new Request('http://localhost/api/roadmap/task-progress', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: ROADMAP_ID,
          task_key: 'next_move',
          completed: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(write.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        roadmap_id: ROADMAP_ID,
        user_id: USER_ID,
        task_key: 'next_move',
        completed: true,
      }),
      { onConflict: 'roadmap_id,task_key' },
    );
  });
});
