"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { CATEGORIES } from "../../lib/categories";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* ---------- pictures around the logo ----------
   Drop your photos in /public/hero/ and point `src` at them.
   Until a file exists, the tile falls back to a coloured block with an icon,
   so nothing looks broken while you add images.
   `pos` holds the breakpoint visibility + placement + size (lg and up).
   The first 4 are also shown as a strip on mobile / tablet. */

type Glyph =
  | "charger"
  | "cable"
  | "case"
  | "earbuds"
  | "powerbank"
  | "lamp"
  | "kitchen"
  | "skincare";

const PICS: {
  label: string;
  href: string;
  src: string;
  icon: Glyph;
  accent: string;
  pos: string;
  rotate: number;
  depth: number;
  float: string;
  enter: number;
}[] = [
  {
    label: "GaN chargers",
    href: "/collections/chargers-adapters",
    src: "/hero/charger.jpg",
    icon: "charger",
    accent: "var(--cat-tech)",
    pos: "hidden lg:block left-0 top-[3%] h-52 w-40",
    rotate: -6,
    depth: 34,
    float: "7s",
    enter: 300,
  },
  {
    label: "Braided cables",
    href: "/collections/cables-usb",
    src: "/hero/cable.jpg",
    icon: "cable",
    accent: "var(--gold)",
    pos: "hidden lg:block right-0 top-[6%] h-44 w-44",
    rotate: 6,
    depth: -28,
    float: "8s",
    enter: 450,
  },
  {
    label: "Phone cases",
    href: "/collections/phone-cases",
    src: "/hero/case.jpg",
    icon: "case",
    accent: "var(--cat-beauty)",
    pos: "hidden lg:block left-[3%] top-[40%] h-44 w-36",
    rotate: 4,
    depth: -40,
    float: "9s",
    enter: 600,
  },
  {
    label: "Earbuds",
    href: "/collections/earbuds-audio",
    src: "/hero/earbuds.jpg",
    icon: "earbuds",
    accent: "var(--cat-essentials)",
    pos: "hidden lg:block right-[3%] top-[38%] h-52 w-40",
    rotate: -4,
    depth: 24,
    float: "6.5s",
    enter: 750,
  },
  {
    label: "Power banks",
    href: "/collections/power-banks",
    src: "/hero/powerbank.jpg",
    icon: "powerbank",
    accent: "var(--cat-tech)",
    pos: "hidden lg:block left-0 bottom-[2%] h-40 w-40",
    rotate: -3,
    depth: 30,
    float: "7.5s",
    enter: 900,
  },
  {
    label: "Skincare tools",
    href: "/collections/skincare-tools",
    src: "/hero/skincare.jpg",
    icon: "skincare",
    accent: "var(--cat-beauty)",
    pos: "hidden lg:block right-0 bottom-[2%] h-44 w-36",
    rotate: 5,
    depth: -34,
    float: "8.5s",
    enter: 1050,
  },
  {
    label: "Lighting",
    href: "/collections/lighting",
    src: "/hero/lamp.jpg",
    icon: "lamp",
    accent: "var(--gold)",
    pos: "hidden xl:block left-[19%] top-0 h-28 w-28",
    rotate: 8,
    depth: -22,
    float: "6s",
    enter: 1200,
  },
  {
    label: "Kitchen",
    href: "/collections/kitchen",
    src: "/hero/kitchen.jpg",
    icon: "kitchen",
    accent: "var(--cat-essentials)",
    pos: "hidden xl:block right-[19%] bottom-0 h-28 w-28",
    rotate: -8,
    depth: 22,
    float: "7s",
    enter: 1350,
  },
];

function PicGlyph({ name, size = 22 }: { name: Glyph; size?: number }) {
  const common = {
    width: size,
    height: size,
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
    case "powerbank":
      return (
        <svg {...common}>
          <rect
            x="5"
            y="8"
            width="14"
            height="10"
            rx="2"
          />
          <path d="M9 8V6h6v2" />
          <path d="m12.6 10.5-1.8 2.5h2.4l-1.8 2.5" />
        </svg>
      );
    case "lamp":
      return (
        <svg {...common}>
          <path d="M8 4h8l3 9H5l3-9Z" />
          <path d="M12 13v6M9 20h6" />
        </svg>
      );
    case "kitchen":
      return (
        <svg {...common}>
          <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
          <path d="M16 10h2a2 2 0 0 1 0 4h-2" />
        </svg>
      );
    case "skincare":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
        </svg>
      );
  }
}

/* One picture tile: photo with a coloured offset block behind it. */
function PicCard({
  pic,
  compact = false,
  className = "",
}: {
  pic: (typeof PICS)[number];
  compact?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={pic.href}
      aria-label={pic.label}
      style={
        {
          "--accent": pic.accent,
          rotate: compact ? undefined : `${pic.rotate}deg`,
        } as React.CSSProperties
      }
      className={`group relative block ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-(--accent) transition-transform duration-500 ${EASE} group-hover:translate-x-3 group-hover:translate-y-3`}
      />
      <span className="relative block h-full w-full overflow-hidden rounded-3xl border-4 border-white bg-white shadow-[0_24px_50px_-24px_rgba(0,0,0,0.4)]">
        {failed ? (
          <span className="grid h-full w-full place-items-center bg-(--accent) text-ink">
            <PicGlyph
              name={pic.icon}
              size={compact ? 24 : 40}
            />
          </span>
        ) : (
          <Image
            src={pic.src}
            alt=""
            fill
            sizes="(min-width: 1024px) 176px, 25vw"
            onError={() => setFailed(true)}
            className={`object-cover transition-transform duration-700 ${EASE} group-hover:scale-105`}
          />
        )}
        {!compact && (
          <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-ink backdrop-blur">
            {pic.label}
          </span>
        )}
      </span>
    </Link>
  );
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

  return (
    <section
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ "--mx": 0, "--my": 0 } as React.CSSProperties}
      className="relative isolate overflow-hidden bg-[linear-gradient(135deg,var(--ivory)_0%,color-mix(in_srgb,var(--gold)_45%,white)_55%,color-mix(in_srgb,var(--cat-beauty)_40%,white)_100%)]"
    >
      {/* Colour fields */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="animate-drift absolute -left-24 top-10 h-72 w-72 rounded-full bg-(--cat-tech) opacity-40 blur-3xl sm:h-96 sm:w-96" />
        <div
          className="animate-drift absolute -right-20 top-1/3 h-72 w-72 rounded-full bg-(--cat-beauty) opacity-40 blur-3xl sm:h-96 sm:w-96"
          style={{ animationDelay: "-6s", animationDuration: "22s" }}
        />
        <div
          className="animate-drift absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-gold opacity-50 blur-3xl"
          style={{ animationDelay: "-12s", animationDuration: "26s" }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-12 pt-8 sm:px-6 lg:min-h-[calc(100svh-156px)] lg:pb-10 lg:pt-10">
        {/* Mobile / tablet strip */}
        <ul className="mb-10 grid grid-cols-4 gap-3 pr-2 lg:hidden">
          {PICS.slice(0, 4).map((p) => (
            <li key={p.label}>
              <PicCard
                pic={p}
                compact
                className="aspect-square w-full"
              />
            </li>
          ))}
        </ul>

        {/* Pictures around the centre (lg and up) */}
        {PICS.map((p) => (
          <div
            key={p.label}
            className={`absolute z-0 ${p.pos}`}
            style={{
              transform: `translate3d(calc(var(--mx) * ${p.depth}px), calc(var(--my) * ${p.depth}px), 0)`,
              transition: "transform 0.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            <div
              className="animate-float"
              style={{ animationDuration: p.float }}
            >
              <div
                className="animate-tile-in"
                style={{ animationDelay: `${p.enter}ms` }}
              >
                <PicCard
                  pic={p}
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        ))}

        {/* Centre: logo, store name, actions */}
        <div className="relative z-10 mx-auto flex max-w-[36rem] flex-col items-center text-center lg:min-h-[calc(100svh-156px-5rem)] lg:justify-center">
          {/* logo lockup: OH with the store name directly beneath */}
          <div className="relative h-52 w-52 sm:h-64 sm:w-64">
            <span
              aria-hidden="true"
              className="animate-pulse-ring absolute inset-0 rounded-full border border-gold"
            />
            <span
              aria-hidden="true"
              className="animate-pulse-ring absolute inset-0 rounded-full border border-gold"
              style={{ animationDelay: "1.4s" }}
            />
            <div className="animate-disc-in relative flex h-full w-full flex-col items-center justify-center rounded-full bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.3)] ring-4 ring-gold/60">
              {/* Slogan running round the inside edge, turning slowly */}
              <svg
                viewBox="0 0 200 200"
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 h-full w-full animate-[spin_45s_linear_infinite] motion-reduce:animate-none"
              >
                <defs>
                  <path
                    id="slogan-ring"
                    d="M100,100 m-88,0 a88,88 0 1,1 176,0 a88,88 0 1,1 -176,0"
                  />
                </defs>
                <text
                  fontSize="10.5"
                  fontWeight="500"
                  style={{ fill: "var(--gold-deep)" }}
                >
                  <textPath
                    href="#slogan-ring"
                    textLength="552"
                    lengthAdjust="spacing"
                  >
                    DISCONNECT TO RECONNECT • DISCONNECT TO RECONNECT •{" "}
                  </textPath>
                </text>
              </svg>
              <Image
                src="/brand/logo-full.png"
                alt=""
                width={615}
                height={350}
                priority
                className="relative h-auto w-[50%]"
              />
              <h1 className="relative -mt-1 pl-[0.26em] font-serif text-[0.7rem] font-medium uppercase tracking-[0.26em] text-ink sm:text-[0.8rem]">
                Offline House
                <span className="sr-only">
                  . Top-selling tech, home, living, beauty and everyday
                  essentials.
                </span>
              </h1>
            </div>
          </div>

          <p
            className="animate-fade-up mt-8 max-w-[44ch] text-base leading-relaxed text-ink/70 sm:text-lg"
            style={{ animationDelay: "600ms" }}
          >
            Chargers, cables and cases made to last, plus the home and everyday
            pieces that help you put the screen down.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "750ms" }}
          >
            <Link
              href="/collections/top-sellers"
              className={`group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-ink pl-8 pr-6 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
            >
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
              className={`inline-flex h-14 items-center rounded-full border border-ink/30 bg-white/40 px-7 text-[15px] text-ink backdrop-blur transition-all duration-500 ${EASE} hover:border-ink hover:bg-ink hover:text-white`}
            >
              See deals
            </Link>
          </div>

          {/* Category quick links */}
          <ul
            className="animate-fade-up mt-9 flex flex-wrap justify-center gap-2"
            style={{ animationDelay: "900ms" }}
          >
            {CATEGORIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/collections/${c.slug}`}
                  style={{ "--accent": c.accent } as React.CSSProperties}
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-line bg-white/60 px-4 py-2 text-sm text-ink backdrop-blur transition-colors duration-300 hover:border-(--accent)"
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
      </div>

      {/* Trust bar */}
      <div className="border-t border-line bg-ivory/70 backdrop-blur">
        <ul className="mx-auto grid max-w-7xl gap-px px-5 py-5 sm:grid-cols-3 sm:px-6">
          {TRUST.map((item, i) => (
            <li
              key={item.title}
              className="animate-fade-up flex items-center gap-4 py-2 sm:px-4 sm:first:pl-0"
              style={{ animationDelay: `${1100 + i * 120}ms` }}
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
