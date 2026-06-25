import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-5 text-center">
      <p className="text-muted mb-2 text-sm uppercase tracking-widest">Landed</p>
      <h1 className="font-display mb-6 text-4xl leading-tight text-balance">
        You just got the call. Now what?
      </h1>
      <p className="text-muted mb-8">
        Landed helps you build a real plan for what&apos;s next.
      </p>
      <Link
        href="/login"
        className="rounded-lg bg-brand px-6 py-3 font-medium text-black"
      >
        Sign in / Get started
      </Link>
    </main>
  );
}