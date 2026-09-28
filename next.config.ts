import type { NextConfig } from "next";

if (process.env.VERCEL_ENV === "preview") {
  const testSupabaseUrl = "https://bcxeurldkkircizzmtxp.supabase.co";
  if (process.env.NEXT_PUBLIC_SUPABASE_TEST_URL !== testSupabaseUrl) {
    throw new Error("Preview builds must use the isolated Landed Test Supabase project");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_TEST_KEY?.startsWith("sb_publishable_")) {
    throw new Error("Preview builds must use the Landed Test publishable key");
  }
  if (
    process.env.STRIPE_TEST_SECRET_KEY &&
    !process.env.STRIPE_TEST_SECRET_KEY.startsWith("sk_test_")
  ) {
    throw new Error("Preview builds must not use a live Stripe secret key");
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
