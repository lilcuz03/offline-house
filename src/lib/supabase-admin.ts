import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client that uses the service role key, which bypasses
 * row level security. Import it only from route handlers and server code,
 * never from a "use client" file, and never prefix the key with NEXT_PUBLIC_.
 *
 * .env.local needs:
 *   NEXT_PUBLIC_SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...
 */
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
