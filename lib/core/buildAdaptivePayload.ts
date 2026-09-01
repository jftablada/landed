import type { Mode } from './computeMode';
import type { AdaptivePayload } from './generateRoadmapForIntake';

export interface AdaptiveRuleInput {
  applicationsSubmitted: number | null | undefined;
  employerResponses: number | null | undefined;
  interviewsSecured: number | null | undefined;
  biggestBarrier: string | null | undefined;
  elapsedDays: number;
  previousMode: Mode | null;
  currentMode: Mode;
}

const MODE_SEVERITY: Record<Mode, number> = {
  critical: 0,
  survival: 1,
  balanced: 2,
  strategic: 3,
};

const LOW_CAPACITY_BARRIERS = new Set([
  'Motivation/energy',
  'Personal responsibilities',
]);

const ROLE_TARGETING_BARRIERS = new Set([
  "Couldn't find enough suitable jobs",
  'Unsure which jobs were worth applying to',
]);

function activitySummary(
  applications: number,
  responses: number,
  interviews: number,
): string {
  return `You submitted ${applications} application${applications === 1 ? '' : 's'}, received ${responses} employer response${responses === 1 ? '' : 's'}, and secured ${interviews} interview${interviews === 1 ? '' : 's'}.`;
}

/**
 * Applies the Adaptive Check-In V1 precedence rules to one complete activity
 * report. Returns null for legacy or partial reports rather than treating
 * missing values as zero.
 */
export function buildAdaptivePayload(
  input: AdaptiveRuleInput,
): AdaptivePayload | null {
  const {
    applicationsSubmitted,
    employerResponses,
    interviewsSecured,
    biggestBarrier,
    elapsedDays,
    previousMode,
    currentMode,
  } = input;

  if (
    applicationsSubmitted == null ||
    employerResponses == null ||
    interviewsSecured == null ||
    biggestBarrier == null
  ) {
    return null;
  }

  const whatChanged = activitySummary(
    applicationsSubmitted,
    employerResponses,
    interviewsSecured,
  );

  if (
    previousMode !== null &&
    MODE_SEVERITY[currentMode] < MODE_SEVERITY[previousMode]
  ) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'Your financial runway has tightened enough to change your recovery mode.',
      this_weeks_priority:
        'Stabilize your immediate finances before increasing job-search intensity.',
      why:
        'Protecting essential expenses gives you a safer base for the rest of your search.',
      rule_fired: 'financial_deterioration',
      diagnosis_withheld: false,
    };
  }

  if (interviewsSecured >= 3) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'You are getting interviews, which means your applications are creating opportunities.',
      this_weeks_priority:
        'Put more weight on interview preparation while keeping your application activity moving.',
      why:
        'Preparing for the opportunities already appearing is the strongest next use of your time.',
      rule_fired: 'interviews_occurring',
      diagnosis_withheld: false,
    };
  }

  if (LOW_CAPACITY_BARRIERS.has(biggestBarrier)) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'Your current capacity is the main constraint, so adding more tasks may be counterproductive.',
      this_weeks_priority:
        'Choose a smaller, sustainable search target and protect the time needed to complete it.',
      why:
        'A lighter plan you can repeat is more useful than an ambitious plan that drains your energy.',
      rule_fired: 'barrier_low_capacity',
      diagnosis_withheld: false,
    };
  }

  if (applicationsSubmitted < 15 || elapsedDays < 14) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'There is not enough evidence yet to identify a reliable application-response pattern.',
      this_weeks_priority:
        'Keep building a focused sample of applications and record what comes back.',
      why:
        'Landed waits for at least 15 applications and 14 days before drawing a conversion conclusion.',
      rule_fired: 'volume_gate_insufficient',
      diagnosis_withheld: true,
    };
  }

  const responseRate = employerResponses / applicationsSubmitted;

  if (responseRate < 0.1) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'Your response rate suggests your role targeting or application alignment may need attention.',
      this_weeks_priority:
        'Review the roles you are targeting and tighten how each application matches the job.',
      why:
        'With enough activity to see a pattern, a response rate below 10% is a reason to test a more focused approach.',
      rule_fired: 'low_response_rate',
      diagnosis_withheld: false,
    };
  }

  if (responseRate >= 0.15) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'Your applications are generating a healthy level of employer interest.',
      this_weeks_priority:
        'Maintain your application strategy and prepare carefully for recruiter and interview conversations.',
      why:
        'A response rate of 15% or more suggests the current approach is creating opportunities.',
      rule_fired: 'healthy_response_rate',
      diagnosis_withheld: false,
    };
  }

  if (ROLE_TARGETING_BARRIERS.has(biggestBarrier)) {
    return {
      what_changed: whatChanged,
      what_this_suggests:
        'Your results are not conclusive yet, but finding and choosing suitable roles is slowing the search.',
      this_weeks_priority:
        'Clarify your target roles and use that definition to screen opportunities before applying.',
      why:
        'A clearer target makes it easier to find suitable jobs and spend time on the strongest matches.',
      rule_fired: 'barrier_role_targeting',
      diagnosis_withheld: false,
    };
  }

  return {
    what_changed: whatChanged,
    what_this_suggests:
      'The current results do not show a strong enough pattern to justify changing direction.',
    this_weeks_priority:
      'Keep your current approach steady and continue tracking what happens.',
    why:
      'Your response rate is between the low and healthy thresholds, so a measured next week is better than a premature diagnosis.',
    rule_fired: 'neutral_progress',
    diagnosis_withheld: false,
  };
}
