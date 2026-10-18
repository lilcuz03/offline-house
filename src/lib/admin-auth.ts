import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/*
 * Server-only guard for admin API routes. The browser sends its sign-in token
 * in the Authorization header; we check it with Supabase and confirm the
 * profile is an admin BEFORE touching anything with the secret key.
 */

type Guard =
  | { ok: true; db: SupabaseClient; userId: string }
  | { ok: false; response: NextResponse };

const deny = (error: string, status: number): Guard => ({
  ok: false,
  response: NextResponse.json({ error }, { status }),
});

export async function requireAdmin(request: Request): Promise<Guard> {
  const db = getSupabaseAdmin();
  if (!db) return deny("The server is not configured.", 500);

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) return deny("Sign in first.", 401);

  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return deny("Sign in first.", 401);

  const { data: profile } = await db
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.is_admin) return deny("Admin access only.", 403);

  return { ok: true, db, userId: data.user.id };
}
