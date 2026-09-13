import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function AuthenticatedNav({ roadmapId }: { roadmapId?: string }) {
  return (
    <header className="flex flex-col gap-5 border-b border-hair/70 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <Link href="/start" className="font-display text-xl tracking-widest text-text">LANDED</Link>
      <nav aria-label="Account navigation" className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-muted">
        <Link href="/start" className="transition-colors hover:text-text">Today</Link>
        {roadmapId ? <Link href={`/roadmap/${roadmapId}`} className="transition-colors hover:text-text">Your plan</Link> : null}
        <Link href="/start#progress" className="transition-colors hover:text-text">Progress</Link>
        <a href="mailto:hello@getlanded.ca" className="transition-colors hover:text-text">Support</a>
        <LogoutButton />
      </nav>
    </header>
  );
}
