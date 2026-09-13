import type { SupabaseClient } from '@supabase/supabase-js';

export async function hasLandedAccess(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_landed_access');
  if (error) throw new Error(`Could not verify purchase access: ${error.message}`);
  return data === true;
}

export const PAYMENT_REQUIRED_RESPONSE = {
  error: 'payment_required',
  message: 'A completed Landed purchase is required to build a roadmap.',
};
