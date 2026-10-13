"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type CartItem = {
  id: string;
  slug: string;
  name: string;
  /** Unit price in rands (not cents). */
  price: number;
  quantity: number;
  image?: string | null;
  /** e.g. "Black / 2 m" */
  variant?: string | null;
};

type CartDrawerProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  checkoutHref?: string;
  /** Rand amount that unlocks free delivery. Leave out to hide the progress bar. */
  freeShippingThreshold?: number;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const MAX_QTY = 99;

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const CloseIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...stroke}
  >
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export default function CartDrawer({
  open,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  checkoutHref = "/checkout",
  freeShippingThreshold,
}: CartDrawerProps) {
  const panel = useRef<HTMLElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  /* Scroll lock, focus handoff, Esc and a simple focus trap */
  useEffect(() => {
    if (!open) return;

    returnFocus.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtn.current?.focus(), 120);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const nodes = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((n) => n.offsetParent !== null);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      returnFocus.current?.focus?.();
    };
  }, [open, onClose]);

  const remove = (id: string) => {
    setRemoving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onRemove(id);
      setRemoving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 420);
  };

  const hasBar =
    typeof freeShippingThreshold === "number" && freeShippingThreshold > 0;
  const remaining = hasBar
    ? Math.max(0, (freeShippingThreshold as number) - subtotal)
    : 0;
  const unlocked = hasBar && remaining === 0 && items.length > 0;
  const progress = hasBar
    ? Math.min(100, (subtotal / (freeShippingThreshold as number)) * 100)
    : 0;

  const stepBtn =
    "grid h-9 w-9 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-stone/50 disabled:pointer-events-none disabled:opacity-30";

  return (
    <div
      className={`fixed inset-0 z-[60] transition-[visibility] ${
        open ? "visible delay-0" : "invisible delay-500"
      }`}
      inert={!open}
    >
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`absolute inset-0 bg-ink/40 backdrop-blur-[2px] transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <aside
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-heading"
        className={`absolute right-0 top-0 flex h-dvh w-full max-w-md flex-col bg-ivory shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.4)] transition-transform duration-500 ${EASE} ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pl-6 pr-2">
          <h2
            id="cart-heading"
            className="font-serif text-3xl font-light text-ink"
          >
            Your bag
            {count > 0 && (
              <span className="ml-2 font-sans text-sm text-muted">
                ({count})
              </span>
            )}
          </h2>
          <button
            ref={closeBtn}
            type="button"
            aria-label="Close bag"
            onClick={onClose}
            className="grid h-11 w-11 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-stone/40"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Free delivery progress */}
        {hasBar && items.length > 0 && (
          <div className="shrink-0 border-b border-line px-6 py-4">
            <p
              aria-live="polite"
              className="text-sm text-ink"
            >
              {unlocked
                ? "You've unlocked free delivery."
                : `You're ${zar.format(remaining)} away from free delivery.`}
            </p>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label="Progress to free delivery"
              className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-line"
            >
              <span
                className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-700 ${EASE} ${
                  unlocked ? "bg-gold-deep" : "bg-gold"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <div className="animate-float">
              <svg
                width="150"
                height="80"
                viewBox="0 0 150 80"
                aria-hidden="true"
                fill="none"
              >
                <path
                  d="M2 40h46"
                  stroke="var(--ink)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <rect
                  x="48"
                  y="26"
                  width="30"
                  height="28"
                  rx="8"
                  fill="var(--ink)"
                />
                <rect
                  x="78"
                  y="32"
                  width="14"
                  height="5"
                  rx="2.5"
                  fill="var(--ink)"
                />
                <rect
                  x="78"
                  y="43"
                  width="14"
                  height="5"
                  rx="2.5"
                  fill="var(--ink)"
                />
                <rect
                  x="108"
                  y="16"
                  width="40"
                  height="48"
                  rx="12"
                  fill="var(--ivory)"
                  stroke="var(--ink)"
                  strokeWidth="2"
                />
                <rect
                  x="116"
                  y="31"
                  width="10"
                  height="5"
                  rx="2.5"
                  fill="var(--ink)"
                  opacity="0.6"
                />
                <rect
                  x="116"
                  y="44"
                  width="10"
                  height="5"
                  rx="2.5"
                  fill="var(--ink)"
                  opacity="0.6"
                />
              </svg>
            </div>
            <p className="mt-8 font-serif text-4xl font-light text-ink">
              Nothing plugged in yet.
            </p>
            <p className="mt-3 max-w-[30ch] text-[15px] leading-relaxed text-muted">
              Your bag is empty. Start with what people buy most.
            </p>
            <Link
              href="/collections/top-sellers"
              onClick={onClose}
              className={`group mt-8 inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-8 pr-3 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
            >
              Shop top sellers
              <span
                aria-hidden="true"
                className={`grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
              >
                →
              </span>
            </Link>
          </div>
        ) : (
          <ul className="flex-1 overflow-y-auto overscroll-contain px-6">
            {items.map((item, i) => {
              const gone = removing.has(item.id);
              return (
                <li
                  key={item.id}
                  className={`grid transition-[grid-template-rows,opacity] duration-[420ms] ${EASE} ${
                    gone
                      ? "grid-rows-[0fr] opacity-0"
                      : "grid-rows-[1fr] opacity-100"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`flex gap-4 border-b border-line py-5 transition-[opacity,transform] duration-700 ${EASE} ${
                        open
                          ? "translate-x-0 opacity-100"
                          : "translate-x-8 opacity-0"
                      }`}
                      style={{
                        transitionDelay: open ? `${150 + i * 70}ms` : "0ms",
                      }}
                    >
                      <Link
                        href={`/products/${item.slug}`}
                        onClick={onClose}
                        aria-label={item.name}
                        className="relative block h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-stone/40"
                      >
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt=""
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <span
                            aria-hidden="true"
                            className="grid h-full w-full place-items-center font-serif text-4xl font-light text-ink/70"
                          >
                            {item.name.charAt(0)}
                          </span>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[15px] leading-snug text-ink">
                              <Link
                                href={`/products/${item.slug}`}
                                onClick={onClose}
                                className="transition-colors duration-300 hover:text-gold-deep"
                              >
                                {item.name}
                              </Link>
                            </h3>
                            <p className="shrink-0 text-[15px] text-ink">
                              {zar.format(item.price * item.quantity)}
                            </p>
                          </div>
                          {item.variant && (
                            <p className="mt-1 text-xs text-muted">
                              {item.variant}
                            </p>
                          )}
                          {item.quantity > 1 && (
                            <p className="mt-0.5 text-xs text-muted">
                              {zar.format(item.price)} each
                            </p>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div
                            role="group"
                            aria-label={`Quantity of ${item.name}`}
                            className="inline-flex items-center rounded-full border border-line bg-white/60"
                          >
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              disabled={item.quantity <= 1}
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity - 1)
                              }
                              className={stepBtn}
                            >
                              −
                            </button>
                            <span
                              key={item.quantity}
                              aria-live="polite"
                              className="animate-pop w-7 text-center text-sm tabular-nums text-ink"
                            >
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              disabled={item.quantity >= MAX_QTY}
                              onClick={() =>
                                onUpdateQuantity(item.id, item.quantity + 1)
                              }
                              className={stepBtn}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="text-sm text-muted underline underline-offset-4 transition-colors duration-300 hover:text-sale"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-line bg-white/50 px-6 pb-6 pt-5">
            <div className="flex items-baseline justify-between">
              <p className="text-[15px] text-ink">Subtotal</p>
              <p
                key={subtotal}
                className="animate-pop font-serif text-3xl font-light tabular-nums text-ink"
              >
                {zar.format(subtotal)}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted">
              Delivery and any discounts are worked out at checkout.
            </p>

            <Link
              href={checkoutHref}
              onClick={onClose}
              className={`group relative mt-5 flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-ink text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.02] active:scale-[0.98]`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
              />
              <span className="relative transition-colors duration-500 group-hover:text-ink">
                Checkout
              </span>
              <span
                aria-hidden="true"
                className={`relative transition-all duration-500 group-hover:translate-x-1 group-hover:text-ink`}
              >
                →
              </span>
            </Link>

            <button
              type="button"
              onClick={onClose}
              className="mt-4 block w-full text-center text-sm text-ink underline underline-offset-4 transition-colors duration-300 hover:text-gold-deep"
            >
              Continue shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
