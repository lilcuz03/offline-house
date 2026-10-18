import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOrderEmails } from "@/lib/order-emails";

/**
 * Stitch helpers (server only). Stitch lets customers pay by bank (EFT),
 * Capitec Pay or card on a Stitch-hosted page.
 *
 * .env.local and Vercel:
 *   STITCH_CLIENT_ID=...
 *   STITCH_CLIENT_SECRET=...
 *   STITCH_WEBHOOK_SECRET=whsec_...        (given when the webhook is created)
 *   STITCH_BENEFICIARY_NAME=Offline House   (where the money is paid to)
 *   STITCH_BENEFICIARY_BANK=capitec         (a Stitch bank id, for example absa, fnb, capitec)
 *   STITCH_BENEFICIARY_ACCOUNT=...
 *   STITCH_MERCHANT_ID=...                  (optional; use INSTEAD of the three beneficiary lines)
 *   STITCH_CAPITEC_PAY=true                 (only once Stitch has switched it on for you)
 *   STITCH_CARD=true                        (only once Stitch has switched it on for you)
 *   STITCH_TEST=true                        (while using test keys; remove when you go live)
 *   NEXT_PUBLIC_SITE_URL=https://your-public-address
 *
 * The redirect address of your site must be added to your Stitch client by
 * the Stitch team (test clients already allow localhost).
 */

export type StitchConfig = {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  beneficiary: { name: string; bank: string; accountNumber: string } | null;
  merchantId: string | null;
  capitecPay: boolean;
  card: boolean;
  /** True while you are using Stitch test keys, so orders stay out of sales reports. */
  test: boolean;
  siteUrl: string;
};

const API = "https://api.stitch.money/v2";
const TOKEN_URL = "https://secure.stitch.money/connect/token";

/** Whether the checkout should offer Stitch at all. */
export const stitchEnabled = () =>
  Boolean(process.env.STITCH_CLIENT_ID && process.env.STITCH_CLIENT_SECRET);

export function getStitchConfig(): StitchConfig | null {
  const clientId = process.env.STITCH_CLIENT_ID;
  const clientSecret = process.env.STITCH_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (!clientId || !clientSecret || !siteUrl) return null;

  const merchantId = process.env.STITCH_MERCHANT_ID || null;
  const name = process.env.STITCH_BENEFICIARY_NAME;
  const bank = process.env.STITCH_BENEFICIARY_BANK;
  const accountNumber = process.env.STITCH_BENEFICIARY_ACCOUNT;
  // Either a merchant id, or the full bank details, is needed to take EFT payments
  if (!merchantId && !(name && bank && accountNumber)) return null;

  return {
    clientId,
    clientSecret,
    webhookSecret: process.env.STITCH_WEBHOOK_SECRET ?? "",
    beneficiary: merchantId
      ? null
      : { name: name!, bank: bank!, accountNumber: accountNumber! },
    merchantId,
    capitecPay: process.env.STITCH_CAPITEC_PAY === "true",
    card: process.env.STITCH_CARD === "true",
    test: process.env.STITCH_TEST === "true",
    siteUrl,
  };
}

/* ---------- access token (cached, they last about an hour) ---------- */

let cached: { token: string; expires: number } | null = null;

async function getToken(cfg: StitchConfig): Promise<string> {
  if (cached && cached.expires > Date.now() + 60_000) return cached.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      audience: TOKEN_URL,
      scope: "client_paymentrequest",
    }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as {
    access_token?: string;
    expires_in?: number;
  } | null;
  if (!res.ok || !json?.access_token) {
    throw new Error(`Stitch token request failed (${res.status})`);
  }
  cached = {
    token: json.access_token,
    expires: Date.now() + (json.expires_in ?? 3600) * 1000,
  };
  return cached.token;
}

/* ---------- payment requests ---------- */

export type StitchPaymentInput = {
  orderNumber: string;
  totalCents: number;
  orderToken: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/** Creates a payment request and returns where to send the customer. */
export async function createStitchPayment(
  cfg: StitchConfig,
  input: StitchPaymentInput,
): Promise<{ id: string; url: string }> {
  const token = await getToken(cfg);
  const returnTo = `${cfg.siteUrl}/checkout/success?order=${encodeURIComponent(
    input.orderNumber,
  )}&token=${input.orderToken}`;

  const body = {
    amount: {
      currency: "ZAR",
      quantity: Number((input.totalCents / 100).toFixed(2)),
    },
    externalReference: input.orderNumber,
    expireAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    ...(cfg.merchantId ? { merchantId: cfg.merchantId } : {}),
    payer: {
      identifier: input.email,
      email: input.email,
      fullName: `${input.firstName} ${input.lastName}`.trim(),
      mobileNumber: input.phone,
    },
    metadata: { orderNumber: input.orderNumber },
    paymentMethods: {
      eft: {
        enabled: true,
        payerReference: input.orderNumber.slice(0, 12),
        beneficiaryReference: input.orderNumber.slice(0, 20),
        ...(cfg.beneficiary ? { beneficiary: cfg.beneficiary } : {}),
        ...(cfg.capitecPay ? { capitecPay: { enabled: true } } : {}),
      },
      card: { enabled: cfg.card },
    },
  };

  const res = await fetch(`${API}/payment-requests`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as {
    id?: string;
    interaction?: { url?: string };
    message?: string;
  } | null;
  if (!res.ok || !json?.id || !json.interaction?.url) {
    console.error(
      "Stitch: could not create payment request:",
      res.status,
      JSON.stringify(json),
    );
    throw new Error(`Stitch payment request failed (${res.status})`);
  }

  const url = new URL(json.interaction.url);
  url.searchParams.set("redirect_uri", returnTo);
  url.searchParams.set("failure_redirect_uri", `${cfg.siteUrl}/checkout`);
  return { id: json.id, url: url.toString() };
}

export type StitchStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "expired"
  | "unknown";

/** Asks Stitch directly what happened. This, not the browser, is the truth. */
export async function getStitchPayment(
  cfg: StitchConfig,
  id: string,
): Promise<{ status: StitchStatus; cents: number | null }> {
  const token = await getToken(cfg);
  const res = await fetch(`${API}/payment-requests/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as {
    status?: string;
    amount?: { quantity?: number };
  } | null;
  if (!res.ok || !json) throw new Error(`Stitch lookup failed (${res.status})`);

  const s = json.status;
  const status: StitchStatus =
    s === "pending" || s === "completed" || s === "cancelled" || s === "expired"
      ? s
      : "unknown";
  const q = json.amount?.quantity;
  return { status, cents: typeof q === "number" ? Math.round(q * 100) : null };
}

type OrderForConfirm = {
  id: string;
  total_cents: number;
  payment_status: string;
  payment_reference: string | null;
};

/**
 * Checks an order with Stitch and updates it: paid, failed, or still waiting.
 * Safe to call as often as you like; paying twice is impossible because
 * fulfil_order ignores an order that is already paid.
 */
export async function confirmStitchOrder(
  db: SupabaseClient,
  cfg: StitchConfig,
  order: OrderForConfirm,
): Promise<"paid" | "failed" | "pending"> {
  if (order.payment_status === "paid") return "paid";
  if (!order.payment_reference) return "pending";

  const { status, cents } = await getStitchPayment(
    cfg,
    order.payment_reference,
  );

  if (status === "completed") {
    // The amount paid must match what we asked for
    if (cents !== order.total_cents) {
      console.error(
        "Stitch: amount mismatch for",
        order.id,
        cents,
        order.total_cents,
      );
      return "pending";
    }
    const { error } = await db.rpc("fulfil_order", {
      p_order_id: order.id,
      p_reference: order.payment_reference,
    });
    if (error) throw new Error(`fulfil_order failed: ${error.message}`);
    await sendOrderEmails(db, order.id);
    return "paid";
  }

  if (status === "cancelled" || status === "expired") {
    await db
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
      .neq("payment_status", "paid");
    return "failed";
  }
  return "pending";
}

/* ---------- webhook signature (Stitch signs with Svix) ---------- */

/**
 * Checks that a webhook really came from Stitch. The signature is
 * HMAC-SHA256 over "id.timestamp.body", using the secret that follows "whsec_".
 */
export function verifyStitchWebhook(
  rawBody: string,
  headers: Headers,
  secret: string,
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!id || !timestamp || !signatures || !secret) return false;

  // Reject old or far-future messages, so a captured one can't be replayed later
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 5 * 60) return false;

  const key = Buffer.from(
    secret.startsWith("whsec_") ? secret.slice(6) : secret,
    "base64",
  );
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest();

  // The header can hold several signatures, such as "v1,abc v1,def"
  return signatures.split(" ").some((part) => {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) return false;
    const given = Buffer.from(sig, "base64");
    return given.length === expected.length && timingSafeEqual(given, expected);
  });
}
