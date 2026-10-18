"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Sales and profit overview. Shown inside AdminShell, which already checked
 * the visitor is an admin; Row Level Security is the real protection (only an
 * admin can read orders and cost prices).
 *
 * Counts paid orders only, and leaves out sandbox/test orders (is_test).
 * Profit is product profit: selling price minus the cost price saved at the
 * moment of sale. It does not include delivery costs or PayFast fees.
 */

type CostEmbed =
  | { unit_cost_cents: number }
  | { unit_cost_cents: number }[]
  | null;

type Item = {
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price_cents: number;
  order_item_costs: CostEmbed;
};

type Order = {
  id: string;
  created_at: string;
  total_cents: number;
  order_items: Item[];
};

type RangeId = "7" | "30" | "90" | "all";

const RANGES: { id: RangeId; label: string }[] = [
  { id: "7", label: "7 days" },
  { id: "30", label: "30 days" },
  { id: "90", label: "90 days" },
  { id: "all", label: "All time" },
];

const LOW_STOCK = 5;

const money = (cents: number) => {
  const r = cents / 100;
  return `R${r.toLocaleString("en-ZA", {
    minimumFractionDigits: Math.abs(r) < 1000 ? 2 : 0,
    maximumFractionDigits: Math.abs(r) < 1000 ? 2 : 0,
  })}`;
};

// Local calendar day key, "2026-10-18"
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monthKey = (d: Date) => dayKey(d).slice(0, 7);

type Bucket = {
  key: string;
  label: string;
  revenue: number;
  profit: number;
  orders: number;
};

export default function AdminDashboard() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [range, setRange] = useState<RangeId>("30");
  const [metric, setMetric] = useState<"revenue" | "profit">("revenue");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toPack, setToPack] = useState<number | null>(null);
  const [lowStock, setLowStock] = useState<number | null>(null);
  const [outStock, setOutStock] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  function pickRange(r: RangeId) {
    setRange(r);
    setLoading(true);
  }

  // Orders for the chosen range
  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      let q = sb
        .from("orders")
        .select(
          "id, created_at, total_cents, order_items(product_id, name, quantity, unit_price_cents, order_item_costs(unit_cost_cents))",
        )
        .eq("payment_status", "paid")
        .eq("is_test", false)
        .order("created_at", { ascending: true });
      if (range !== "all") {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - (parseInt(range, 10) - 1));
        q = q.gte("created_at", start.toISOString());
      }
      const { data, error: err } = await q;
      if (cancelled) return;
      if (err) {
        setError(
          err.message.includes("is_test")
            ? "The orders table is missing the is_test column. Run the dashboard SQL script first."
            : err.message,
        );
        setOrders([]);
      } else {
        setError("");
        setOrders(data as unknown as Order[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, range]);

  // "Needs attention" numbers, loaded once
  useEffect(() => {
    if (!sb) return;
    (async () => {
      const [pack, prods] = await Promise.all([
        sb
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "paid")
          .eq("is_test", false),
        sb.from("products").select("stock").eq("is_active", true),
      ]);
      if (!pack.error) setToPack(pack.count ?? 0);
      if (!prods.error) {
        const stocks = (prods.data as { stock: number }[]).map((p) => p.stock);
        setOutStock(stocks.filter((s) => s <= 0).length);
        setLowStock(stocks.filter((s) => s > 0 && s <= LOW_STOCK).length);
      }
    })();
  }, [sb]);

  const stats = useMemo(() => {
    let revenue = 0;
    let profit = 0;
    let itemsSold = 0;
    let itemsWithCost = 0;
    const perBucket = new Map<string, Bucket>();
    const products = new Map<
      string,
      {
        name: string;
        units: number;
        revenue: number;
        profit: number;
        costedUnits: number;
      }
    >();

    const first = orders.length ? new Date(orders[0].created_at) : new Date();
    const today = new Date();
    const spanDays =
      Math.round((today.getTime() - first.getTime()) / 86_400_000) + 1;
    const days = range === "all" ? spanDays : parseInt(range, 10);
    const byMonth = days > 100;

    // Empty buckets first, so quiet days still show as gaps in the chart
    const startDate = new Date(today);
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - (days - 1));
    if (byMonth) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      while (d <= today) {
        const key = monthKey(d);
        perBucket.set(key, {
          key,
          label: d.toLocaleDateString("en-ZA", {
            month: "short",
            year: "numeric",
          }),
          revenue: 0,
          profit: 0,
          orders: 0,
        });
        d.setMonth(d.getMonth() + 1);
      }
    } else {
      const d = new Date(startDate);
      while (d <= today) {
        const key = dayKey(d);
        perBucket.set(key, {
          key,
          label: d.toLocaleDateString("en-ZA", {
            day: "numeric",
            month: "short",
          }),
          revenue: 0,
          profit: 0,
          orders: 0,
        });
        d.setDate(d.getDate() + 1);
      }
    }

    for (const o of orders) {
      const when = new Date(o.created_at);
      const b = perBucket.get(byMonth ? monthKey(when) : dayKey(when));
      revenue += o.total_cents;
      if (b) {
        b.revenue += o.total_cents;
        b.orders += 1;
      }
      for (const it of o.order_items) {
        const e = it.order_item_costs;
        const unitCost = Array.isArray(e)
          ? (e[0]?.unit_cost_cents ?? null)
          : (e?.unit_cost_cents ?? null);
        itemsSold += it.quantity;
        const key = it.product_id ?? it.name;
        const p = products.get(key) ?? {
          name: it.name,
          units: 0,
          revenue: 0,
          profit: 0,
          costedUnits: 0,
        };
        p.units += it.quantity;
        p.revenue += it.quantity * it.unit_price_cents;
        if (unitCost !== null) {
          const line = it.quantity * (it.unit_price_cents - unitCost);
          profit += line;
          p.profit += line;
          p.costedUnits += it.quantity;
          itemsWithCost += it.quantity;
          if (b) b.profit += line;
        }
        products.set(key, p);
      }
    }

    return {
      revenue,
      profit,
      count: orders.length,
      avg: orders.length ? Math.round(revenue / orders.length) : 0,
      itemsSold,
      itemsWithCost,
      buckets: [...perBucket.values()],
      top: [...products.values()]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    };
  }, [orders, range]);

  const values = stats.buckets.map((b) =>
    metric === "revenue" ? b.revenue : b.profit,
  );
  const max = Math.max(1, ...values.map((v) => Math.max(v, 0)));
  const hovered = hover !== null ? stats.buckets[hover] : null;

  if (!sb) {
    return (
      <section className="px-5 py-16 text-muted md:px-0">
        Supabase is not configured. Set the project URL and anon key to use the
        dashboard.
      </section>
    );
  }

  const costCoverage =
    stats.itemsSold > 0
      ? Math.round((stats.itemsWithCost / stats.itemsSold) * 100)
      : 100;

  const tile = "rounded-3xl border border-line bg-white/50 p-4 sm:p-5";

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
          Dashboard
        </h1>
        <div
          role="group"
          aria-label="Time range"
          className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-line p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              onClick={() => pickRange(r.id)}
              aria-pressed={range === r.id}
              className={`h-9 shrink-0 whitespace-nowrap rounded-full px-3 text-sm transition-colors duration-300 sm:px-4 ${
                range === r.id
                  ? "bg-ink text-white"
                  : "text-muted hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-6 text-[15px] text-sale"
        >
          {error}
        </p>
      )}

      <div
        className={`mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${loading ? "opacity-50" : ""}`}
      >
        <div className={tile}>
          <p className="text-sm text-muted">Revenue</p>
          <p className="mt-2 font-serif text-2xl text-ink sm:text-3xl">
            {money(stats.revenue)}
          </p>
          <p className="mt-1 text-xs text-muted">
            Paid orders, delivery included
          </p>
        </div>
        <div className={tile}>
          <p className="text-sm text-muted">Product profit</p>
          <p
            className={`mt-2 font-serif text-2xl sm:text-3xl ${stats.profit < 0 ? "text-sale" : "text-ink"}`}
          >
            {money(stats.profit)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {costCoverage === 100
              ? "Before delivery costs and fees"
              : `Cost known for ${costCoverage}% of items sold`}
          </p>
        </div>
        <div className={tile}>
          <p className="text-sm text-muted">Orders</p>
          <p className="mt-2 font-serif text-2xl text-ink sm:text-3xl">
            {stats.count}
          </p>
          <p className="mt-1 text-xs text-muted">
            {stats.itemsSold} items sold
          </p>
        </div>
        <div className={tile}>
          <p className="text-sm text-muted">Average order</p>
          <p className="mt-2 font-serif text-2xl text-ink sm:text-3xl">
            {stats.count ? money(stats.avg) : "-"}
          </p>
          <p className="mt-1 text-xs text-muted">Revenue per order</p>
        </div>
      </div>

      {/* Needs attention */}
      <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-ink">
        <li>
          <span className={toPack ? "text-sale" : "text-muted"}>
            {toPack ?? "-"}
          </span>{" "}
          order
          {toPack === 1 ? "" : "s"} to pack
        </li>
        <li>
          <span className={lowStock ? "text-sale" : "text-muted"}>
            {lowStock ?? "-"}
          </span>{" "}
          low on stock
        </li>
        <li>
          <span className={outStock ? "text-sale" : "text-muted"}>
            {outStock ?? "-"}
          </span>{" "}
          out of stock
        </li>
      </ul>

      {/* Chart */}
      <div className="mt-10 rounded-3xl border border-line bg-white/50 p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg text-ink">
            {metric === "revenue" ? "Revenue" : "Product profit"} per{" "}
            {stats.buckets.length > 0 && stats.buckets[0].key.length === 7
              ? "month"
              : "day"}
          </h2>
          <div
            role="group"
            aria-label="Measure"
            className="flex gap-1 rounded-full border border-line p-1"
          >
            {(["revenue", "profit"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                aria-pressed={metric === m}
                className={`h-9 rounded-full px-4 text-sm capitalize transition-colors duration-300 ${
                  metric === m
                    ? "bg-ink text-white"
                    : "text-muted hover:text-ink"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="relative mt-6 flex gap-3">
          {/* y-axis: just the top value and zero, the grid does the rest */}
          <div
            aria-hidden
            className="flex h-56 w-14 shrink-0 flex-col justify-between text-right text-xs text-muted"
          >
            <span>{money(max)}</span>
            <span>R0</span>
          </div>
          <div className="relative h-56 min-w-0 flex-1">
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 border-t border-line"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 top-1/2 border-t border-line/60"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 border-t border-line"
            />
            <div
              className="absolute inset-0 flex items-end gap-[2px]"
              onMouseLeave={() => setHover(null)}
              role="list"
              aria-label={`${metric} chart`}
            >
              {stats.buckets.map((b, i) => {
                const v = values[i];
                const pct = v > 0 ? Math.max(2, (v / max) * 100) : 0;
                return (
                  <button
                    key={b.key}
                    role="listitem"
                    aria-label={`${b.label}: ${money(v)}, ${b.orders} order${b.orders === 1 ? "" : "s"}`}
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    className="flex h-full min-w-0 flex-1 items-end"
                  >
                    <span
                      className={`block w-full rounded-t-[4px] transition-colors duration-200 ${
                        hover === i ? "bg-gold" : "bg-ink"
                      }`}
                      style={{ height: `${pct}%` }}
                    />
                  </button>
                );
              })}
            </div>

            {hovered && hover !== null && (
              <div
                role="status"
                className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-xl border border-line bg-white px-3 py-2 text-xs text-ink shadow-sm"
                style={{
                  left: `${((hover + 0.5) / stats.buckets.length) * 100}%`,
                  transform: `translate(${hover > stats.buckets.length / 2 ? "-100%" : "0"}, -100%)`,
                }}
              >
                <p className="text-muted">{hovered.label}</p>
                <p>
                  Revenue {money(hovered.revenue)} · Profit{" "}
                  {money(hovered.profit)}
                </p>
                <p className="text-muted">
                  {hovered.orders} order{hovered.orders === 1 ? "" : "s"}
                </p>
              </div>
            )}
          </div>
        </div>
        {stats.buckets.length > 0 && (
          <div
            aria-hidden
            className="mt-2 flex justify-between pl-[calc(3.5rem+0.75rem)] text-xs text-muted"
          >
            <span>{stats.buckets[0].label}</span>
            <span>{stats.buckets[stats.buckets.length - 1].label}</span>
          </div>
        )}
        {!loading && stats.count === 0 && (
          <p className="mt-4 text-[15px] text-muted">
            No paid orders in this period yet. Sandbox test orders are not
            counted.
          </p>
        )}

        <details className="mt-6 text-sm">
          <summary className="cursor-pointer text-muted hover:text-ink">
            View as table
          </summary>
          <div className="mt-3 max-h-72 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-normal">
                    {stats.buckets[0]?.key.length === 7 ? "Month" : "Day"}
                  </th>
                  <th className="py-2 font-normal">Orders</th>
                  <th className="py-2 font-normal">Revenue</th>
                  <th className="py-2 font-normal">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[...stats.buckets].reverse().map((b) => (
                  <tr key={b.key}>
                    <td className="py-2 text-ink">{b.label}</td>
                    <td className="py-2 text-muted">{b.orders}</td>
                    <td className="py-2 text-muted">{money(b.revenue)}</td>
                    <td className="py-2 text-muted">{money(b.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>

      {/* Top products */}
      <div className="mt-6 rounded-3xl border border-line bg-white/50 p-5 sm:p-8">
        <h2 className="text-lg text-ink">Best sellers in this period</h2>
        {stats.top.length === 0 ? (
          <p className="mt-3 text-[15px] text-muted">Nothing sold yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 font-normal">Product</th>
                  <th className="py-2 font-normal">Units</th>
                  <th className="py-2 font-normal">Revenue</th>
                  <th className="py-2 font-normal">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {stats.top.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2.5 pr-4 text-ink">{p.name}</td>
                    <td className="py-2.5 text-muted">{p.units}</td>
                    <td className="py-2.5 text-muted">{money(p.revenue)}</td>
                    <td className="py-2.5 text-muted">
                      {p.costedUnits === 0
                        ? "No cost set"
                        : p.costedUnits < p.units
                          ? `${money(p.profit)} (partial)`
                          : money(p.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
