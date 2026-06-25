// app/api/logout/route.ts
// POST /api/logout — signs the user out (clears the session cookie) and
// returns to /login. Called by the LogoutButton.

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  // Redirect back to login after sign-out.
  return NextResponse.redirect(new URL('/login', req.url), { status: 303 });
}
