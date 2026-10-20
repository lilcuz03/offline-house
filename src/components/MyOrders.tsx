"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

type Item = {
  id: string;
  name: string;
  variant: string | null;
  quantity: number;
  unit_price_cents: number;
};

type Order = {
  id: string;
  number: string;
  created_at: string;
  status: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  order_items: Item[];
};

const rands = (cents: number) => `R${(cents / 100).toFixed(2)}`;

const LABEL: Record<string, string> = {
  paid: "Confirmed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function MyOrders({ name }: { name: string }) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      try {
        const res = await fetch("/api/my-orders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(json.error ?? "Could not load orders.");
        setOrders(json.orders as Order[]);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load orders.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function signOut() {
    setSigningOut(true);
    await getSupabase().auth.signOut();
    router.push("/account");
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[12px] uppercase tracking-[0.2em] text-muted">
            Your account
          </p>
          <h1 className="mt-2 font-serif text-4xl font-light text-ink sm:text-5xl">
            {name ? `Hi, ${name}` : "My orders"}
          </h1>
        </div>
        <button
          type="button"
          onClick={signOut}
          disabled={signingOut}
          className="h-11 rounded-full border border-line px-6 text-[14px] text-ink transition-colors hover:border-ink disabled:opacity-50"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>

      <h2 className="mt-12 font-serif text-2xl font-light text-ink">
        My orders
      </h2>

      {error && (
        <p className="mt-6 rounded-2xl border border-sale/40 p-4 text-sm text-sale">
          {error}
        </p>
      )}

      {!error && orders === null && (
        <p className="mt-6 text-muted">Loading your orders…</p>
      )}

      {orders && orders.length === 0 && (
        <div className="mt-6 rounded-3xl border border-line bg-white/60 p-8 text-center">
          <p className="text-muted">You haven&apos;t placed an order yet.</p>
          <Link
            href="/shop"
            className="mt-5 inline-flex h-12 items-center rounded-full bg-ink px-8 text-[14px] text-white transition-colors hover:bg-gold hover:text-ink"
          >
            Start shopping
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {orders?.map((o) => (
          <li
            key={o.id}
            className="rounded-3xl border border-line bg-white/60 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ink">{o.number}</p>
                <p className="text-[13px] text-muted">
                  {new Date(o.created_at).toLocaleDateString("en-ZA", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span className="rounded-full bg-ink px-3 py-1 text-[12px] text-white">
                {LABEL[o.status] ?? o.status}
              </span>
            </div>

            <ul className="mt-4 divide-y divide-line text-[14px]">
              {o.order_items.map((i) => (
                <li
                  key={i.id}
                  className="flex justify-between gap-4 py-2"
                >
                  <span className="min-w-0 text-ink">
                    {i.quantity} × {i.name}
                    {i.variant ? (
                      <span className="text-muted"> ({i.variant})</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-muted">
                    {rands(i.unit_price_cents * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[14px]">
              <span className="text-muted">
                Delivery {rands(o.shipping_cents)}
              </span>
              <span className="font-medium text-ink">
                Total {rands(o.total_cents)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-[14px]">
              <Link
                href="/track-order"
                className="text-ink underline underline-offset-4"
              >
                Track this order
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
