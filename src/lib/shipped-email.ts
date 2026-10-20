import type { SupabaseClient } from "@supabase/supabase-js";
import { emailConfigured, sendEmail } from "@/lib/email";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

/*
 * The "your order is on its way" email. Sent once, when you mark an order as
 * shipped in the admin. Safe to call twice: the first call claims the order
 * (shipped_email_sent_at), so marking it shipped again never emails twice.
 */

type Item = {
  name: string;
  variant: string | null;
  quantity: number;
};

type ShippedOrder = {
  number: string;
  access_token: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  shipping_method: string | null;
  payment_status: string;
  order_items: Item[];
};

export type ShippedEmailResult = "sent" | "skipped" | "failed";

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

const INK = "#0a0a0a";
const GOLD = "#b8935a";
const LINE = "#e8e2d6";
const MUTED = "#6b665c";

function addressLines(o: ShippedOrder) {
  return [
    `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim(),
    o.address1,
    o.address2,
    o.suburb,
    [o.city, o.province, o.postal_code].filter(Boolean).join(", "),
  ].filter((l): l is string => !!l);
}

export function buildShippedEmail(o: ShippedOrder) {
  const ship = SHIPPING_OPTIONS.find((s) => s.id === o.shipping_method);
  const link = `${siteUrl()}/checkout/success?order=${encodeURIComponent(o.number)}&token=${o.access_token}`;
  const first = o.first_name?.trim() || "there";
  const address = addressLines(o);

  const items = o.order_items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;">${esc(i.name)}${
          i.variant
            ? ` <span style="color:${MUTED};font-size:12px;">(${esc(i.variant)})</span>`
            : ""
        }</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${LINE};font-size:14px;color:${MUTED};white-space:nowrap;">Qty ${i.quantity}</td></tr>`,
    )
    .join("");

  const eta = ship ? `${ship.label}, ${ship.eta}` : "";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f4ee;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">Order ${esc(o.number)} is on its way.</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;color:${INK};">
<tr><td style="padding:28px 28px 0 28px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">Offline House</td></tr>
<tr><td style="padding:12px 28px 0 28px;">
<h1 style="margin:8px 0 6px 0;font-family:Georgia,serif;font-weight:normal;font-size:30px;">Your order is on its way, ${esc(first)}.</h1>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${MUTED};">Order <strong style="color:${INK};">${esc(o.number)}</strong> has been sent.${
    eta ? ` Delivery: ${esc(eta)}.` : ""
  } Delivery times are estimates, counted in working days.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
</td></tr>
<tr><td style="padding:22px 28px 0 28px;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">Delivering to</p>
<p style="margin:0;font-size:14px;line-height:1.6;">${address.map(esc).join("<br>")}</p>
</td></tr>
<tr><td style="padding:24px 28px 28px 28px;">
<a href="${link}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:14px;padding:14px 26px;border-radius:999px;">View your order</a>
<p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${MUTED};">Someone needs to be available to receive the parcel. Questions? Just reply to this email and quote ${esc(o.number)}.</p>
</td></tr>
<tr><td style="padding:18px 28px 28px 28px;font-size:12px;color:${MUTED};line-height:1.6;border-top:1px solid ${LINE};">Offline House. Disconnect to reconnect.</td></tr>
</table></td></tr></table></body></html>`;

  const text = `Your order is on its way, ${first}.

Order ${o.number} has been sent.${eta ? `\nDelivery: ${eta}.` : ""}
Delivery times are estimates, counted in working days.

${o.order_items
  .map(
    (i) => `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x ${i.quantity}`,
  )
  .join("\n")}

Delivering to:
${address.join("\n")}

View your order: ${link}

Someone needs to be available to receive the parcel. Questions? Just reply to this email and quote ${o.number}.

Offline House. Disconnect to reconnect.`;

  return {
    subject: `Your Offline House order ${o.number} is on its way`,
    html,
    text,
  };
}

/** Never throws. Tells the caller whether the email went out. */
export async function sendShippedEmail(
  db: SupabaseClient,
  orderId: string,
): Promise<ShippedEmailResult> {
  try {
    if (!emailConfigured()) {
      console.error(
        "Shipped email: RESEND_API_KEY or EMAIL_FROM is missing, so no email was sent.",
      );
      return "failed";
    }

    // Claim the order. Only the first caller gets a row back.
    const { data: claimed, error: claimError } = await db
      .from("orders")
      .update({ shipped_email_sent_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("payment_status", "paid")
      .is("shipped_email_sent_at", null)
      .select("id")
      .maybeSingle();
    if (claimError) {
      console.error(
        "Shipped email: could not claim the order (run supabase/shipped-email.sql):",
        claimError.message,
      );
      return "failed";
    }
    if (!claimed) return "skipped";

    const { data } = await db
      .from("orders")
      .select(
        "number, access_token, email, first_name, last_name, address1, address2, suburb, city, province, postal_code, shipping_method, payment_status, order_items(name, variant, quantity)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!data) return "failed";
    const order = data as unknown as ShippedOrder;

    const sent = await sendEmail({
      to: order.email,
      ...buildShippedEmail(order),
      idempotencyKey: `order-shipped-${orderId}`,
    });
    if (!sent) {
      // Let the next attempt try again
      await db
        .from("orders")
        .update({ shipped_email_sent_at: null })
        .eq("id", orderId);
      return "failed";
    }
    return "sent";
  } catch (err) {
    console.error("Shipped email failed:", err);
    return "failed";
  }
}
