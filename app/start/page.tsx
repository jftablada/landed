// app/start/page.tsx
// Server component. The "where should this user go?" decision point.
//
// Login redirects here instead of straight to /intake. This route checks
// the user's state and forwards them:
//   • no journey                    → /intake
//   • active journey, no roadmap    → /intake (or next step; V1 = intake)
//   • active journey + roadmap(s)   → latest roadmap
//
// Runs on the server so the decision is reliable and made before render.

import { redirect } from 'next/navigation';
import {
  getAuthedUserId,
  createSupabaseServerClient,
} from '@/lib/supabase/server';

export default async function StartPage() {
  const userId = await getAuthedUserId();
  if (!userId) redirect('/login');

  const supabase = await createSupabaseServerClient();

  // 1. Find the user's active journey (if any).
  const { data: journey } = await supabase
    .from('journeys')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // No active journey → start fresh.
  if (!journey) redirect('/intake');

  // 2. Find the latest roadmap in that journey.
  const { data: roadmap } = await supabase
    .from('roadmaps')
    .select('id')
    .eq('user_id', userId)
    .eq('journey_id', journey.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Active journey but no roadmap yet → finish intake / generate.
  if (!roadmap) redirect('/intake');

  // Has a plan → straight to the latest roadmap.
  redirect(`/roadmap/${roadmap.id}`);
}
