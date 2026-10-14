"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type Chapter = { title: string; paragraphs: string[] };
export type Value = { title: string; body: string };
export type Stat = {
  value: number;
  label: string;
  suffix?: string;
  decimals?: number;
};

type AboutPageProps = {
  /** The big statement. Each word rises in one after another. */
  headline?: string;
  intro?: string;
  chapters?: Chapter[];
  values?: Value[];
  /** Leave empty to hide the numbers band. Use real figures only. */
  stats?: Stat[];
};

/* PLACEHOLDER copy. Replace every line with your real story before launch. */
const DEFAULT_HEADLINE =
  "We make the things that keep your tech running, so you can look up.";
const DEFAULT_INTRO =
  "Offline House started with a simple idea: the best technology is the kind you stop thinking about.";
const DEFAULT_CHAPTERS: Chapter[] = [
  {
    title: "Why we exist",
    paragraphs: [
      "Replace this with the real reason Offline House exists, in your own words.",
      "Tell people who you are, what you noticed, and what you set out to fix.",
    ],
  },
  {
    title: "How we choose",
    paragraphs: [
      "Replace this with how you pick what goes in the shop: the tests, the standards, the things you refuse to sell.",
    ],
  },
];
const DEFAULT_VALUES: Value[] = [
  { title: "Built to last", body: "Replace with what quality means to you." },
  {
    title: "Honest by default",
    body: "Replace with how you talk about products and prices.",
  },
  {
    title: "Made for real life",
    body: "Replace with who you design the range for.",
  },
];

const ACCENTS = [
  "var(--cat-tech)",
  "var(--gold)",
  "var(--cat-living)",
  "var(--cat-beauty)",
  "var(--cat-essentials)",
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ---------- reveal on scroll ---------- */

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/* ---------- count up ---------- */

function CountUp({ stat }: { stat: Stat }) {
  const [ref, seen] = useInView<HTMLParagraphElement>(0.5);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!seen) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const duration = reduce ? 0 : 1800;
    const start = performance.now();
    let raf = 0;
    // State is updated from the animation-frame callback, never synchronously
    const tick = (now: number) => {
      const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setShown(stat.value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, stat.value]);

  const formatted = shown.toLocaleString("en-ZA", {
    minimumFractionDigits: stat.decimals ?? 0,
    maximumFractionDigits: stat.decimals ?? 0,
  });

  return (
    <p
      ref={ref}
      aria-label={`${stat.value}${stat.suffix ?? ""} ${stat.label}`}
      className="font-serif text-6xl font-light leading-none tabular-nums text-white sm:text-7xl"
    >
      <span aria-hidden="true">
        {formatted}
        {stat.suffix}
      </span>
    </p>
  );
}

/* ---------- page ---------- */

export default function AboutPage({
  headline = DEFAULT_HEADLINE,
  intro = DEFAULT_INTRO,
  chapters = DEFAULT_CHAPTERS,
  values = DEFAULT_VALUES,
  stats = [],
}: AboutPageProps) {
  const words = headline.split(" ");
  const [chaptersRef, chaptersSeen] = useInView<HTMLDivElement>(0.1);
  const [valuesRef, valuesSeen] = useInView<HTMLUListElement>(0.15);

  return (
    <div>
      {/* Statement */}
      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <span className="animate-drift absolute -left-24 top-10 h-80 w-80 rounded-full bg-(--cat-tech) opacity-25 blur-3xl" />
          <span
            className="animate-drift absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-(--cat-beauty) opacity-25 blur-3xl"
            style={{ animationDelay: "-8s", animationDuration: "22s" }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-24">
          <h1 className="max-w-5xl font-serif text-[clamp(2.75rem,8.2vw,7.5rem)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
            <span className="sr-only">{headline}</span>
            <span aria-hidden="true">
              {words.map((w, i) => (
                <span
                  key={`${w}-${i}`}
                  className="mask-word mr-[0.22em]"
                >
                  <span
                    className="animate-word-up"
                    style={{ animationDelay: `${150 + i * 70}ms` }}
                  >
                    {w}
                  </span>
                </span>
              ))}
            </span>
          </h1>
          <p
            className="animate-fade-up mt-10 max-w-[52ch] text-lg leading-relaxed text-muted sm:text-xl"
            style={{ animationDelay: `${300 + words.length * 70}ms` }}
          >
            {intro}
          </p>
        </div>
      </header>

      {/* Chapters */}
      <section
        aria-label="Our story"
        className="mx-auto max-w-7xl px-5 sm:px-6"
      >
        <div ref={chaptersRef}>
          {chapters.map((c, i) => (
            <div
              key={c.title}
              style={{ transitionDelay: `${i * 120}ms` }}
              className={`grid gap-6 border-t border-line py-12 transition-[opacity,transform] duration-[900ms] ${EASE} sm:py-16 lg:grid-cols-12 lg:gap-10 ${
                chaptersSeen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <div className="lg:col-span-4">
                <p className="text-sm tabular-nums text-muted">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-3 font-serif text-4xl font-light leading-tight text-ink sm:text-5xl">
                  {c.title}
                </h2>
              </div>
              <div className="max-w-[60ch] space-y-5 text-lg leading-relaxed text-ink/80 lg:col-span-7 lg:col-start-6">
                {c.paragraphs.map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section
        aria-labelledby="values-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24"
      >
        <h2
          id="values-heading"
          className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
        >
          What we stand for.
        </h2>
        <ul
          ref={valuesRef}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        >
          {values.map((v, i) => (
            <li
              key={v.title}
              style={
                {
                  "--accent": ACCENTS[i % ACCENTS.length],
                  transitionDelay: `${i * 110}ms`,
                } as React.CSSProperties
              }
              className={`transition-[opacity,transform] duration-[900ms] ${EASE} ${
                valuesSeen
                  ? "translate-y-0 opacity-100"
                  : "translate-y-10 opacity-0"
              }`}
            >
              <article className="group relative isolate flex h-full min-h-[240px] flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-white/60 p-7 transition-[transform,border-color] duration-700 hover:-translate-y-1 hover:border-transparent sm:p-8">
                <span
                  aria-hidden="true"
                  className={`absolute -right-8 -top-8 -z-10 h-20 w-20 rounded-full bg-(--accent) transition-transform duration-[900ms] ${EASE} group-hover:scale-[14]`}
                />
                <p className="text-sm tabular-nums text-ink/60">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <div>
                  <h3 className="font-serif text-3xl font-light leading-tight text-ink">
                    {v.title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
                    {v.body}
                  </p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>

      {/* Numbers */}
      {stats.length > 0 && (
        <section
          aria-label="Offline House in numbers"
          className="mx-2 overflow-hidden rounded-[32px] bg-ink sm:mx-4 sm:rounded-[48px]"
        >
          <ul className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 sm:px-10 sm:py-24 lg:grid-cols-4">
            {stats.map((s) => (
              <li key={s.label}>
                <CountUp stat={s} />
                <p className="mt-3 text-[15px] text-white/65">{s.label}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Close */}
      <section className="mx-auto max-w-7xl px-5 py-20 text-center sm:px-6 sm:py-28">
        <p className="mx-auto max-w-[18ch] font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] text-ink">
          Disconnect to reconnect.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/collections/top-sellers"
            className={`group inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-8 pr-3 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
          >
            Shop top sellers
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
            >
              →
            </span>
          </Link>
          <Link
            href="/contact"
            className="inline-flex h-14 items-center rounded-full border border-ink/20 px-8 text-[15px] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
          >
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  );
}
