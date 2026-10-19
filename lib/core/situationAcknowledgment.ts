import type { SituationType } from './freeStartingPoint';

const ACKNOWLEDGMENTS: Record<SituationType, string> = {
  laid_off: 'You told us you were laid off.',
  dismissed: 'You told us you were dismissed or fired.',
  non_renewal: 'You told us your contract wasn’t renewed.',
  contract_ending: 'You told us your contract is ending soon.',
  pivot: 'You told us you’re changing careers.',
};

export function situationAcknowledgment(
  situationType: string | null,
): string | undefined {
  return situationType && Object.hasOwn(ACKNOWLEDGMENTS, situationType)
    ? ACKNOWLEDGMENTS[situationType as SituationType]
    : undefined;
}
