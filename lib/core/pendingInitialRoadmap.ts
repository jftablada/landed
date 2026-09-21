export interface DatedIntake {
  id: string;
  created_at: string;
}

export interface DatedRoadmap {
  intake_id: string;
  created_at: string;
}

export function hasPendingInitialRoadmap(
  latestIntake: DatedIntake | null,
  latestRoadmap: DatedRoadmap | null,
): boolean {
  if (!latestIntake) return false;
  if (!latestRoadmap) return true;
  if (latestRoadmap.intake_id === latestIntake.id) return false;

  const intakeTime = Date.parse(latestIntake.created_at);
  const roadmapTime = Date.parse(latestRoadmap.created_at);
  return (
    Number.isFinite(intakeTime) &&
    Number.isFinite(roadmapTime) &&
    intakeTime > roadmapTime
  );
}
