import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getPayfastConfig, verifyNotification } from "@/lib/payfast";

type OrderRow = { id: string; total_cents: number; payment_status: string };

// PayFast calls this after every payment attempt. It is the only thing that
// marks an order as paid, so the customer's browser can never fake a payment.
export async function POST(request: Request) {
  const cfg = getPayfastConfig();
  const db = getSupabaseAdmin();
  if (!cfg || !db) {
    console.error("PayFast notify: environment variables are missing.");
    return new NextResponse("Server not configured", { status: 500 });
  }

  const raw = await request.text();
  const check = await verifyNotification(raw, cfg);
  if (!check.ok) {
    console.error("PayFast notify rejected:", check.reason);
    return new NextResponse("Rejected", { status: 400 });
  }

  const p = check.params;
  const number = p.get("m_payment_id") ?? "";
  const status = p.get("payment_status") ?? "";
  const gross = Math.round(parseFloat(p.get("amount_gross") ?? "0") * 100);

  const { data, error } = await db
    .from("orders")
    .select("id, total_cents, payment_status")
    .eq("number", number)
    .maybeSingle();

  if (error || !data) {
    console.error("PayFast notify: order not found:", number);
    return new NextResponse("Unknown order", { status: 400 });
  }
  const order = data as OrderRow;

  // The amount paid must match what we asked for
  if (gross !== order.total_cents) {
    console.error("PayFast notify: amount mismatch for", number, gross, order.total_cents);
    return new NextResponse("Amount mismatch", { status: 400 });
  }

  if (status === "COMPLETE") {
    const { error: rpcError } = await db.rpc("fulfil_order", {
      p_order_id: order.id,
      p_reference: p.get("pf_payment_id") ?? "",
    });
    if (rpcError) {
      console.error("PayFast notify: fulfil_order failed:", rpcError.message);
      return new NextResponse("Could not update order", { status: 500 });
    }
  } else if (status === "FAILED" || status === "CANCELLED") {
    if (order.payment_status !== "paid") {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    }
  }
  // PENDING: nothing to do yet, PayFast will notify again

  return new NextResponse("OK", { status: 200 });
}
