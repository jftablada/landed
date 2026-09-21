'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { trackEvent } from '@/lib/analytics';
import { generateRoadmapFromSavedIntake } from '@/lib/core/createInitialRoadmap';

export default function ResumeInitialRoadmap({
  intakeId,
}: {
  intakeId: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resume() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const roadmapId = await generateRoadmapFromSavedIntake(intakeId);
      trackEvent('roadmap_generation_resumed');
      router.push(`/roadmap/${roadmapId}`);
    } catch {
      setError(
        'Your saved details are safe. We could not finish your plan right now. Please try again in a moment.',
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-400">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={resume}
        disabled={submitting}
        className="rounded-xl bg-brand px-6 py-3.5 font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Building your roadmap…' : 'Finish my roadmap'}
      </button>
    </div>
  );
}
