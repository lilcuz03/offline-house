"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

type DealsCountdownProps = {
  /** ISO string or Date. Defaults to the end of the coming Sunday (local time). */
  endsAt?: string | Date;
  /** Big number in the seal, e.g. "40%". */
  discountLabel?: string;
  href?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ---------- time helpers ---------- */

function endOfComingSunday() {
  const d = new Date();
  const daysAhead = (7 - d.getDay()) % 7; // 0 when today is Sunday
  d.setDate(d.getDate() + daysAhead);
  d.setHours(23, 59, 59, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 7);
  return d;
}

function parts(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/* ---------- clock ---------- */

// The current time is external state. It is read through
// useSyncExternalStore: the snapshot is whole seconds (a primitive, so it is
// stable between reads) and is refreshed by one interval that exists only
// while a component is subscribed. The server snapshot is -1, which the
// component treats as "not mounted yet".
let nowSeconds = 0;

function currentSeconds() {
  return Math.floor(Date.now() / 1000);
}

function subscribeClock(notify: () => void) {
  nowSeconds = currentSeconds();
  const id = setInterval(() => {
    nowSeconds = currentSeconds();
    notify();
  }, 1000);
  return () => clearInterval(id);
}

function getClock() {
  return nowSeconds || (nowSeconds = currentSeconds());
}

const getServerClock = () => -1;

/* ---------- one rolling digit ---------- */

// The strip runs 9 down to 0, then a spare 9. Counting down moves the strip
// upward; the 0 to 9 wrap rolls onto the spare 9, then snaps back unseen.
const STRIP = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 9];
const idx = (v: number) => 9 - v;

function Digit({ value }: { value: number }) {
  // The strip position is worked out while rendering, from the previous and
  // the new value, instead of being copied into state from an effect.
  const [roll, setRoll] = useState({
    prev: value,
    pos: idx(value),
    animate: true,
  });

  if (roll.prev !== value) {
    setRoll({
      prev: value,
      pos: roll.prev === 0 && value === 9 ? 10 : idx(value),
      animate: true,
    });
  }

  return (
    <span className="relative block h-[1em] w-[0.62em] overflow-hidden text-center leading-none">
      <span
        aria-hidden="true"
        onTransitionEnd={() => {
          // After rolling onto the spare 9, snap back to the real one unseen
          setRoll((r) => (r.pos === 10 ? { ...r, pos: 0, animate: false } : r));
        }}
        className={`block ${
          roll.animate ? `transition-transform duration-700 ${EASE}` : ""
        }`}
        style={{ transform: `translateY(-${roll.pos * (100 / 11)}%)` }}
      >
        {STRIP.map((n, i) => (
          <span
            key={i}
            className="block h-[1em] leading-none"
          >
            {n}
          </span>
        ))}
      </span>
    </span>
  );
}

function Unit({ value, label }: { value: number; label: string }) {
  const tens = Math.floor(value / 10) % 10;
  const ones = value % 10;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex rounded-2xl border border-white/30 bg-white/10 px-3 py-3 font-serif text-[2.6rem] font-light tabular-nums text-white backdrop-blur-sm sm:px-5 sm:py-4 sm:text-6xl lg:text-7xl">
        <Digit value={tens} />
        <Digit value={ones} />
      </div>
      <span className="text-xs text-white/75 sm:text-sm">{label}</span>
    </div>
  );
}

/* ---------- section ---------- */

export default function DealsCountdown({
  endsAt,
  discountLabel = "40%",
  href = "/collections/deals",
}: DealsCountdownProps) {
  const seconds = useSyncExternalStore(
    subscribeClock,
    getClock,
    getServerClock,
  );
  const mounted = seconds >= 0;

  // The default deadline is fixed the first time the component renders, so
  // the countdown can finish and show "ended" instead of rolling forward.
  // It is not displayed until the clock is available on the client.
  const [defaultEnd] = useState(() => endOfComingSunday().getTime());
  const target = endsAt ? new Date(endsAt).getTime() : defaultEnd;

  const left = mounted ? target - seconds * 1000 : 0;
  const time = mounted ? parts(left) : null;
  const expired = mounted && left <= 0;

  const ringText =
    "Marked down this week ✦ Marked down this week ✦ Marked down this week ✦ ";

  return (
    <section
      aria-labelledby="deals-heading"
      className="relative isolate overflow-hidden bg-sale text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.16),transparent_45%),radial-gradient(circle_at_5%_100%,rgba(0,0,0,0.25),transparent_50%)]"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-8 lg:py-28">
        {/* Copy + countdown */}
        <div className="lg:col-span-7">
          <h2
            id="deals-heading"
            className="max-w-[14ch] font-serif text-[clamp(2.75rem,7vw,5.5rem)] font-light leading-[0.96] tracking-[-0.015em]"
          >
            {expired ? "This week's deals have ended." : "This week's deals."}
          </h2>
          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-white/85 sm:text-lg">
            {expired
              ? "New prices land soon. Browse what's still in stock."
              : "Chargers, cables and home picks, marked down until the clock runs out. Then prices go back up."}
          </p>

          {/* Countdown. Visual only; the sentence below is what screen readers get. */}
          <div
            role="timer"
            aria-label={
              time
                ? `${time.days} days, ${time.hours} hours, ${time.minutes} minutes left`
                : "Countdown loading"
            }
            className="mt-10 flex flex-wrap items-start gap-2.5 sm:gap-4"
          >
            <Unit
              value={time?.days ?? 0}
              label="Days"
            />
            <Unit
              value={time?.hours ?? 0}
              label="Hours"
            />
            <Unit
              value={time?.minutes ?? 0}
              label="Minutes"
            />
            <Unit
              value={time?.seconds ?? 0}
              label="Seconds"
            />
          </div>

          <Link
            href={href}
            className={`group mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-ivory pl-8 pr-3 text-[15px] text-ink transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
          >
            Shop deals
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 place-items-center rounded-full bg-ink text-white transition-transform duration-500 ${EASE} group-hover:translate-x-1 group-hover:-rotate-45`}
            >
              →
            </span>
          </Link>
        </div>

        {/* Seal */}
        <div className="lg:col-span-5">
          <div className="animate-disc-in relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px]">
            <svg
              viewBox="0 0 200 200"
              aria-hidden="true"
              className="animate-spin-slow absolute inset-0 h-full w-full"
              style={{ animationDuration: "28s" }}
            >
              <defs>
                <path
                  id="seal-ring"
                  d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0"
                />
              </defs>
              <text
                fill="white"
                fontSize="11.5"
                letterSpacing="1"
                textLength="486"
                lengthAdjust="spacing"
              >
                <textPath href="#seal-ring">{ringText}</textPath>
              </text>
            </svg>

            <svg
              viewBox="0 0 200 200"
              aria-hidden="true"
              className="animate-spin-rev absolute inset-0 h-full w-full"
              style={{ animationDuration: "50s" }}
            >
              <circle
                cx="100"
                cy="100"
                r="92"
                fill="none"
                stroke="white"
                strokeOpacity="0.35"
                strokeWidth="0.6"
                strokeDasharray="1 4"
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-[17%] grid place-items-center rounded-full bg-ivory text-center text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
              <div>
                <p className="text-sm text-muted sm:text-base">Up to</p>
                <p className="font-serif text-6xl font-light leading-none sm:text-7xl lg:text-8xl">
                  {discountLabel}
                </p>
                <p className="mt-1 text-sm text-muted sm:text-base">off</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
