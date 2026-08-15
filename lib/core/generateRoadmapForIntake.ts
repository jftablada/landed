import type { Mode } from './computeMode';

export interface RunwayPayload {
  display_state: 'exhausted' | 'critical' | 'normal';
  figure: string | null;
  show_date: boolean;
  runway_date: string | null;
  body: string;
  net_monthly_gap: number;
  runway_weeks: number;
}

export interface RoadmapPhase {
  title: string;
  actions: string[];
}

export interface RoadmapOutput {
  runway?: RunwayPayload;
  acknowledgment_line: string;
  pressure_points: string[];
  next_move: {
    action: string;
    why_first: string;
    boundary_note: string | null;
  };
  roadmap: {
    show: boolean;
    phases: RoadmapPhase[];
  };
  tools_surfaced: string[];
}

export interface CheckInRecord {
  id?: string;
  journey_id?: string;
  user_id?: string;
  previous_roadmap_id: string | null;
  new_roadmap_id: string;
  mode_changed: boolean;
  previous_mode: Mode | string | null;
  new_mode: Mode | string | null;
  change_summary?: string | null;
}

export interface GenerateOptions {
  intakeId: string;
  userId: string;
  changeSummary?: string | null;
  applicationsSubmitted?: number | null;
  employerResponses?: number | null;
  interviewsSecured?: number | null;
  biggestBarrier?: string | null;
}

export type GenerateResult =
  | {
      status: 'ok';
      roadmapId: string;
      intakeId: string;
      journeyId: string;
      mode: Mode | string;
      runway: RunwayPayload;
      emergencyPrograms: string[] | null;
      output: RoadmapOutput;
      checkIn: CheckInRecord;
    }
  | {
      status: 'blocked';
      roadmapId: string;
      intakeId: string;
      journeyId: string;
      blockReason: string;
      checkIn: CheckInRecord;
    }
  | {
      status: 'existing';
      roadmapId: string;
      intakeId: string;
      journeyId: string;
      mode: Mode | string | null;
      runway: RunwayPayload | null;
      emergencyPrograms: string[] | null;
      output: RoadmapOutput | null;
      blocked: boolean;
      blockReason: string | null;
    }
  | {
      status: 'ai_failed';
      intakeId: string;
      journeyId: string;
    };

export type GenerateRoadmapForIntake = (
  options: GenerateOptions,
) => Promise<GenerateResult>;
