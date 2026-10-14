import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TOPICS = [
  "An order I've placed",
  "Delivery",
  "Returns and refunds",
  "A product question",
  "Something else",
];

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("bad body");
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = str(body.name);
  const email = str(body.email).toLowerCase();
  const topic = str(body.topic);
  const orderNumber = str(body.orderNumber);
  const message = str(body.message);

  const valid =
    name.length > 0 &&
    name.length <= 100 &&
    email.length <= 254 &&
    EMAIL_RE.test(email) &&
    TOPICS.includes(topic) &&
    orderNumber.length <= 50 &&
    message.length >= 10 &&
    message.length <= 1000;

  if (!valid) {
    return NextResponse.json({ error: "Please check your details." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Contact: Supabase environment variables are missing.");
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    topic,
    order_number: orderNumber || null,
    message,
  });

  if (error) {
    console.error("Contact insert failed:", error.message);
    return NextResponse.json({ error: "Could not send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
