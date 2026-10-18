import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every account, with last sign-in, admin flag and number of paid orders. */
export async function GET(request: Request) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;
  const { db } = guard;

  // Supabase lists users in pages; 5 pages of 200 covers the first 1000
  const users: {
    id: string;
    email: string | null;
    created_at: string;
    last_sign_in_at: string | null;
  }[] = [];
  for (let page = 1; page <= 5; page++) {
    const { data, error } = await db.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    users.push(
      ...data.users.map((u) => ({
        id: u.id,
        email: u.email ?? null,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
      })),
    );
    if (data.users.length < 200) break;
  }

  const [profiles, orders] = await Promise.all([
    db.from("profiles").select("id, is_admin"),
    db
      .from("orders")
      .select("email")
      .eq("payment_status", "paid")
      .eq("is_test", false)
      .limit(5000),
  ]);
  const admins = new Set(
    ((profiles.data ?? []) as { id: string; is_admin: boolean }[])
      .filter((p) => p.is_admin)
      .map((p) => p.id),
  );
  const orderCount = new Map<string, number>();
  for (const o of (orders.data ?? []) as { email: string | null }[]) {
    const e = o.email?.toLowerCase();
    if (e) orderCount.set(e, (orderCount.get(e) ?? 0) + 1);
  }

  const result = users
    .map((u) => ({
      ...u,
      is_admin: admins.has(u.id),
      orders: orderCount.get(u.email?.toLowerCase() ?? "") ?? 0,
    }))
    .sort((a, b) =>
      (b.last_sign_in_at ?? b.created_at).localeCompare(
        a.last_sign_in_at ?? a.created_at,
      ),
    );

  return NextResponse.json({ users: result });
}

/** Make someone an admin, or take it away. */
export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;
  const { db, userId: me } = guard;

  let body: { userId?: unknown; isAdmin?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const target = typeof body.userId === "string" ? body.userId : "";
  if (!UUID_RE.test(target) || typeof body.isAdmin !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (target === me && !body.isAdmin) {
    return NextResponse.json(
      {
        error:
          "You can't remove your own admin access. Ask another admin to do it.",
      },
      { status: 400 },
    );
  }

  const { data: found, error: findError } =
    await db.auth.admin.getUserById(target);
  if (findError || !found.user) {
    return NextResponse.json(
      { error: "That account does not exist." },
      { status: 404 },
    );
  }

  const { data: updated, error } = await db
    .from("profiles")
    .update({ is_admin: body.isAdmin })
    .eq("id", target)
    .select("id");
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Some accounts have no profile row yet; create one
  if (!updated || updated.length === 0) {
    const { error: insertError } = await db
      .from("profiles")
      .insert({ id: target, is_admin: body.isAdmin });
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
