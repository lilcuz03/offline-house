import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { sendShippedEmail } from "@/lib/shipped-email";

/*
 * Admin only. Changes an order's status, and when an order is marked shipped,
 * emails the customer once. The browser sends its sign-in token; requireAdmin
 * checks it on the server before anything is changed.
 */

const STATUSES = ["pending", "paid", "packed", "shipped", "delivered"] as const;
type Status = (typeof STATUSES)[number];

export async function POST(request: Request) {
  const guard = await requireAdmin(request);
  if (!guard.ok) return guard.response;

  const body = (await request.json().catch(() => null)) as {
    orderId?: unknown;
    status?: unknown;
  } | null;
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const status = body?.status as Status;
  if (!orderId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const { error } = await guard.db
    .from("orders")
    .update({ status })
    .eq("id", orderId);
  if (error) {
    console.error("Order status update failed:", error.message);
    return NextResponse.json(
      { error: "Could not update the order." },
      { status: 500 },
    );
  }

  const email =
    status === "shipped" ? await sendShippedEmail(guard.db, orderId) : null;
  return NextResponse.json({ ok: true, email });
}
