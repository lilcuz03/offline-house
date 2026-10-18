/**
 * Sends email through Resend (server only), using its web API, so no extra
 * package is needed.
 *
 * .env.local and Vercel:
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM="Offline House <orders@yourdomain.co.za>"   (a domain verified in Resend)
 *   EMAIL_REPLY_TO=hello@yourdomain.co.za                  (optional; where customer replies go)
 *   ORDER_NOTIFY_EMAIL=you@example.com                     (optional; gets a "new order" alert)
 *
 * Until your own domain is verified in Resend you can test with
 *   EMAIL_FROM="Offline House <onboarding@resend.dev>"
 * but Resend then only delivers to the email address you signed up with.
 */

export const emailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

type Message = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Sending the same key twice only sends one email. */
  idempotencyKey?: string;
};

/** Returns true when Resend accepted the message. Never throws. */
export async function sendEmail(msg: Message): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.error(
      "Email: RESEND_API_KEY or EMAIL_FROM is missing, so nothing was sent.",
    );
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(msg.idempotencyKey
          ? { "Idempotency-Key": msg.idempotencyKey }
          : {}),
      },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        ...(process.env.EMAIL_REPLY_TO
          ? { reply_to: process.env.EMAIL_REPLY_TO }
          : {}),
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(
        "Email: Resend refused the message:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email: could not reach Resend:", err);
    return false;
  }
}
