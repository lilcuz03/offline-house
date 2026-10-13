"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";

export type ConfirmedOrder = {
  number: string;
  email: string;
  firstName?: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    /** Unit price in rands. */
    price: number;
    image?: string | null;
    variant?: string | null;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingLabel?: string;
  eta?: string;
  /** Address lines, already formatted. */
  address?: string[];
};

type OrderConfirmationProps = {
  order: ConfirmedOrder;
  /** Empty the bag when this page loads. Defaults to true. */
  clearBag?: boolean;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const STEPS = ["Confirmed", "Packed", "On its way", "Delivered"];

export default function OrderConfirmation({
  order,
  clearBag = true,
}: OrderConfirmationProps) {
  const { clearCart } = useCart();
  const [connected, setConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const cleared = useRef(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Plug in shortly after the page appears, and empty the bag once
  useEffect(() => {
    const t = setTimeout(() => setConnected(true), 450);
    if (clearBag && !cleared.current) {
      cleared.current = true;
      clearCart();
    }
    return () => clearTimeout(t);
  }, [clearBag, clearCart]);

  useEffect(
    () => () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    },
    [],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.number);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked: the number is still on screen */
    }
  };

  return (
    <section
      aria-labelledby="confirmed-heading"
      className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left: the moment */}
        <div className="lg:col-span-7">
          {/* Cable plugs in */}
          <svg
            viewBox="0 0 600 60"
            aria-hidden="true"
            className="h-auto w-full max-w-md overflow-visible"
          >
            <line
              x1="0"
              y1="30"
              x2="430"
              y2="30"
              stroke="var(--ink)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transformBox: "fill-box",
                transformOrigin: "left center",
                transform: connected ? "scaleX(1)" : "scaleX(0.7)",
                transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            <g
              style={{
                transform: connected ? "translateX(0)" : "translateX(-129px)",
                transition: "transform 1.1s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <rect
                x="430"
                y="16"
                width="44"
                height="28"
                rx="8"
                fill="var(--ink)"
              />
              <rect
                x="474"
                y="22"
                width="30"
                height="5"
                rx="2.5"
                fill="var(--ink)"
              />
              <rect
                x="474"
                y="33"
                width="30"
                height="5"
                rx="2.5"
                fill="var(--ink)"
              />
            </g>
            <rect
              x="498"
              y="6"
              width="100"
              height="48"
              rx="14"
              stroke="var(--ink)"
              strokeWidth="2"
              fill={connected ? "var(--gold)" : "var(--ivory)"}
              style={{ transition: "fill 0.6s ease 0.8s" }}
            />
            <circle
              cx="568"
              cy="30"
              r="5"
              fill={connected ? "var(--ink)" : "var(--stone)"}
              style={{ transition: "fill 0.6s ease 0.9s" }}
            />
          </svg>

          <h1
            id="confirmed-heading"
            className="mt-10 font-serif text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.95] tracking-[-0.02em] text-ink"
          >
            <span className="mask-word">
              <span className="animate-word-up">Order</span>
            </span>{" "}
            <span className="mask-word">
              <span
                className="animate-word-up"
                style={{ animationDelay: "120ms" }}
              >
                confirmed.
              </span>
            </span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "400ms" }}
          >
            {order.firstName
              ? `Thank you, ${order.firstName}. `
              : "Thank you. "}
            We&apos;ve sent a confirmation to{" "}
            <span className="text-ink">{order.email}</span>.
          </p>

          {/* Order number */}
          <div
            className="animate-fade-up mt-8 inline-flex items-center gap-3 rounded-full border border-line bg-white/70 py-2 pl-6 pr-2"
            style={{ animationDelay: "520ms" }}
          >
            <span className="text-sm text-muted">Order number</span>
            <span className="font-medium tabular-nums text-ink">
              {order.number}
            </span>
            <button
              type="button"
              onClick={copy}
              className={`h-10 rounded-full px-5 text-sm transition-colors duration-300 ${
                copied
                  ? "bg-gold text-ink"
                  : "bg-ink text-white hover:bg-gold hover:text-ink"
              }`}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          {/* Progress preview */}
          <ol
            aria-label="Order progress"
            className="animate-fade-up mt-14 grid max-w-xl grid-cols-4 gap-2"
            style={{ animationDelay: "640ms" }}
          >
            {STEPS.map((s, i) => (
              <li
                key={s}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className={`block h-1 rounded-full ${
                    i === 0 ? "bg-gold" : "bg-line"
                  }`}
                />
                <span
                  className={`mt-3 block text-xs sm:text-sm ${
                    i === 0 ? "text-ink" : "text-muted"
                  }`}
                >
                  {s}
                  {i === 0 && <span className="sr-only"> (current step)</span>}
                </span>
              </li>
            ))}
          </ol>

          {order.eta && (
            <p className="mt-6 text-[15px] text-muted">
              Estimated delivery: <span className="text-ink">{order.eta}</span>
            </p>
          )}

          <div
            className="animate-fade-up mt-10 flex flex-wrap gap-3"
            style={{ animationDelay: "760ms" }}
          >
            <Link
              href={`/track-order?order=${encodeURIComponent(order.number)}`}
              className={`group inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-8 pr-3 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
            >
              Track your order
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
              >
                →
              </span>
            </Link>
            <Link
              href="/"
              className="inline-flex h-14 items-center rounded-full border border-ink/20 px-8 text-[15px] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
            >
              Keep shopping
            </Link>
          </div>
        </div>

        {/* Right: receipt */}
        <aside
          aria-label="Order summary"
          className="animate-fade-up lg:col-span-5"
          style={{ animationDelay: "500ms" }}
        >
          <div className="rounded-3xl border border-line bg-white/60 p-6 sm:p-8">
            <h2 className="font-serif text-3xl font-light text-ink">
              Your order
            </h2>

            <ul className="mt-4 divide-y divide-line">
              {order.items.map((i) => (
                <li
                  key={i.id}
                  className="flex gap-4 py-4"
                >
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone/40">
                    {i.image ? (
                      <Image
                        src={i.image}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid h-full w-full place-items-center font-serif text-2xl text-ink/70"
                      >
                        {i.name.charAt(0)}
                      </span>
                    )}
                    <span className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[11px] text-white">
                      {i.quantity}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] leading-snug text-ink">
                      {i.name}
                    </p>
                    {i.variant && (
                      <p className="mt-0.5 text-xs text-muted">{i.variant}</p>
                    )}
                  </div>
                  <p className="shrink-0 text-[15px] text-ink">
                    {zar.format(i.price * i.quantity)}
                  </p>
                </li>
              ))}
            </ul>

            <dl className="mt-2 space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="text-ink">{zar.format(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  Delivery
                  {order.shippingLabel ? ` (${order.shippingLabel})` : ""}
                </dt>
                <dd className="text-ink">
                  {order.shippingCost === 0
                    ? "Free"
                    : zar.format(order.shippingCost)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="text-ink">Total</dt>
                <dd className="font-serif text-4xl font-light tabular-nums text-ink">
                  {zar.format(order.total)}
                </dd>
              </div>
            </dl>

            {order.address && order.address.length > 0 && (
              <div className="mt-6 border-t border-line pt-5">
                <h3 className="text-sm text-muted">Delivering to</h3>
                <address className="mt-2 text-[15px] not-italic leading-relaxed text-ink">
                  {order.address.map((line) => (
                    <span
                      key={line}
                      className="block"
                    >
                      {line}
                    </span>
                  ))}
                </address>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
