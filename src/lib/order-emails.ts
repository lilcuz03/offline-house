import type { SupabaseClient } from "@supabase/supabase-js";
import { emailConfigured, sendEmail } from "@/lib/email";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

/*
 * Emails sent when an order is paid: a confirmation to the customer and an
 * alert to you. Safe to call more than once for the same order: the first call
 * claims the order (confirmation_sent_at), so PayFast or Stitch repeating a
 * notification never sends a second email.
 */

type Item = {
  name: string;
  variant: string | null;
  quantity: number;
  unit_price_cents: number;
};

export type EmailOrder = {
  number: string;
  access_token: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address1: string | null;
  address2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  notes: string | null;
  shipping_method: string | null;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  order_items: Item[];
};

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (cents: number) =>
  `R${(cents / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

const addressLines = (o: EmailOrder) =>
  [
    `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim(),
    o.address1,
    o.address2,
    o.suburb,
    [o.city, o.province, o.postal_code].filter(Boolean).join(", "),
  ].filter((l): l is string => !!l);

/* ---------- shared pieces ---------- */

const INK = "#0a0a0a";
const GOLD = "#b8935a";
const LINE = "#e8e2d6";
const MUTED = "#6b665c";

function shell(preheader: string, inner: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f7f4ee;">
<span style="display:none;opacity:0;height:0;overflow:hidden;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f4ee;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;border:1px solid ${LINE};font-family:Helvetica,Arial,sans-serif;color:${INK};">
<tr><td style="padding:28px 28px 0 28px;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:${GOLD};">Offline House</td></tr>
${inner}
<tr><td style="padding:0 28px 28px 28px;font-size:12px;color:${MUTED};line-height:1.6;border-top:1px solid ${LINE};padding-top:18px;">Offline House. Disconnect to reconnect.</td></tr>
</table></td></tr></table></body></html>`;
}

function itemsTable(o: EmailOrder) {
  const rows = o.order_items
    .map(
      (i) => `<tr>
<td style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;">${esc(i.name)}${
        i.variant
          ? `<br><span style="color:${MUTED};font-size:12px;">${esc(i.variant)}</span>`
          : ""
      }<br><span style="color:${MUTED};font-size:12px;">Qty ${i.quantity}</span></td>
<td align="right" style="padding:10px 0;border-bottom:1px solid ${LINE};font-size:14px;white-space:nowrap;vertical-align:top;">${money(i.unit_price_cents * i.quantity)}</td>
</tr>`,
    )
    .join("");
  const line = (label: string, value: string, bold = false) =>
    `<tr><td style="padding:6px 0;font-size:14px;${bold ? "font-weight:bold;" : `color:${MUTED};`}">${label}</td><td align="right" style="padding:6px 0;font-size:14px;${bold ? "font-weight:bold;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
${line("Subtotal", money(o.subtotal_cents))}
${line("Delivery", o.shipping_cents === 0 ? "Free" : money(o.shipping_cents))}
${line("Total", money(o.total_cents), true)}
</table>`;
}

const itemsText = (o: EmailOrder) =>
  o.order_items
    .map(
      (i) =>
        `- ${i.name}${i.variant ? ` (${i.variant})` : ""} x ${i.quantity}: ${money(i.unit_price_cents * i.quantity)}`,
    )
    .join("\n");

/* ---------- customer confirmation ---------- */

export function buildCustomerEmail(o: EmailOrder) {
  const ship = SHIPPING_OPTIONS.find((s) => s.id === o.shipping_method);
  const link = `${siteUrl()}/checkout/success?order=${encodeURIComponent(o.number)}&token=${o.access_token}`;
  const first = o.first_name?.trim() || "there";
  const address = addressLines(o);

  const html = shell(
    `Thank you for your order ${o.number}.`,
    `<tr><td style="padding:12px 28px 0 28px;">
<h1 style="margin:8px 0 6px 0;font-family:Georgia,serif;font-weight:normal;font-size:30px;">Thank you, ${esc(first)}.</h1>
<p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:${MUTED};">We've received your payment for order <strong style="color:${INK};">${esc(o.number)}</strong> and we're getting it ready.${
      ship ? ` Delivery: ${esc(ship.label)}, ${esc(ship.eta)}.` : ""
    }</p>
${itemsTable(o)}
</td></tr>
<tr><td style="padding:22px 28px 0 28px;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">Delivering to</p>
<p style="margin:0;font-size:14px;line-height:1.6;">${address.map(esc).join("<br>")}</p>
</td></tr>
<tr><td style="padding:24px 28px 28px 28px;">
<a href="${link}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:14px;padding:14px 26px;border-radius:999px;">View your order</a>
<p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:${MUTED};">Questions? Just reply to this email and quote ${esc(o.number)}.</p>
</td></tr>`,
  );

  const text = `Thank you, ${first}.

We've received your payment for order ${o.number} and we're getting it ready.${ship ? `\nDelivery: ${ship.label}, ${ship.eta}.` : ""}

${itemsText(o)}

Subtotal: ${money(o.subtotal_cents)}
Delivery: ${o.shipping_cents === 0 ? "Free" : money(o.shipping_cents)}
Total: ${money(o.total_cents)}

Delivering to:
${address.join("\n")}

View your order: ${link}

Questions? Just reply to this email and quote ${o.number}.

Offline House. Disconnect to reconnect.`;

  return { subject: `Your Offline House order ${o.number}`, html, text };
}

/* ---------- alert to you ---------- */

export function buildOwnerEmail(o: EmailOrder) {
  const admin = `${siteUrl()}/admin/orders`;
  const address = addressLines(o);
  const html = shell(
    `New order ${o.number}, ${money(o.total_cents)}`,
    `<tr><td style="padding:12px 28px 0 28px;">
<h1 style="margin:8px 0 6px 0;font-family:Georgia,serif;font-weight:normal;font-size:28px;">New order ${esc(o.number)}</h1>
<p style="margin:0 0 20px 0;font-size:15px;color:${MUTED};">${money(o.total_cents)} paid by ${esc(o.email)}${o.phone ? `, ${esc(o.phone)}` : ""}.</p>
${itemsTable(o)}
</td></tr>
<tr><td style="padding:22px 28px 0 28px;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${MUTED};">Deliver to</p>
<p style="margin:0;font-size:14px;line-height:1.6;">${address.map(esc).join("<br>")}</p>
${o.notes ? `<p style="margin:14px 0 0 0;font-size:14px;line-height:1.6;"><strong>Note:</strong> ${esc(o.notes)}</p>` : ""}
</td></tr>
<tr><td style="padding:24px 28px 28px 28px;">
<a href="${admin}" style="display:inline-block;background:${INK};color:#ffffff;text-decoration:none;font-size:14px;padding:14px 26px;border-radius:999px;">Open orders</a>
</td></tr>`,
  );
  const text = `New order ${o.number}: ${money(o.total_cents)} paid by ${o.email}${o.phone ? `, ${o.phone}` : ""}.

${itemsText(o)}

Deliver to:
${address.join("\n")}${o.notes ? `\n\nNote: ${o.notes}` : ""}

Open orders: ${admin}`;
  return {
    subject: `New order ${o.number} (${money(o.total_cents)})`,
    html,
    text,
  };
}

/* ---------- send both, once ---------- */

/** Never throws: a failed email must not undo a successful payment. */
export async function sendOrderEmails(
  db: SupabaseClient,
  orderId: string,
): Promise<void> {
  try {
    if (!emailConfigured()) return;

    // Claim the order. Only the first caller gets a row back.
    const { data: claimed } = await db
      .from("orders")
      .update({ confirmation_sent_at: new Date().toISOString() })
      .eq("id", orderId)
      .eq("payment_status", "paid")
      .is("confirmation_sent_at", null)
      .select("id")
      .maybeSingle();
    if (!claimed) return;

    const { data } = await db
      .from("orders")
      .select(
        "number, access_token, email, first_name, last_name, phone, address1, address2, suburb, city, province, postal_code, notes, shipping_method, subtotal_cents, shipping_cents, total_cents, order_items(name, variant, quantity, unit_price_cents)",
      )
      .eq("id", orderId)
      .maybeSingle();
    if (!data) return;
    const order = data as unknown as EmailOrder;

    const customer = buildCustomerEmail(order);
    const sent = await sendEmail({
      to: order.email,
      ...customer,
      idempotencyKey: `order-confirmation-${orderId}`,
    });
    if (!sent) {
      // Let the next notification try again
      await db
        .from("orders")
        .update({ confirmation_sent_at: null })
        .eq("id", orderId);
      return;
    }

    const owner = process.env.ORDER_NOTIFY_EMAIL;
    if (owner) {
      await sendEmail({
        to: owner,
        ...buildOwnerEmail(order),
        idempotencyKey: `order-alert-${orderId}`,
      });
    }
  } catch (err) {
    console.error("Order emails failed:", err);
  }
}
