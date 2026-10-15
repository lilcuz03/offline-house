import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import OrderConfirmation, { type ConfirmedOrder } from "@/components/OrderConfirmation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

type Props = {
  searchParams: Promise<{ order?: string | string[]; token?: string | string[] }>;
};

type ItemRow = {
  id: string;
  name: string;
  variant: string | null;
  image: string | null;
  unit_price_cents: number;
  quantity: number;
};

type OrderRow = {
  number: string;
  email: string;
  first_name: string;
  last_name: string;
  address1: string;
  address2: string | null;
  suburb: string;
  city: string;
  province: string;
  postal_code: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  shipping_method: string;
  payment_status: string;
  order_items: ItemRow[];
};

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

async function Content({ searchParams }: Props) {
  const sp = await searchParams;
  const number = one(sp.order);
  const token = one(sp.token);
  if (!number || !token) notFound();

  const db = getSupabaseAdmin();
  if (!db) notFound();

  // The number AND the secret token must both match
  const { data } = await db
    .from("orders")
    .select(
      "number, email, first_name, last_name, address1, address2, suburb, city, province, postal_code, subtotal_cents, shipping_cents, total_cents, shipping_method, payment_status, order_items(id, name, variant, image, unit_price_cents, quantity)",
    )
    .eq("number", number)
    .eq("access_token", token)
    .maybeSingle();

  if (!data) notFound();
  const o = data as unknown as OrderRow;

  // PayFast confirms payments in the background, so the customer can arrive
  // a moment before the order is marked paid.
  if (o.payment_status !== "paid") {
    return (
      <section className="mx-auto max-w-xl px-5 py-28 text-center">
        <meta httpEquiv="refresh" content="6" />
        <title>Confirming your payment</title>
        <h1 className="font-serif text-5xl font-light text-ink">
          {o.payment_status === "failed" ? "Payment didn't go through." : "Confirming your payment."}
        </h1>
        <p className="mt-4 text-muted">
          {o.payment_status === "failed"
            ? "Nothing was charged. You can try again from your bag."
            : "This usually takes a few seconds. This page will refresh by itself."}
        </p>
        <Link
          href={o.payment_status === "failed" ? "/checkout" : `/checkout/success?order=${encodeURIComponent(number)}&token=${token}`}
          className="mt-8 inline-flex h-14 items-center rounded-full bg-ink px-9 text-[15px] text-white transition-colors hover:bg-gold hover:text-ink"
        >
          {o.payment_status === "failed" ? "Back to checkout" : "Check again"}
        </Link>
      </section>
    );
  }

  const shipping = SHIPPING_OPTIONS.find((s) => s.id === o.shipping_method);
  const order: ConfirmedOrder = {
    number: o.number,
    email: o.email,
    firstName: o.first_name,
    items: o.order_items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.unit_price_cents / 100,
      image: i.image,
      variant: i.variant,
    })),
    subtotal: o.subtotal_cents / 100,
    shippingCost: o.shipping_cents / 100,
    total: o.total_cents / 100,
    shippingLabel: shipping?.label,
    eta: shipping?.eta,
    address: [
      `${o.first_name} ${o.last_name}`,
      o.address1,
      ...(o.address2 ? [o.address2] : []),
      o.suburb,
      `${o.city}, ${o.province} ${o.postal_code}`,
    ],
  };

  return (
    <>
      <title>Order confirmed</title>
      <OrderConfirmation order={order} />
    </>
  );
}

export default function SuccessPage({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
