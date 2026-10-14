import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw =
    body && typeof body === "object" && "email" in body
      ? (body as { email: unknown }).email
      : null;
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("Newsletter: Supabase environment variables are missing.");
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const { error } = await supabase
    .from("subscribers")
    .upsert(
      { email, source: "website" },
      { onConflict: "email", ignoreDuplicates: true },
    );

  if (error) {
    console.error("Newsletter insert failed:", error.message);
    return NextResponse.json({ error: "Could not subscribe." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
