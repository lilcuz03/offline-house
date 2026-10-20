import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

/*
 * Public order lookup for the "Track your order" page. A customer must give
 * BOTH the order number and the email the order was placed with. Anything
 * that does not match returns the same "not found" answer, so the page never
 * reveals whether an order number or an email exists.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// How the order statuses in the database read to customers
const STEP: Record<string, "confirmed" | "packed" | "shipped" | "delivered"> = {
  paid: "confirmed",
  confirmed: "confirmed",
  packed: "packed",
  shipped: "shipped",
  delivered: "delivered",
};

type Row = {
  number: string;
  status: string;
  payment_status: string;
  shipping_method: string;
  carrier: string | null;
  tracking_url: string | null;
};

// "100123", "oh-100123" and "OH-100123" all mean the same order
function normaliseNumber(raw: string) {
  const n = raw.trim().toUpperCase();
  return /^\d+$/.test(n) ? `OH-${n}` : n;
}

export async function POST(request: Request) {
  let body: { orderNumber?: unknown; email?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const number =
    typeof body?.orderNumber === "string" ? normaliseNumber(body.orderNumber) : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!number || number.length > 30 || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  if (!db) {
    console.error("Track order: Supabase environment variables are missing.");
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { data, error } = await db
    .from("orders")
    .select("number, status, payment_status, shipping_method, carrier, tracking_url")
    .eq("number", number)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Track order lookup failed:", error.message);
    return NextResponse.json({ error: "Could not look that up." }, { status: 500 });
  }

  const row = data as Row | null;
  const step = row ? STEP[row.status] : undefined;

  // Unpaid, cancelled and unknown orders all look like "not found"
  if (!row || row.payment_status !== "paid" || !step) {
    return NextResponse.json({ order: null });
  }

  const eta = SHIPPING_OPTIONS.find((s) => s.id === row.shipping_method)?.eta;

  return NextResponse.json({
    order: {
      number: row.number,
      status: step,
      eta: step === "delivered" ? undefined : eta,
      carrier: row.carrier ?? undefined,
      trackingUrl: row.tracking_url ?? undefined,
    },
  });
}
