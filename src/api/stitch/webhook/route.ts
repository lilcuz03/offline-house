import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  confirmStitchOrder,
  getStitchConfig,
  verifyStitchWebhook,
} from "@/lib/stitch";

type Found = { id?: string; externalReference?: string };

// The payment details sit a few levels down; find the first object that has an
// externalReference instead of depending on the exact nesting.
function findPayment(value: unknown, depth = 0): Found | null {
  if (!value || typeof value !== "object" || depth > 8) return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.externalReference === "string") {
    return {
      id: typeof obj.id === "string" ? obj.id : undefined,
      externalReference: obj.externalReference,
    };
  }
  for (const child of Object.values(obj)) {
    const hit = findPayment(child, depth + 1);
    if (hit) return hit;
  }
  return null;
}

// Stitch calls this when a payment completes, is cancelled or expires. The
// message is signed, and we still ask Stitch for the real status before
// touching the order.
export async function POST(request: Request) {
  const cfg = getStitchConfig();
  const db = getSupabaseAdmin();
  if (!cfg || !db || !cfg.webhookSecret) {
    console.error("Stitch webhook: environment variables are missing.");
    return new NextResponse("Server not configured", { status: 500 });
  }

  const raw = await request.text();
  if (!verifyStitchWebhook(raw, request.headers, cfg.webhookSecret)) {
    console.error("Stitch webhook rejected: bad signature");
    return new NextResponse("Rejected", { status: 400 });
  }

  let found: Found | null = null;
  try {
    found = findPayment(JSON.parse(raw));
  } catch {
    return new NextResponse("Bad body", { status: 400 });
  }
  if (!found) {
    console.error("Stitch webhook: no payment in message");
    return new NextResponse("OK", { status: 200 });
  }

  // Match by the Stitch payment id we saved, falling back to the order number
  const query = db
    .from("orders")
    .select("id, total_cents, payment_status, payment_reference")
    .eq("payment_provider", "stitch");
  const { data } = await (
    found.id
      ? query.eq("payment_reference", found.id)
      : query.eq("number", found.externalReference ?? "")
  ).maybeSingle();

  if (!data) {
    console.error(
      "Stitch webhook: order not found for",
      found.id ?? found.externalReference,
    );
    return new NextResponse("OK", { status: 200 }); // not ours; retrying won't help
  }

  try {
    await confirmStitchOrder(db, cfg, data);
  } catch (err) {
    console.error("Stitch webhook: could not confirm:", err);
    return new NextResponse("Could not update order", { status: 500 }); // Stitch retries
  }
  return new NextResponse("OK", { status: 200 });
}
