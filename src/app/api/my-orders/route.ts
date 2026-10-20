import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

/*
 * Signed-in customers only. The browser sends its sign-in token; we look the
 * user up on the server and return only THEIR paid orders (linked to their
 * account, or placed with their account's email).
 */

export async function GET(request: Request) {
  const db = getSupabaseAdmin();
  if (!db) {
    return NextResponse.json(
      { error: "Server not configured." },
      { status: 500 },
    );
  }

  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const { data: auth, error: authError } = await db.auth.getUser(token);
  if (authError || !auth.user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const userId = auth.user.id;
  const email = (auth.user.email ?? "").trim().toLowerCase();

  const select =
    "id, number, created_at, status, shipping_method, subtotal_cents, shipping_cents, total_cents, order_items(id, name, variant, image, quantity, unit_price_cents)";

  const byUser = db
    .from("orders")
    .select(select)
    .eq("payment_status", "paid")
    .eq("user_id", userId);
  const byEmail = email
    ? db
        .from("orders")
        .select(select)
        .eq("payment_status", "paid")
        .ilike("email", email.replace(/[%_\\]/g, "\\$&"))
    : null;

  const [a, b] = await Promise.all([byUser, byEmail]);
  if (a.error || b?.error) {
    console.error("My orders failed:", a.error?.message ?? b?.error?.message);
    return NextResponse.json(
      { error: "Could not load orders." },
      { status: 500 },
    );
  }

  const seen = new Map<string, { created_at: string }>();
  for (const o of [...(a.data ?? []), ...(b?.data ?? [])] as {
    id: string;
    created_at: string;
  }[]) {
    seen.set(o.id, o);
  }
  const orders = [...seen.values()].sort((x, y) =>
    y.created_at.localeCompare(x.created_at),
  );

  return NextResponse.json({ orders });
}
