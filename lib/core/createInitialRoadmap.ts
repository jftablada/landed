type Fetcher = typeof fetch;

type IntakeResponse = {
  intake_id?: string;
  error?: string;
  message?: string;
};

type GenerationResponse = {
  roadmap_id?: string;
  error?: string;
  message?: string;
};

export class SavedIntakeGenerationError extends Error {
  constructor(
    public readonly intakeId: string,
    message: string,
  ) {
    super(message);
    this.name = 'SavedIntakeGenerationError';
  }
}

export async function generateRoadmapFromSavedIntake(
  intakeId: string,
  fetcher: Fetcher = fetch,
): Promise<string> {
  try {
    const response = await fetcher('/api/roadmap/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intake_id: intakeId }),
    });
    const data = (await response.json()) as GenerationResponse;
    if (!response.ok || !data.roadmap_id) {
      throw new Error(data.message || data.error || 'Could not build your plan.');
    }
    return data.roadmap_id;
  } catch (error) {
    throw new SavedIntakeGenerationError(
      intakeId,
      error instanceof Error ? error.message : 'Could not build your plan.',
    );
  }
}

export async function saveIntakeAndGenerateRoadmap(
  intakeBody: Record<string, unknown>,
  pendingIntakeId: string | null,
  fetcher: Fetcher = fetch,
  onIntakeSaved?: (intakeId: string) => void,
): Promise<string> {
  let intakeId = pendingIntakeId;

  if (!intakeId) {
    const response = await fetcher('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(intakeBody),
    });
    const data = (await response.json()) as IntakeResponse;
    if (!response.ok || !data.intake_id) {
      throw new Error(data.message || data.error || 'Could not save your intake.');
    }
    intakeId = data.intake_id;
    onIntakeSaved?.(intakeId);
  }

  return generateRoadmapFromSavedIntake(intakeId, fetcher);
}
