"use client";

import Link from "next/link";
import { useCallback, useState, useSyncExternalStore } from "react";

const TEXT =
  "We make the things that keep your devices charged, so you can put them down. Chargers and cables built to outlast the season. Home pieces that give your evenings back. Fewer notifications, more of everything else.";

const WORDS = TEXT.split(" ");

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
const SCALE = 1000; // progress is read as a whole number from 0 to 1000

// How far the reader has got through the block, from 0 to SCALE.
function readProgress(el: HTMLElement | null): number {
  // Reduced motion: show everything charged and finished.
  if (window.matchMedia(REDUCED_MOTION).matches) return SCALE;
  if (!el) return 0;
  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const start = vh * 0.8; // reading begins as the block enters here
  const end = vh * 0.35; // finished once its bottom reaches here
  const p = Math.min(
    1,
    Math.max(0, (start - rect.top) / (rect.height + start - end)),
  );
  return Math.round(p * SCALE);
}

export default function Manifesto() {
  // The block is held in state (via a callback ref) so the subscription
  // below can be set up for exactly that element.
  const [block, setBlock] = useState<HTMLDivElement | null>(null);

  // Scroll position is external state: subscribe to it rather than copying
  // it into React state from an effect.
  const subscribe = useCallback((notify: () => void) => {
    let raf = 0;
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(notify);
    };
    const mq = window.matchMedia(REDUCED_MOTION);
    window.addEventListener("scroll", onChange, { passive: true });
    window.addEventListener("resize", onChange);
    mq.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onChange);
      window.removeEventListener("resize", onChange);
      mq.removeEventListener("change", onChange);
    };
  }, []);

  const getSnapshot = useCallback(() => readProgress(block), [block]);
  const progress = useSyncExternalStore(subscribe, getSnapshot, () => 0);

  const pct = Math.round((progress / SCALE) * 100);
  // The last couple of words light up just before the ring completes
  const lit = Math.min(
    WORDS.length,
    Math.floor((progress / SCALE) * (WORDS.length + 3)),
  );
  const full = pct >= 100;

  return (
    <section
      aria-labelledby="manifesto-heading"
      className="relative overflow-hidden"
    >
      <h2
        id="manifesto-heading"
        className="sr-only"
      >
        Why Offline House
      </h2>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-12 lg:gap-14 lg:py-36">
        {/* Charging ring: fills as you read */}
        <div className="lg:col-span-3">
          <div className="flex items-center gap-5 lg:sticky lg:top-36 lg:flex-col lg:items-start lg:gap-4">
            <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28 lg:h-36 lg:w-36">
              <svg
                viewBox="0 0 120 120"
                aria-hidden="true"
                className="h-full w-full -rotate-90"
              >
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke="var(--line)"
                  strokeWidth="2"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 - pct}
                  className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
                  style={{
                    stroke: full ? "var(--gold)" : "var(--ink)",
                  }}
                />
              </svg>
              {/* glow when fully charged */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full bg-gold/30 blur-2xl transition-opacity duration-700 ${
                  full ? "opacity-100" : "opacity-0"
                }`}
              />
              <span
                aria-hidden="true"
                className="absolute inset-0 grid place-items-center font-serif text-3xl font-light tabular-nums text-ink sm:text-4xl lg:text-5xl"
              >
                {pct}
                <span className="-ml-3 mt-1 self-start text-sm sm:text-base">
                  %
                </span>
              </span>
            </div>
            <p
              aria-hidden="true"
              className="text-sm text-muted"
            >
              {full ? "Fully charged." : "Charging as you read."}
            </p>
          </div>
        </div>

        {/* Words light up with scroll */}
        <div
          ref={setBlock}
          className="lg:col-span-9"
        >
          <p className="font-serif text-[clamp(1.9rem,4.4vw,3.6rem)] font-light leading-[1.14] tracking-[-0.01em]">
            {WORDS.map((w, i) => (
              <span
                key={`${w}-${i}`}
                className={`transition-colors duration-500 ${EASE} ${
                  i < lit ? "text-ink" : "text-ink/15"
                }`}
              >
                {w}{" "}
              </span>
            ))}
          </p>

          <Link
            href="/about"
            className={`group mt-10 inline-flex items-center gap-4 text-sm text-ink transition-opacity duration-700 ${
              full ? "opacity-100" : "opacity-40"
            }`}
          >
            <span className="relative pb-1">
              Read our story
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-px origin-left bg-ink transition-transform duration-500 ${EASE} group-hover:scale-x-0`}
              />
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-[2px] origin-right scale-x-0 bg-gold transition-transform duration-500 ${EASE} group-hover:scale-x-100`}
              />
            </span>
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 place-items-center rounded-full border border-ink/20 transition-all duration-500 ${EASE} group-hover:translate-x-1 group-hover:border-ink group-hover:bg-ink group-hover:text-white`}
            >
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
