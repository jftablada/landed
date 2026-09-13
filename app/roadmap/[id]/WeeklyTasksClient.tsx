'use client';

import { useEffect, useState } from 'react';

import type { WeeklyTask } from '@/lib/core/deriveWeeklyTasks';

interface WeeklyTaskProgress extends WeeklyTask {
  completed: boolean;
  completed_at: string | null;
}

export default function WeeklyTasksClient({
  roadmapId,
}: {
  roadmapId: string;
}) {
  const [tasks, setTasks] = useState<WeeklyTaskProgress[] | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadTasks() {
      try {
        const response = await fetch(
          `/api/roadmap/task-progress?roadmap_id=${encodeURIComponent(roadmapId)}`,
          { signal: controller.signal },
        );
        const body = await response.json();

        if (!response.ok) {
          throw new Error(body.error ?? 'Unable to load this week’s steps');
        }

        setTasks(body.tasks);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }
        setError('We couldn’t load this week’s steps. Refresh to try again.');
      }
    }

    loadTasks();
    return () => controller.abort();
  }, [roadmapId]);

  async function toggleTask(task: WeeklyTaskProgress) {
    if (pendingKeys.has(task.key)) return;

    const completed = !task.completed;
    setError(null);
    setPendingKeys((current) => new Set(current).add(task.key));
    setTasks((current) =>
      current?.map((candidate) =>
        candidate.key === task.key
          ? {
              ...candidate,
              completed,
              completed_at: completed ? new Date().toISOString() : null,
            }
          : candidate,
      ) ?? null,
    );

    try {
      const response = await fetch('/api/roadmap/task-progress', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          roadmap_id: roadmapId,
          task_key: task.key,
          completed,
        }),
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body.error ?? 'Unable to save task progress');
      }

      setTasks((current) =>
        current?.map((candidate) =>
          candidate.key === task.key
            ? {
                ...candidate,
                completed: body.progress.completed,
                completed_at: body.progress.completed_at,
              }
            : candidate,
        ) ?? null,
      );
    } catch {
      setTasks((current) =>
        current?.map((candidate) =>
          candidate.key === task.key ? task : candidate,
        ) ?? null,
      );
      setError('That change didn’t save. Please try again.');
    } finally {
      setPendingKeys((current) => {
        const next = new Set(current);
        next.delete(task.key);
        return next;
      });
    }
  }

  if (tasks === null && !error) {
    return (
      <section className="mb-12" aria-busy="true">
        <p className="text-muted text-sm">Loading this week’s steps…</p>
      </section>
    );
  }

  if (!tasks?.length) {
    return error ? (
      <p className="text-muted text-sm mb-12" role="status">
        {error}
      </p>
    ) : null;
  }

  const completedCount = tasks.filter((task) => task.completed).length;

  return (
    <section className="mb-12" aria-labelledby="weekly-tasks-heading">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div>
          <h2
            id="weekly-tasks-heading"
            className="text-muted text-sm uppercase tracking-widest"
          >
            This week
          </h2>
          <p className="text-text mt-1">Keep the next steps small and visible.</p>
        </div>
        <p className="text-muted text-sm shrink-0">
          {completedCount} of {tasks.length} done
        </p>
      </div>

      <div className="divide-y divide-hair/70 overflow-hidden rounded-2xl bg-surface shadow-[0_18px_55px_rgba(0,0,0,0.16)]">
        {tasks.map((task) => {
          const pending = pendingKeys.has(task.key);

          return (
            <label
              key={task.key}
              className={`flex items-start gap-3 px-5 py-5 transition-colors ${
                pending ? 'opacity-60' : 'cursor-pointer hover:bg-surface-2/50'
              }`}
            >
              <input
                type="checkbox"
                checked={task.completed}
                disabled={pending}
                onChange={() => toggleTask(task)}
                className="mt-1 h-5 w-5 shrink-0 accent-brand"
              />
              <span
                className={
                  task.completed
                    ? 'text-muted line-through'
                    : 'text-text leading-relaxed'
                }
              >
                {task.label}
              </span>
            </label>
          );
        })}
      </div>

      {completedCount === tasks.length ? (
        <p className="text-brand text-sm mt-3" role="status">
          You completed this week’s priorities.
        </p>
      ) : null}

      {error ? (
        <p className="text-muted text-sm mt-3" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
