"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type OrderStatus = "confirmed" | "packed" | "shipped" | "delivered";

export type TrackedOrder = {
  number: string;
  status: OrderStatus;
  /** Free text, e.g. "Thursday 16 October". */
  eta?: string;
  carrier?: string;
  trackingUrl?: string;
  events?: { label: string; date: string }[];
};

type TrackOrderProps = {
  /** Look an order up. Return null when nothing matches. Throw on a server error. */
  onLookup?: (
    orderNumber: string,
    email: string,
  ) => Promise<TrackedOrder | null>;
  /** Prefill from ?order= in the URL. */
  defaultOrderNumber?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "On its way" },
  { key: "delivered", label: "Delivered" },
];

const MESSAGES: Record<OrderStatus, string> = {
  confirmed: "We've got your order and we're getting it ready.",
  packed: "Your order is packed and waiting for the courier.",
  shipped: "Your order is on its way to you.",
  delivered: "Your order has been delivered. Enjoy.",
};

type Phase = "idle" | "loading" | "found" | "missing" | "error";

export default function TrackOrder({
  onLookup,
  defaultOrderNumber = "",
}: TrackOrderProps) {
  const [orderNumber, setOrderNumber] = useState(defaultOrderNumber);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [fieldError, setFieldError] = useState("");
  const fillBar = useRef<HTMLSpanElement>(null);

  const current = order ? STEPS.findIndex((s) => s.key === order.status) : 0;

  // The progress line draws itself once the result is on screen. This is
  // the DOM animating, so it is driven through the Web Animations API with
  // cleanup, rather than mirrored into React state.
  useEffect(() => {
    const el = fillBar.current;
    if (phase !== "found" || !el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const to = (current / (STEPS.length - 1)) * 75;
    const anim = el.animate([{ width: "0%" }, { width: `${to}%` }], {
      duration: reduce ? 0 : 1400,
      delay: reduce ? 0 : 250,
      easing: "cubic-bezier(0.22,1,0.36,1)",
      fill: "both",
    });
    return () => anim.cancel();
  }, [phase, current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phase === "loading") return;

    if (
      !orderNumber.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
    ) {
      setFieldError("Enter your order number and the email you ordered with.");
      return;
    }
    setFieldError("");
    setPhase("loading");

    try {
      if (!onLookup) throw new Error("not-connected");
      const result = await onLookup(orderNumber.trim(), email.trim());
      if (result) {
        setOrder(result);
        setPhase("found");
      } else {
        setOrder(null);
        setPhase("missing");
      }
    } catch (err) {
      setFieldError(
        err instanceof Error && err.message === "not-connected"
          ? "Order tracking isn't connected yet."
          : "Something went wrong on our side. Please try again.",
      );
      setPhase("error");
    }
  };

  const inputClass =
    "h-14 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

  return (
    <section
      aria-labelledby="track-heading"
      className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16"
    >
      <h1
        id="track-heading"
        className="font-serif text-[clamp(2.75rem,8vw,6rem)] font-light leading-[0.96] tracking-[-0.02em] text-ink"
      >
        <span className="mask-word">
          <span className="animate-word-up">Where&apos;s my order?</span>
        </span>
      </h1>
      <p
        className="animate-fade-up mt-5 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg"
        style={{ animationDelay: "250ms" }}
      >
        Enter your order number and email. You&apos;ll find the number in your
        confirmation email.
      </p>

      <form
        onSubmit={submit}
        noValidate
        className="animate-fade-up mt-10 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
        style={{ animationDelay: "350ms" }}
      >
        <div>
          <label
            htmlFor="track-order"
            className="mb-2 block text-sm text-ink"
          >
            Order number
          </label>
          <input
            id="track-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            autoComplete="off"
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="track-email"
            className="mb-2 block text-sm text-ink"
          >
            Email
          </label>
          <input
            id="track-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          disabled={phase === "loading"}
          className={`group relative mt-auto flex h-14 items-center justify-center overflow-hidden rounded-full bg-ink px-9 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98] disabled:pointer-events-none`}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
          />
          <span className="relative flex items-center gap-2 transition-colors duration-500 group-hover:text-ink">
            {phase === "loading" ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                />
                Looking
              </>
            ) : (
              "Track"
            )}
          </span>
        </button>
      </form>

      <div aria-live="polite">
        {fieldError && (
          <p
            role="alert"
            className="mt-4 text-sm text-sale"
          >
            {fieldError}
          </p>
        )}

        {phase === "missing" && (
          <div className="animate-fade-up mt-10 rounded-3xl border border-line bg-white/60 p-8">
            <p className="font-serif text-3xl font-light text-ink">
              We couldn&apos;t find that order.
            </p>
            <p className="mt-3 text-muted">
              Check the order number and make sure the email matches the one you
              ordered with. Still stuck?{" "}
              <Link
                href="/help"
                className="text-ink underline underline-offset-4"
              >
                Visit the help centre
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {phase === "found" && order && (
        <div className="animate-fade-up mt-12 rounded-3xl border border-line bg-white/60 p-6 sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted">Order {order.number}</p>
              <p className="mt-1 font-serif text-4xl font-light text-ink sm:text-5xl">
                {STEPS[current].label}
              </p>
            </div>
            {order.eta && order.status !== "delivered" && (
              <p className="text-[15px] text-muted">
                Arriving <span className="text-ink">{order.eta}</span>
              </p>
            )}
          </div>
          <p className="mt-3 text-muted">{MESSAGES[order.status]}</p>

          {/* Stepper */}
          <ol
            aria-label="Delivery progress"
            className="relative mt-12 grid grid-cols-4"
          >
            {/* track */}
            <span
              aria-hidden="true"
              className="absolute left-[12.5%] right-[12.5%] top-5 h-[3px] rounded-full bg-line"
            />
            <span
              ref={fillBar}
              aria-hidden="true"
              className="absolute left-[12.5%] top-5 h-[3px] rounded-full bg-gold"
              style={{ width: "0%" }}
            />
            {STEPS.map((s, i) => {
              const done = i < current;
              const active = i === current;
              return (
                <li
                  key={s.key}
                  aria-current={active ? "step" : undefined}
                  className="relative flex flex-col items-center text-center"
                >
                  <span
                    className={`relative grid h-11 w-11 place-items-center rounded-full border-2 text-sm transition-all duration-700 ${EASE} ${
                      done || active
                        ? "border-ink bg-ink text-white"
                        : "border-line bg-ivory text-muted"
                    }`}
                    style={{ transitionDelay: `${i * 250}ms` }}
                  >
                    {done ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                    {active && (
                      <span
                        aria-hidden="true"
                        className="animate-pulse-ring absolute inset-0 rounded-full border border-gold"
                      />
                    )}
                  </span>
                  <span
                    className={`mt-3 text-xs sm:text-sm ${
                      done || active ? "text-ink" : "text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>

          {(order.carrier || order.trackingUrl) && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ivory px-6 py-5">
              <p className="text-[15px] text-muted">
                {order.carrier ? (
                  <>
                    Shipped with{" "}
                    <span className="text-ink">{order.carrier}</span>
                  </>
                ) : (
                  "Courier tracking"
                )}
              </p>
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center rounded-full border border-ink px-6 text-sm text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
                >
                  Open courier tracking
                </a>
              )}
            </div>
          )}

          {order.events && order.events.length > 0 && (
            <div className="mt-10">
              <h2 className="font-serif text-2xl font-light text-ink">
                History
              </h2>
              <ul className="mt-4 border-l border-line">
                {order.events.map((ev, i) => (
                  <li
                    key={`${ev.date}-${ev.label}`}
                    className="animate-fade-up relative pb-6 pl-6 last:pb-0"
                    style={{ animationDelay: `${300 + i * 90}ms` }}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full ${
                        i === 0 ? "bg-gold" : "bg-ink/30"
                      }`}
                    />
                    <p className="text-[15px] text-ink">{ev.label}</p>
                    <p className="text-sm text-muted">{ev.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
