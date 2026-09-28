export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TEST_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
}
