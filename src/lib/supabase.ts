import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True once the two public keys are set in .env.local */
export const supabaseConfigured = Boolean(url && anonKey);

/**
 * Public client. Safe in the browser and in server components.
 * It can only do what the Row Level Security rules allow, which for visitors
 * means reading products and categories.
 */
export function getSupabase(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and fill in your project URL and anon key.",
    );
  }
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}
