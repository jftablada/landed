export type StartAccessState =
  | 'missing_purchase'
  | 'ready_for_intake'
  | 'returning_user';

export function resolveStartAccessState(
  hasAccess: boolean,
  hasJourney: boolean,
): StartAccessState {
  if (!hasAccess) return 'missing_purchase';
  if (!hasJourney) return 'ready_for_intake';
  return 'returning_user';
}
