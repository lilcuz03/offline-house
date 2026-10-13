"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { CATEGORIES } from "../../lib/categories";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ---------- small pieces ---------- */

type TileIcon = "charger" | "cable" | "case" | "earbuds";

const TILES: {
  label: string;
  note: string;
  icon: TileIcon;
  accent: string;
  pos: string;
  depth: number;
  float: string;
  enter: number;
}[] = [
  {
    label: "GaN chargers",
    note: "Fast and cool",
    icon: "charger",
    accent: "var(--cat-tech)",
    pos: "left-[-2%] top-[12%] sm:left-[0%]",
    depth: 34,
    float: "7s",
    enter: 1250,
  },
  {
    label: "Braided cables",
    note: "Built to bend",
    icon: "cable",
    accent: "var(--gold)",
    pos: "right-[-2%] top-[22%] sm:right-[0%]",
    depth: -28,
    float: "8s",
    enter: 1400,
  },
  {
    label: "Phone cases",
    note: "Slim, grippy",
    icon: "case",
    accent: "var(--cat-beauty)",
    pos: "left-[4%] bottom-[10%] sm:left-[6%]",
    depth: -40,
    float: "9s",
    enter: 1550,
  },
  {
    label: "Earbuds",
    note: "All-day battery",
    icon: "earbuds",
    accent: "var(--cat-essentials)",
    pos: "right-[2%] bottom-[6%] sm:right-[4%]",
    depth: 24,
    float: "6.5s",
    enter: 1700,
  },
];

function TileGlyph({ name }: { name: TileIcon }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (name) {
    case "charger":
      return (
        <svg {...common}>
          <rect
            x="6"
            y="6"
            width="12"
            height="13"
            rx="3"
          />
          <path d="M10 6V3M14 6V3" />
          <path d="m12.6 10-2 3h3l-2 3" />
        </svg>
      );
    case "cable":
      return (
        <svg {...common}>
          <path d="M4 18c0-6 6-2 8-6s-2-6 3-7" />
          <rect
            x="14"
            y="3"
            width="6"
            height="4"
            rx="1"
          />
          <rect
            x="2.5"
            y="17"
            width="4"
            height="4"
            rx="1"
          />
        </svg>
      );
    case "case":
      return (
        <svg {...common}>
          <rect
            x="7"
            y="3"
            width="10"
            height="18"
            rx="3"
          />
          <circle
            cx="10.5"
            cy="7"
            r="1.2"
          />
          <path d="M12 18h0" />
        </svg>
      );
    case "earbuds":
      return (
        <svg {...common}>
          <path d="M8 4a3 3 0 0 0-3 3v3a3 3 0 0 0 3 3v5.5" />
          <path d="M16 4a3 3 0 0 1 3 3v3a3 3 0 0 1-3 3v5.5" />
        </svg>
      );
  }
}

const ArrowIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const TRUST = [
  {
    title: "Delivery across South Africa",
    body: "Tracked from our door to yours",
    path: "M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 1 0 0-.01M17 19a1.5 1.5 0 1 0 0-.01",
  },
  {
    title: "Warranty on every tech item",
    body: "If it fails, we replace it",
    path: "M12 3 5 6v5c0 4.4 2.9 8 7 10 4.1-2 7-5.6 7-10V6l-7-3ZM9 12l2 2 4-4",
  },
  {
    title: "Easy returns",
    body: "Changed your mind? Send it back",
    path: "M4 9h12a4 4 0 0 1 0 8H8M4 9l3-3M4 9l3 3",
  },
];

/* ---------- hero ---------- */

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  // Pointer parallax writes CSS variables directly, so there are no re-renders.
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse" || !root.current) return;
    const r = root.current.getBoundingClientRect();
    root.current.style.setProperty(
      "--mx",
      ((e.clientX - r.left) / r.width - 0.5).toFixed(3),
    );
    root.current.style.setProperty(
      "--my",
      ((e.clientY - r.top) / r.height - 0.5).toFixed(3),
    );
  };
  const onLeave = () => {
    root.current?.style.setProperty("--mx", "0");
    root.current?.style.setProperty("--my", "0");
  };

  const line1 = ["Disconnect"];
  const line2 = ["to", "reconnect."];

  return (
    <section
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
      className="relative isolate overflow-hidden"
    >
      {/* Drifting colour fields */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="animate-drift absolute -left-24 top-10 h-72 w-72 rounded-full bg-(--cat-tech) opacity-25 blur-3xl sm:h-96 sm:w-96" />
        <div
          className="animate-drift absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-(--cat-beauty) opacity-25 blur-3xl sm:h-96 sm:w-96"
          style={{ animationDelay: "-6s", animationDuration: "22s" }}
        />
        <div
          className="animate-drift absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gold opacity-30 blur-3xl"
          style={{ animationDelay: "-12s", animationDuration: "26s" }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-10 pt-10 sm:px-6 sm:pt-14 lg:min-h-[calc(100svh-156px)] lg:grid-cols-12 lg:gap-10 lg:pb-8 lg:pt-6">
        {/* ---------- copy ---------- */}
        <div className="relative z-10 lg:col-span-6">
          <h1 className="font-serif text-[clamp(3.5rem,13.5vw,9rem)] font-light leading-[0.92] tracking-[-0.02em] text-ink lg:text-[clamp(4.5rem,8.4vw,9rem)]">
            <span className="block">
              {line1.map((w, i) => (
                <span
                  key={w}
                  className="mask-word"
                >
                  <span
                    className="animate-word-up"
                    style={{ animationDelay: `${150 + i * 110}ms` }}
                  >
                    {w}
                  </span>
                </span>
              ))}
            </span>
            <span className="block">
              {line2.map((w, i) => (
                <span
                  key={w}
                  className="mask-word mr-[0.2em] last:mr-0"
                >
                  <span
                    className="animate-word-up"
                    style={{ animationDelay: `${400 + i * 130}ms` }}
                  >
                    {w}
                  </span>
                </span>
              ))}
            </span>
            <span className="sr-only">
              Offline House. Top-selling tech, home, living, beauty and everyday
              essentials.
            </span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-[44ch] text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "850ms" }}
          >
            Chargers, cables and cases made to last, plus the home and everyday
            pieces that help you put the screen down.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "980ms" }}
          >
            <Link
              href="/collections/top-sellers"
              className={`group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-ink pl-8 pr-6 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
            >
              {/* gold fill sweeps in on hover */}
              <span
                aria-hidden="true"
                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
              />
              <span className="relative transition-colors duration-500 group-hover:text-ink">
                Shop top sellers
              </span>
              <span
                className={`relative grid h-8 w-8 place-items-center rounded-full bg-white/15 transition-all duration-500 ${EASE} group-hover:translate-x-1 group-hover:bg-ink group-hover:text-white`}
              >
                <ArrowIcon />
              </span>
            </Link>

            <Link
              href="/collections/deals"
              className={`inline-flex h-14 items-center rounded-full border border-ink/20 px-7 text-[15px] text-ink transition-all duration-500 ${EASE} hover:border-ink hover:bg-ink hover:text-white`}
            >
              See deals
            </Link>
          </div>

          {/* Category quick links */}
          <ul
            className="animate-fade-up mt-9 flex flex-wrap gap-2"
            style={{ animationDelay: "1100ms" }}
          >
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  style={{ "--accent": c.accent } as React.CSSProperties}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-line bg-white/50 px-4 py-2 text-sm text-ink backdrop-blur transition-colors duration-300 hover:border-(--accent)"
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 origin-bottom scale-y-0 bg-(--accent) opacity-25 transition-transform duration-500 ${EASE} group-hover:scale-y-100`}
                  />
                  <span
                    aria-hidden="true"
                    className="relative h-[7px] w-[7px] rounded-full bg-(--accent) transition-transform duration-500 group-hover:scale-150"
                  />
                  <span className="relative">{c.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- orbit ---------- */}
        <div className="relative z-0 lg:col-span-6">
          <div className="relative mx-auto aspect-square w-full max-w-[400px] sm:max-w-[540px] lg:max-w-[600px]">
            {/* soft disc */}
            <div
              aria-hidden="true"
              className="animate-disc-in absolute inset-[6%] rounded-full bg-[radial-gradient(circle_at_30%_25%,#fff_0%,var(--ivory)_45%,var(--stone)_100%)] shadow-[0_60px_120px_-50px_rgba(0,0,0,0.35)]"
            />

            {/* rings */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="animate-spin-slow absolute inset-0 h-full w-full"
              style={{ animationDuration: "60s" }}
            >
              <circle
                cx="50"
                cy="50"
                r="47"
                fill="none"
                stroke="var(--ink)"
                strokeOpacity="0.25"
                strokeWidth="0.25"
                strokeDasharray="0.6 2.2"
                strokeLinecap="round"
              />
            </svg>
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="animate-spin-rev absolute inset-0 h-full w-full"
              style={{ animationDuration: "90s" }}
            >
              <circle
                cx="50"
                cy="50"
                r="36"
                fill="none"
                stroke="var(--gold-deep)"
                strokeOpacity="0.55"
                strokeWidth="0.25"
              />
              <circle
                cx="50"
                cy="50"
                r="25"
                fill="none"
                stroke="var(--ink)"
                strokeOpacity="0.18"
                strokeWidth="0.25"
                strokeDasharray="1 3"
              />
            </svg>

            {/* orbiting dots */}
            <div
              aria-hidden="true"
              className="animate-spin-slow absolute inset-0"
              style={{ animationDuration: "18s" }}
            >
              <span className="absolute left-1/2 top-[3%] h-3 w-3 -translate-x-1/2 rounded-full bg-gold shadow-[0_0_0_6px_rgba(212,175,124,0.25)]" />
            </div>
            <div
              aria-hidden="true"
              className="animate-spin-rev absolute inset-[14%]"
              style={{ animationDuration: "26s" }}
            >
              <span className="absolute bottom-0 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-(--cat-tech)" />
            </div>
            <div
              aria-hidden="true"
              className="animate-spin-slow absolute inset-[27%]"
              style={{ animationDuration: "14s" }}
            >
              <span className="absolute right-0 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-(--cat-beauty)" />
            </div>

            {/* the cable draws itself in, then stays */}
            <svg
              aria-hidden="true"
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full overflow-visible"
            >
              <path
                d="M2 88 C 20 98, 30 70, 42 66 S 62 74, 58 58 S 36 52, 50 38"
                pathLength="1"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="0.9"
                strokeLinecap="round"
                className="animate-draw"
                style={{ animationDelay: "700ms" }}
              />
              <circle
                cx="50"
                cy="38"
                r="1.6"
                fill="var(--gold)"
                stroke="var(--ink)"
                strokeWidth="0.5"
                className="animate-fade-in"
                style={{ animationDelay: "2300ms" }}
              />
            </svg>

            {/* centre: logo with power pulse */}
            <div
              className="absolute left-1/2 top-1/2 h-[34%] w-[34%]"
              style={{
                transform:
                  "translate3d(calc(-50% + var(--mx) * 10px), calc(-50% + var(--my) * 10px), 0)",
              }}
            >
              <span
                aria-hidden="true"
                className="animate-pulse-ring absolute inset-0 rounded-full border border-gold"
              />
              <span
                aria-hidden="true"
                className="animate-pulse-ring absolute inset-0 rounded-full border border-gold"
                style={{ animationDelay: "1.4s" }}
              />
              <div className="animate-disc-in relative grid h-full w-full place-items-center rounded-full bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.3)]">
                <Image
                  src="/brand/logo-full.png"
                  alt=""
                  width={615}
                  height={350}
                  priority
                  className="h-auto w-[62%]"
                />
              </div>
            </div>

            {/* floating product tiles */}
            {TILES.map((t) => (
              <div
                key={t.label}
                className={`absolute ${t.pos}`}
                style={{
                  transform: `translate3d(calc(var(--mx) * ${t.depth}px), calc(var(--my) * ${t.depth}px), 0)`,
                  transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
                }}
              >
                <div
                  className="animate-float"
                  style={{ animationDuration: t.float }}
                >
                  <Link
                    href="/collections/top-sellers"
                    style={
                      {
                        animationDelay: `${t.enter}ms`,
                        "--accent": t.accent,
                      } as React.CSSProperties
                    }
                    className={`animate-tile-in group flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 p-2.5 pr-4 shadow-[0_24px_50px_-24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-500 ${EASE} hover:-translate-y-1 hover:scale-[1.04] sm:p-3 sm:pr-5`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-(--accent) text-ink transition-transform duration-500 group-hover:rotate-[-8deg] sm:h-11 sm:w-11">
                      <TileGlyph name={t.icon} />
                    </span>
                    <span className="block leading-tight">
                      <span className="block text-[13px] font-medium text-ink sm:text-sm">
                        {t.label}
                      </span>
                      <span className="hidden text-xs text-muted sm:block">
                        {t.note}
                      </span>
                    </span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-line bg-ivory/70 backdrop-blur">
        <ul className="mx-auto grid max-w-7xl gap-px px-5 py-5 sm:grid-cols-3 sm:px-6">
          {TRUST.map((item, i) => (
            <li
              key={item.title}
              className="animate-fade-up flex items-center gap-4 py-2 sm:px-4 sm:first:pl-0"
              style={{ animationDelay: `${1300 + i * 120}ms` }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-ink">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d={item.path} />
                </svg>
              </span>
              <span className="block leading-tight">
                <span className="block text-sm font-medium text-ink">
                  {item.title}
                </span>
                <span className="block text-xs text-muted">{item.body}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
