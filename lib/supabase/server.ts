// lib/supabase/server.ts
// Server-side Supabase client for Next.js App Router.
//
// Use this inside API route handlers and server components. It reads the
// logged-in user's session from cookies, so auth.uid() resolves to the
// real user and RLS applies correctly.
//
// Created PER REQUEST — never share one of these across requests.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component where cookies can't be set.
            // Safe to ignore — the session is refreshed in middleware/route
            // handlers where setting cookies IS allowed.
          }
        },
      },
    },
  );
}

/**
 * Convenience: get the authenticated user's id, or null if not logged in.
 * API routes call this first; if it returns null, respond 401.
 */
export async function getAuthedUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}