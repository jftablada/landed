'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import type { WeeklyTask } from '@/lib/core/deriveWeeklyTasks';
import { getWeeklyTaskGuidance } from '../../lib/core/weeklyTaskGuidance';
import WeeklyTaskGuide from './WeeklyTaskGuide';

export interface WeeklyTaskProgress extends WeeklyTask {
  completed: boolean;
  completed_at: string | null;
}

export default function WeeklyTasksClient({
  roadmapId,
  initialTasks,
  variant = 'roadmap',
  fallbackAction = 'Review your roadmap and choose one useful action.',
}: {
  roadmapId: string;
  initialTasks?: WeeklyTaskProgress[];
  variant?: 'roadmap' | 'today';
  fallbackAction?: string;
}) {
  const [tasks, setTasks] = useState<WeeklyTaskProgress[] | null>(
    initialTasks ?? null,
  );
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const pendingRef = useRef(new Set<string>());
  const [error, setError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [expandedTaskKey, setExpandedTaskKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialTasks !== undefined) return;
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
        if (
          loadError instanceof DOMException &&
          loadError.name === 'AbortError'
        ) {
          return;
        }
        setError('We couldn’t load this week’s steps. Please try again.');
      }
    }

    loadTasks();
    return () => controller.abort();
  }, [roadmapId, initialTasks, loadAttempt]);

  async function toggleTask(task: WeeklyTaskProgress) {
    if (pendingRef.current.has(task.key)) return;

    const completed = !task.completed;
    setError(null);
    pendingRef.current.add(task.key);
    setPendingKeys((current) => new Set(current).add(task.key));
    setTasks(
      (current) =>
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

      setTasks(
        (current) =>
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
      setTasks(
        (current) =>
          current?.map((candidate) =>
            candidate.key === task.key ? task : candidate,
          ) ?? null,
      );
      setError('That change didn’t save. Please try again.');
    } finally {
      pendingRef.current.delete(task.key);
      setPendingKeys((current) => {
        const next = new Set(current);
        next.delete(task.key);
        return next;
      });
    }
  }

  if (tasks === null) {
    return (
      <section
        className={
          variant === 'today'
            ? 'mt-8 rounded-2xl bg-surface p-6 sm:p-10'
            : 'mb-12'
        }
        aria-busy={!error}
      >
        <p className="text-muted text-sm" role={error ? 'alert' : 'status'}>
          {error ?? 'Loading this week’s steps…'}
        </p>
        {error ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoadAttempt((attempt) => attempt + 1);
            }}
            className="mt-4 rounded-lg border border-hair px-4 py-2 text-sm text-text hover:bg-surface-2"
          >
            Try again
          </button>
        ) : null}
      </section>
    );
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const nextTask = tasks.find((task) => !task.completed);
  const caughtUp = tasks.length > 0 && completedCount === tasks.length;
  const completionPercent = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;
  const headingId =
    variant === 'today' ? 'today-next-move-heading' : 'weekly-tasks-heading';
  const WeeklyHeading = variant === 'today' ? 'h3' : 'h2';

  if (!tasks.length && variant === 'roadmap') return null;

  return (
    <section
      className={
        variant === 'today'
          ? 'mt-8 rounded-2xl bg-surface p-6 shadow-[0_22px_70px_rgba(0,0,0,0.24)] sm:p-10'
          : 'mb-12'
      }
      aria-labelledby={headingId}
    >
      {variant === 'today' ? (
        <>
          <p className="text-sm uppercase tracking-widest text-brand">
            Your next move
          </p>
          <h2
            id={headingId}
            className="mt-4 max-w-3xl text-2xl leading-snug text-text sm:text-4xl"
            aria-live="polite"
          >
            {caughtUp
              ? 'You’re caught up.'
              : (nextTask?.label ?? fallbackAction)}
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            {caughtUp
              ? 'Your current priorities are complete. Check in when something changes.'
              : 'One step at a time. Mark a step done here as you go.'}
          </p>
        </>
      ) : null}

      {tasks.length > 0 ? (
        <>
          <div
            className={`flex items-end justify-between gap-4 mb-3 ${variant === 'today' ? 'mt-8' : ''}`}
          >
            <div>
              <WeeklyHeading
                id={
                  variant === 'roadmap'
                    ? headingId
                    : 'today-weekly-tasks-heading'
                }
                className="text-muted text-sm uppercase tracking-widest"
              >
                This week
              </WeeklyHeading>
              {variant === 'roadmap' ? (
                <p className="text-text mt-1">
                  Keep the next steps small and visible.
                </p>
              ) : null}
            </div>
            <p className="text-muted text-sm shrink-0">
              {completedCount} of {tasks.length} done
            </p>
          </div>

          {variant === 'today' ? (
            <div
              role="progressbar"
              aria-label="This week’s progress"
              aria-valuemin={0}
              aria-valuemax={tasks.length}
              aria-valuenow={completedCount}
              className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-200 motion-reduce:transition-none"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          ) : null}

          <div
            className={`divide-y divide-hair/70 ${variant === 'today' ? '' : 'overflow-hidden rounded-2xl bg-surface shadow-[0_18px_55px_rgba(0,0,0,0.16)]'}`}
          >
            {tasks.map((task) => {
              const pending = pendingKeys.has(task.key);
              const expanded = expandedTaskKey === task.key;
              const guideId = `${variant}-${roadmapId}-${task.key}-guide`;
              const triggerId = `${guideId}-trigger`;

              return (
                <div
                  key={task.key}
                  className={variant === 'today' ? 'px-2 -mx-2' : 'px-5'}
                >
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      aria-label={task.label}
                      checked={task.completed}
                      disabled={pending}
                      onChange={() => toggleTask(task)}
                      className="mt-6 h-5 w-5 shrink-0 accent-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand disabled:opacity-60"
                    />
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={expanded}
                      aria-controls={guideId}
                      onClick={() =>
                        setExpandedTaskKey(expanded ? null : task.key)
                      }
                      className="group flex min-w-0 flex-1 items-start justify-between gap-4 rounded-lg py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    >
                      <span className="min-w-0">
                        <span
                          className={`block leading-relaxed ${task.completed ? 'text-muted line-through' : 'text-text'}`}
                        >
                          {task.label}
                        </span>
                        <span className="mt-1.5 block text-xs text-muted transition-colors group-hover:text-brand">
                          {expanded ? 'Close guide' : 'How to do this'}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 shrink-0 text-lg leading-none ${expanded ? 'text-brand' : 'text-muted group-hover:text-brand'}`}
                      >
                        {expanded ? '−' : '+'}
                      </span>
                    </button>
                  </div>
                  <div
                    id={guideId}
                    role="region"
                    aria-labelledby={triggerId}
                    hidden={!expanded}
                    className="sm:ml-9"
                  >
                    {expanded ? (
                      <WeeklyTaskGuide
                        key={task.key}
                        guide={getWeeklyTaskGuidance(task.label)}
                      />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {caughtUp && variant === 'roadmap' ? (
            <p className="text-brand text-sm mt-3" role="status">
              You completed this week’s priorities.
            </p>
          ) : null}
        </>
      ) : null}

      {variant === 'today' ? (
        <Link
          href={`/roadmap/${roadmapId}`}
          className={
            tasks.length
              ? 'mt-5 inline-block text-sm text-muted underline underline-offset-4 hover:text-text'
              : 'mt-8 inline-block rounded-xl bg-brand px-6 py-3.5 font-semibold text-black hover:opacity-90'
          }
        >
          {tasks.length ? 'View your full plan' : 'Open my roadmap'}
        </Link>
      ) : null}

      {pendingKeys.size > 0 ? (
        <p className="mt-3 text-sm text-muted" role="status">
          Saving your progress…
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
