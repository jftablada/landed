import { NextResponse } from 'next/server';

import { deriveWeeklyTasks } from '../../../../lib/core/deriveWeeklyTasks';
import type { RoadmapOutput } from '../../../../lib/core/generateRoadmapForIntake';
import {
  createSupabaseServerClient,
  getAuthedUserId,
} from '../../../../lib/supabase/server';

type TaskSource = Pick<RoadmapOutput, 'adaptive' | 'next_move' | 'roadmap'>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseTaskSource(value: unknown): TaskSource | null {
  let parsed = value;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return null;
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  const output = parsed as Partial<RoadmapOutput>;
  if (
    !output.next_move ||
    typeof output.next_move.action !== 'string' ||
    !output.roadmap ||
    typeof output.roadmap.show !== 'boolean' ||
    !Array.isArray(output.roadmap.phases) ||
    !output.roadmap.phases.every(
      (phase) =>
        phase &&
        Array.isArray(phase.actions) &&
        phase.actions.every((action) => typeof action === 'string'),
    ) ||
    (output.adaptive !== undefined &&
      typeof output.adaptive.this_weeks_priority !== 'string')
  ) {
    return null;
  }

  return output as TaskSource;
}

async function getOwnedRoadmap(
  roadmapId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
) {
  return supabase
    .from('roadmaps')
    .select('id, blocked, output_json')
    .eq('id', roadmapId)
    .eq('user_id', userId)
    .maybeSingle();
}

export async function GET(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const roadmapId = new URL(req.url).searchParams.get('roadmap_id');
    if (!roadmapId || !UUID_PATTERN.test(roadmapId)) {
      return NextResponse.json(
        { error: 'A valid roadmap_id is required' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: roadmap, error: roadmapError } = await getOwnedRoadmap(
      roadmapId,
      userId,
      supabase,
    );

    if (roadmapError) {
      return NextResponse.json({ error: roadmapError.message }, { status: 500 });
    }
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    if (roadmap.blocked || roadmap.output_json == null) {
      return NextResponse.json({ roadmap_id: roadmapId, tasks: [] });
    }

    const source = parseTaskSource(roadmap.output_json);
    if (!source) {
      return NextResponse.json(
        { error: 'Roadmap output is invalid' },
        { status: 500 },
      );
    }

    const tasks = deriveWeeklyTasks(source);
    const { data: progress, error: progressError } = await supabase
      .from('roadmap_task_progress')
      .select('task_key, completed, completed_at')
      .eq('roadmap_id', roadmapId)
      .eq('user_id', userId);

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    const progressByKey = new Map(
      (progress ?? []).map((row) => [row.task_key, row]),
    );

    return NextResponse.json({
      roadmap_id: roadmapId,
      tasks: tasks.map((task) => {
        const saved = progressByKey.get(task.key);
        return {
          ...task,
          completed: saved?.completed ?? false,
          completed_at: saved?.completed_at ?? null,
        };
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await getAuthedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { roadmap_id: roadmapId, task_key: taskKey, completed } = body as {
      roadmap_id?: unknown;
      task_key?: unknown;
      completed?: unknown;
    };

    if (typeof roadmapId !== 'string' || !UUID_PATTERN.test(roadmapId)) {
      return NextResponse.json(
        { error: 'A valid roadmap_id is required' },
        { status: 400 },
      );
    }
    if (typeof taskKey !== 'string' || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'task_key and completed are required' },
        { status: 400 },
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data: roadmap, error: roadmapError } = await getOwnedRoadmap(
      roadmapId,
      userId,
      supabase,
    );

    if (roadmapError) {
      return NextResponse.json({ error: roadmapError.message }, { status: 500 });
    }
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }
    if (roadmap.blocked || roadmap.output_json == null) {
      return NextResponse.json(
        { error: 'This roadmap has no weekly tasks' },
        { status: 400 },
      );
    }

    const source = parseTaskSource(roadmap.output_json);
    if (!source) {
      return NextResponse.json(
        { error: 'Roadmap output is invalid' },
        { status: 500 },
      );
    }

    const task = deriveWeeklyTasks(source).find(
      (candidate) => candidate.key === taskKey,
    );
    if (!task) {
      return NextResponse.json(
        { error: 'Task does not belong to this roadmap' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const { data: progress, error: progressError } = await supabase
      .from('roadmap_task_progress')
      .upsert(
        {
          roadmap_id: roadmapId,
          user_id: userId,
          task_key: task.key,
          completed,
          completed_at: completed ? now : null,
          updated_at: now,
        },
        { onConflict: 'roadmap_id,task_key' },
      )
      .select('task_key, completed, completed_at')
      .single();

    if (progressError) {
      return NextResponse.json({ error: progressError.message }, { status: 500 });
    }

    return NextResponse.json({ roadmap_id: roadmapId, task, progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
