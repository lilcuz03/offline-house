"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Owner-only order list. Checks you are an admin, but the real protection is
 * the database: only an admin can read other people's orders or change them.
 */

type Status = "pending" | "paid" | "packed" | "shipped" | "delivered";

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
  status: Status;
  payment_status: string;
  email: string;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  address1: string | null;
  address2: string | null;
  suburb: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  notes: string | null;
  shipping_method: string | null;
  shipping_cents: number;
  subtotal_cents: number;
  total_cents: number;
  order_items: Item[];
};

type Access = "unconfigured" | "loading" | "signedout" | "forbidden" | "ready";

const TABS: { id: Status; label: string }[] = [
  { id: "paid", label: "To pack" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "pending", label: "Unpaid" },
];

// What the single button on each order does
const NEXT: Partial<Record<Status, { to: Status; label: string }>> = {
  paid: { to: "packed", label: "Mark packed" },
  packed: { to: "shipped", label: "Mark shipped" },
  shipped: { to: "delivered", label: "Mark delivered" },
};

const rands = (cents: number) => `R${(cents / 100).toFixed(2)}`;

const addressLines = (o: Order) =>
  [
    `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim(),
    o.address1,
    o.address2,
    o.suburb,
    [o.city, o.province, o.postal_code].filter(Boolean).join(", "),
    o.phone,
  ].filter((l): l is string => !!l);

export default function AdminOrders() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [access, setAccess] = useState<Access>(
    supabaseConfigured ? "loading" : "unconfigured",
  );
  const [tab, setTab] = useState<Status>("paid");
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  // A result from the last action. Unlike `message`, reloading the list does not clear it.
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (cancelled) return;
      if (!data.user) return setAccess("signedout");
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      setAccess(profile?.is_admin ? "ready" : "forbidden");
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  useEffect(() => {
    if (!sb || access !== "ready") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await sb
        .from("orders")
        .select(
          "id, number, created_at, status, payment_status, email, phone, first_name, last_name, address1, address2, suburb, city, province, postal_code, notes, shipping_method, shipping_cents, subtotal_cents, total_cents, order_items(id, name, variant, quantity, unit_price_cents)",
        )
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) return setMessage(error.message);
      setMessage("");
      setOrders(data as unknown as Order[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, access, tab, tick]);

  // The change goes through the server, which also emails the customer when
  // an order is marked shipped.
  async function advance(o: Order, to: Status) {
    if (!sb) return;
    setNotice("");
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return setMessage("Sign in again.");
    const res = await fetch("/api/admin/orders/status", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId: o.id, status: to }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage(json.error ?? "Could not update the order.");

    if (to === "shipped") {
      setNotice(
        json.email === "sent"
          ? `${o.number} marked shipped. We emailed ${o.email}.`
          : json.email === "skipped"
            ? `${o.number} marked shipped. The customer was already emailed.`
            : `${o.number} marked shipped, but the shipping email could not be sent. Check the Vercel logs for "Shipped email".`,
      );
    } else {
      setNotice(`${o.number} updated.`);
    }
    reload();
  }

  async function copyAddress(o: Order) {
    try {
      await navigator.clipboard.writeText(addressLines(o).join("\n"));
      setMessage(`Address for ${o.number} copied.`);
    } catch {
      setMessage("Could not copy. Select the address and copy it by hand.");
    }
  }

  if (access !== "ready") {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-light text-ink">Orders</h1>
        <p className="mt-4 text-muted">
          {access === "unconfigured" &&
            "Supabase is not configured. Set the project URL and anon key to manage orders."}
          {access === "loading" && "Checking access..."}
          {access === "signedout" &&
            "Sign in with the owner account to see orders."}
          {access === "forbidden" && "This account does not have admin access."}
        </p>
        {(access === "signedout" || access === "forbidden") && (
          <Link
            href="/account"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            Go to sign in
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
          Orders
        </h1>
        <Link
          href="/admin"
          className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Back to products
        </Link>
      </div>

      <div
        role="tablist"
        className="mt-8 flex flex-wrap gap-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setNotice("");
            }}
            className={`h-10 rounded-full px-5 text-sm transition-colors duration-300 ${
              tab === t.id
                ? "bg-ink text-white"
                : "border border-line text-ink hover:border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {notice && (
        <p
          role="status"
          className="mt-4 text-sm text-ink"
        >
          {notice}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="mt-4 text-sm text-muted"
        >
          {message}
        </p>
      )}

      <ul className="mt-6 grid gap-4">
        {orders.length === 0 && (
          <li className="rounded-3xl border border-line bg-white/50 p-6 text-muted">
            No orders here.
          </li>
        )}
        {orders.map((o) => {
          const next = NEXT[o.status];
          return (
            <li
              key={o.id}
              className="rounded-3xl border border-line bg-white/50 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-lg text-ink">{o.number}</p>
                <p className="text-sm text-muted">
                  {new Date(o.created_at).toLocaleString("en-ZA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Africa/Johannesburg",
                  })}
                </p>
              </div>

              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted">Deliver to</p>
                  <address className="mt-1 not-italic leading-relaxed text-ink">
                    {addressLines(o).map((l, i) => (
                      <span
                        key={i}
                        className="block"
                      >
                        {l}
                      </span>
                    ))}
                    <span className="block text-muted">{o.email}</span>
                  </address>
                  {o.notes && (
                    <p className="mt-2 text-sm text-muted">Note: {o.notes}</p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted">Items</p>
                  <ul className="mt-1 space-y-1 text-ink">
                    {o.order_items.map((i) => (
                      <li key={i.id}>
                        {i.quantity} × {i.name}
                        {i.variant ? ` (${i.variant})` : ""}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-muted">
                    Items {rands(o.subtotal_cents)} · Delivery{" "}
                    {rands(o.shipping_cents)}
                    {o.shipping_method ? ` (${o.shipping_method})` : ""}
                  </p>
                  <p className="text-ink">
                    Total {rands(o.total_cents)}{" "}
                    <span className="text-sm text-muted">
                      · payment {o.payment_status}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {next && (
                  <button
                    onClick={() => advance(o, next.to)}
                    className="h-10 rounded-full bg-ink px-5 text-sm text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
                  >
                    {next.label}
                  </button>
                )}
                <button
                  onClick={() => copyAddress(o)}
                  className="h-10 rounded-full border border-line px-5 text-sm text-ink transition-colors duration-300 hover:border-ink"
                >
                  Copy address
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
