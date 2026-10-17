import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SHIPPING_OPTIONS, shippingPriceFor } from "@/lib/shipping";
import { buildPayment, getPayfastConfig } from "@/lib/payfast";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROVINCES = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "Northern Cape", "North West", "Western Cape",
];

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const fail = (error: string, status = 400) =>
  NextResponse.json({ error }, { status });

type Line = { productId: string; quantity: number; variant: string | null };

type ProductRow = {
  id: string;
  name: string;
  price_cents: number;
  stock: number;
  images: string[] | null;
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") throw new Error("bad body");
    body = parsed as Record<string, unknown>;
  } catch {
    return fail("Invalid request.");
  }

  /* ---- 1. Validate what the customer typed ---- */
  const email = str(body.email).toLowerCase();
  const phone = str(body.phone).replace(/[\s()-]/g, "");
  const firstName = str(body.firstName);
  const lastName = str(body.lastName);
  const address1 = str(body.address1);
  const address2 = str(body.address2);
  const suburb = str(body.suburb);
  const city = str(body.city);
  const province = str(body.province);
  const postalCode = str(body.postalCode);
  const notes = str(body.notes);
  const shippingId = str(body.shippingId);

  const detailsOk =
    EMAIL_RE.test(email) && email.length <= 254 &&
    /^\+?\d{9,15}$/.test(phone) &&
    firstName && firstName.length <= 80 &&
    lastName && lastName.length <= 80 &&
    address1 && address1.length <= 200 && address2.length <= 200 &&
    suburb && suburb.length <= 100 &&
    city && city.length <= 100 &&
    PROVINCES.includes(province) &&
    /^\d{4}$/.test(postalCode) &&
    notes.length <= 500;
  if (!detailsOk) return fail("Please check your delivery details.");

  const shipping = SHIPPING_OPTIONS.find((s) => s.id === shippingId);
  if (!shipping) return fail("Choose a delivery method.");

  /* ---- 2. Validate the bag ---- */
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 50) {
    return fail("Your bag is empty.");
  }
  const lines: Line[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") return fail("Invalid bag.");
    const it = raw as Record<string, unknown>;
    // Cart ids look like "<product uuid>" or "<product uuid>:<variant slug>"
    const productId = str(it.id).split(":")[0];
    const quantity = Number(it.quantity);
    if (!UUID_RE.test(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return fail("Invalid bag.");
    }
    const variant = str(it.variant).slice(0, 100) || null;
    lines.push({ productId, quantity, variant });
  }

  /* ---- 3. Servers, keys and money ---- */
  const db = getSupabaseAdmin();
  const pay = getPayfastConfig();
  if (!db || !pay) {
    console.error("Checkout: Supabase or PayFast environment variables are missing.");
    return fail("Checkout is not available right now.", 500);
  }

  // Prices and stock come from the database, never from the browser
  const ids = [...new Set(lines.map((l) => l.productId))];
  const { data, error: productsError } = await db
    .from("products")
    .select("id, name, price_cents, stock, images")
    .in("id", ids)
    .eq("is_active", true);

  if (productsError) {
    console.error("Checkout: product lookup failed:", productsError.message);
    return fail("Could not place your order.", 500);
  }
  const products = new Map((data as ProductRow[]).map((p) => [p.id, p]));
  if (products.size !== ids.length) {
    return fail("An item in your bag is no longer available.", 409);
  }

  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.productId, (wanted.get(l.productId) ?? 0) + l.quantity);
  for (const [id, qty] of wanted) {
    const p = products.get(id)!;
    if (qty > p.stock) {
      return fail(
        p.stock === 0
          ? `${p.name} is out of stock.`
          : `Only ${p.stock} of ${p.name} left in stock.`,
        409,
      );
    }
  }

  const subtotalCents = lines.reduce(
    (sum, l) => sum + products.get(l.productId)!.price_cents * l.quantity,
    0,
  );
  const shippingCents = Math.round(
    shippingPriceFor(shipping, subtotalCents / 100) * 100,
  );
  const totalCents = subtotalCents + shippingCents;

  /* ---- 4. Save the order (unpaid) ---- */
  const { data: order, error: orderError } = await db
    .from("orders")
    .insert({
      email,
      phone,
      first_name: firstName,
      last_name: lastName,
      address1,
      address2: address2 || null,
      suburb,
      city,
      province,
      postal_code: postalCode,
      notes: notes || null,
      shipping_method: shipping.id,
      shipping_cents: shippingCents,
      subtotal_cents: subtotalCents,
      total_cents: totalCents,
      payment_provider: "payfast",
    })
    .select("id, number, access_token")
    .single();

  if (orderError || !order) {
    console.error("Checkout: order insert failed:", orderError?.message);
    return fail("Could not place your order.", 500);
  }
  const saved = order as { id: string; number: string; access_token: string };

  const { error: itemsError } = await db.from("order_items").insert(
    lines.map((l) => {
      const p = products.get(l.productId)!;
      return {
        order_id: saved.id,
        product_id: l.productId,
        name: p.name,
        variant: l.variant,
        image: p.images?.[0] ?? null,
        unit_price_cents: p.price_cents,
        quantity: l.quantity,
      };
    }),
  );
  if (itemsError) {
    console.error("Checkout: order items insert failed:", itemsError.message);
    await db.from("orders").delete().eq("id", saved.id); // leave nothing half-made
    return fail("Could not place your order.", 500);
  }

  /* ---- 5. Hand over to PayFast ---- */
  const payment = buildPayment(pay, {
    number: saved.number,
    token: saved.access_token,
    totalCents,
    firstName,
    lastName,
    email,
  });

  return NextResponse.json({ orderNumber: saved.number, payment });
}
