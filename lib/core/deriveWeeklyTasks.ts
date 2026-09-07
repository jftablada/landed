import type { RoadmapOutput } from './generateRoadmapForIntake';

export interface WeeklyTask {
  key:
    | 'adaptive_priority'
    | 'next_move'
    | `phase_${number}_action_${number}`;
  label: string;
  order: number;
}

type WeeklyTaskSource = Pick<
  RoadmapOutput,
  'adaptive' | 'next_move' | 'roadmap'
>;

const MAX_WEEKLY_TASKS = 3;

export function deriveWeeklyTasks(output: WeeklyTaskSource): WeeklyTask[] {
  const tasks: WeeklyTask[] = [];
  const seenLabels = new Set<string>();

  const addTask = (key: WeeklyTask['key'], rawLabel: string) => {
    const label = rawLabel.trim();
    const normalizedLabel = label.toLowerCase();

    if (
      !label ||
      seenLabels.has(normalizedLabel) ||
      tasks.length >= MAX_WEEKLY_TASKS
    ) {
      return;
    }

    seenLabels.add(normalizedLabel);
    tasks.push({ key, label, order: tasks.length + 1 });
  };

  const adaptivePriority = output.adaptive?.this_weeks_priority;
  if (adaptivePriority?.trim()) {
    addTask('adaptive_priority', adaptivePriority);
  } else {
    addTask('next_move', output.next_move.action);
  }

  if (!output.roadmap.show) return tasks;

  for (const [phaseIndex, phase] of output.roadmap.phases.entries()) {
    for (const [actionIndex, action] of phase.actions.entries()) {
      addTask(`phase_${phaseIndex}_action_${actionIndex}`, action);
      if (tasks.length === MAX_WEEKLY_TASKS) return tasks;
    }
  }

  return tasks;
}
