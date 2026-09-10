const STEPS = [
  'Payment',
  'Account',
  'Starting point',
  'Financial details',
  'Roadmap',
];

export default function OnboardingProgress({
  currentStep,
  detail,
}: {
  currentStep: number;
  detail: string;
}) {
  const safeStep = Math.min(Math.max(currentStep, 1), STEPS.length);

  return (
    <section
      aria-label={`Setup progress: step ${safeStep} of ${STEPS.length}`}
      className="mb-9 rounded-xl border border-hair bg-surface p-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-medium uppercase tracking-widest text-brand">
          Step {safeStep} of {STEPS.length}
        </p>
        <p className="text-xs text-muted">{STEPS[safeStep - 1]}</p>
      </div>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        {STEPS.map((step, index) => (
          <span
            key={step}
            className={`h-1.5 flex-1 rounded-full ${
              index < safeStep ? 'bg-brand' : 'bg-surface-2'
            }`}
          />
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">{detail}</p>
    </section>
  );
}
