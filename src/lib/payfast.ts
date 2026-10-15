import { createHash, timingSafeEqual } from "node:crypto";

/**
 * PayFast helpers (server only).
 *
 * .env.local:
 *   PAYFAST_MERCHANT_ID=...
 *   PAYFAST_MERCHANT_KEY=...
 *   PAYFAST_PASSPHRASE=...        (only if you set one in your PayFast account)
 *   PAYFAST_SANDBOX=true          (remove or set false when you go live)
 *   NEXT_PUBLIC_SITE_URL=https://your-public-address
 *
 * PayFast must be able to reach NEXT_PUBLIC_SITE_URL to send payment
 * notifications, so localhost will not work for them. Use a deployed preview
 * or a tunnel such as ngrok while testing.
 */

export type PayfastConfig = {
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  sandbox: boolean;
  siteUrl: string;
};

export function getPayfastConfig(): PayfastConfig | null {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = process.env.PAYFAST_MERCHANT_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!merchantId || !merchantKey || !siteUrl) return null;

  return {
    merchantId,
    merchantKey,
    passphrase: process.env.PAYFAST_PASSPHRASE ?? "",
    sandbox: process.env.PAYFAST_SANDBOX === "true",
    siteUrl,
  };
}

export const payfastHost = (sandbox: boolean) =>
  sandbox ? "https://sandbox.payfast.co.za" : "https://www.payfast.co.za";

// PHP-style urlencode, which is what PayFast signs with: spaces become "+"
// and everything except letters, digits and "-_." is percent-encoded.
function encode(value: string, trim = true) {
  return encodeURIComponent(trim ? value.trim() : value)
    .replace(/%20/g, "+")
    .replace(
      /[!~*'()]/g,
      (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
    );
}

/**
 * key=value pairs joined with &. Order matters.
 *
 * Payments we send leave empty values out. Notifications (ITN) coming back
 * from PayFast are signed over EVERY field in the order received, empty ones
 * included, so they are checked with `raw: true`.
 */
export function paramString(
  entries: [string, string][],
  opts: { raw?: boolean } = {},
) {
  const raw = opts.raw ?? false;
  return entries
    .filter(([, v]) => raw || v !== "")
    .map(([k, v]) => `${k}=${encode(v, !raw)}`)
    .join("&");
}

export function sign(
  entries: [string, string][],
  passphrase: string,
  opts: { raw?: boolean } = {},
) {
  let base = paramString(entries, opts);
  if (passphrase) base += `&passphrase=${encode(passphrase)}`;
  return createHash("md5").update(base).digest("hex");
}

/** Everything the browser needs to send the customer to PayFast. */
export function buildPayment(
  cfg: PayfastConfig,
  order: {
    number: string;
    token: string;
    totalCents: number;
    firstName: string;
    lastName: string;
    email: string;
  },
) {
  // PayFast signs the fields in exactly this order
  const entries: [string, string][] = [
    ["merchant_id", cfg.merchantId],
    ["merchant_key", cfg.merchantKey],
    [
      "return_url",
      `${cfg.siteUrl}/checkout/success?order=${encodeURIComponent(order.number)}&token=${order.token}`,
    ],
    ["cancel_url", `${cfg.siteUrl}/checkout?cancelled=1`],
    ["notify_url", `${cfg.siteUrl}/api/notify`],
    ["name_first", order.firstName],
    ["name_last", order.lastName],
    ["email_address", order.email],
    ["m_payment_id", order.number],
    ["amount", (order.totalCents / 100).toFixed(2)],
    ["item_name", `Offline House order ${order.number}`.slice(0, 100)],
  ];

  const fields: Record<string, string> = {};
  for (const [k, v] of entries) if (v !== "") fields[k] = v;
  fields.signature = sign(entries, cfg.passphrase);

  return { url: `${payfastHost(cfg.sandbox)}/eng/process`, fields };
}

/** Checks a payment notification (ITN) from PayFast. */
export async function verifyNotification(
  rawBody: string,
  cfg: PayfastConfig,
): Promise<
  { ok: true; params: URLSearchParams } | { ok: false; reason: string }
> {
  const params = new URLSearchParams(rawBody);
  const received = params.get("signature") ?? "";
  const entries = [...params.entries()].filter(([k]) => k !== "signature");

  // 1. The signature must match
  const expected = sign(entries, cfg.passphrase, { raw: true });
  const a = Buffer.from(received.toLowerCase());
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad signature" };
  }

  // 2. It must be for our merchant account
  if (params.get("merchant_id") !== cfg.merchantId) {
    return { ok: false, reason: "wrong merchant" };
  }

  // 3. PayFast itself must confirm it sent this
  try {
    const res = await fetch(`${payfastHost(cfg.sandbox)}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: paramString(entries, { raw: true }),
    });
    if ((await res.text()).trim() !== "VALID") {
      return { ok: false, reason: "not confirmed by PayFast" };
    }
  } catch {
    return { ok: false, reason: "could not reach PayFast" };
  }

  return { ok: true, params };
}
