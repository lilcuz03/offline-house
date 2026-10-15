import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/*
 * Server-only Supabase client that uses the SECRET key and bypasses Row Level
 * Security. It is used to create orders and to mark them paid.
 *
 * Never import this from a component with "use client", and never put the key
 * in a variable starting with NEXT_PUBLIC_, or it would be exposed in the browser.
 *
 * .env.local and Vercel:
 *   SUPABASE_SERVICE_ROLE_KEY=your secret key (sb_secret_... or the legacy service_role key)
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
