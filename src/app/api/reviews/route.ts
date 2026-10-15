import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

// New reviews are saved as "pending". They only appear on the site once you
// approve them (status = approved in Supabase), so spam is never public.
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("bad body");
    body = parsed as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }

  // Hidden field that real people never fill in. Bots do. Pretend it worked.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const productId = str(body.productId);
  const name = str(body.name);
  const title = str(body.title);
  const text = str(body.body);
  const rating = Number(body.rating);

  if (!UUID_RE.test(productId)) return fail("Unknown product.");
  if (!name || name.length > 80) return fail("Please enter your name.");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return fail("Please choose a star rating.");
  }
  if (title.length > 100) return fail("The title is too long.");
  if (text.length < 10 || text.length > 2000) {
    return fail("Please write between 10 and 2000 characters.");
  }

  const db = getSupabaseAdmin();
  if (!db) {
    console.error("Reviews: Supabase environment variables are missing.");
    return fail("Reviews are not available right now.", 500);
  }

  const { data: product } = await db
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) return fail("Unknown product.");

  const { error } = await db.from("product_reviews").insert({
    product_id: productId,
    name,
    rating,
    title: title || null,
    body: text,
    status: "pending",
    verified: false,
  });
  if (error) {
    console.error("Reviews: insert failed:", error.message);
    return fail("Could not save your review.", 500);
  }

  return NextResponse.json({ ok: true });
}
