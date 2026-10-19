export default function TestEnvironmentBanner() {
  if (process.env.VERCEL_ENV !== 'preview') return null;

  return (
    <div
      role="note"
      className="border-b border-brand/30 bg-brand-soft px-5 py-2 text-center text-xs font-semibold uppercase tracking-widest text-text"
    >
      Test site · Use fictional details. Test payments only.
    </div>
  );
}
