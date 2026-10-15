"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../lib/categories";

type Social = { label: string; href: string };

type FooterProps = {
  /** Replace the placeholder links with your real profiles. */
  socials?: Social[];
  email?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/* Update these routes to match the pages you build. */
const HELP_LINKS = [
  { label: "Track your order", href: "/track-order" },
  { label: "Delivery", href: "/delivery" },
  { label: "Returns and refunds", href: "/returns" },
  { label: "Contact us", href: "/contact" },
  { label: "Help centre", href: "/help" },
];

const COMPANY_LINKS = [
  { label: "Our story", href: "/about" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of service", href: "/terms" },
];

/* PLACEHOLDERS: these point at the platforms' home pages, not your profiles. */
const DEFAULT_SOCIALS: Social[] = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "TikTok", href: "https://www.tiktok.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
];

const social = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function SocialIcon({ label }: { label: string }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    ...social,
  };
  switch (label.toLowerCase()) {
    case "instagram":
      return (
        <svg {...common}>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="5"
          />
          <circle
            cx="12"
            cy="12"
            r="3.6"
          />
          <circle
            cx="16.8"
            cy="7.3"
            r="0.6"
            fill="currentColor"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common}>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" />
          <path d="M14 4c.3 2.3 1.8 3.8 4.5 4" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14 8.5h2.5V5H14a3.5 3.5 0 0 0-3.5 3.5V11H8v3.5h2.5V20H14v-5.5h2.3l.5-3.5H14V9.2c0-.4.3-.7.7-.7Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle
            cx="12"
            cy="12"
            r="8"
          />
          <path d="M4 12h16M12 4c2.5 2.3 2.5 13.7 0 16M12 4c-2.5 2.3-2.5 13.7 0 16" />
        </svg>
      );
  }
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative inline-block py-1.5 text-[15px] text-white/70 transition-colors duration-300 hover:text-white"
    >
      {children}
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 bottom-0.5 h-px origin-left scale-x-0 bg-gold transition-transform duration-500 ${EASE} group-hover:scale-x-100`}
      />
    </Link>
  );
}

export default function Footer({
  socials = DEFAULT_SOCIALS,
  email,
}: FooterProps) {
  const mark = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState<number>();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setYear(new Date().getFullYear());
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // The wordmark is lit by a gold spotlight that follows the cursor.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !mark.current) return;
    const r = mark.current.getBoundingClientRect();
    mark.current.style.setProperty("--fx", `${e.clientX - r.left}px`);
    mark.current.style.setProperty("--fy", `${e.clientY - r.top}px`);
  };
  const onLeave = () => {
    mark.current?.style.setProperty("--fx", "50%");
    mark.current?.style.setProperty("--fy", "50%");
  };

  const toTop = () => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <footer className="mx-2 mt-4 overflow-hidden rounded-t-[32px] bg-ink text-white sm:mx-4 sm:rounded-t-[48px]">
      <div className="mx-auto max-w-7xl px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-5">
            <p className="font-serif text-4xl font-light leading-none sm:text-5xl">
              Disconnect to reconnect.
            </p>
            <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-white/65">
              Tech that keeps up, and home pieces that help you put it down.
            </p>

            {email && (
              <a
                href={`mailto:${email}`}
                className="mt-6 inline-block border-b border-white/40 pb-1 text-sm text-white transition-colors hover:border-gold hover:text-gold"
              >
                {email}
              </a>
            )}

            {socials.length > 0 && (
              <ul
                aria-label="Social media"
                className="mt-8 flex gap-3"
              >
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className={`grid h-12 w-12 place-items-center rounded-full border border-white/20 text-white transition-all duration-500 ${EASE} hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-ink`}
                    >
                      <SocialIcon label={s.label} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-7 lg:pl-10">
            <nav aria-label="Shop">
              <h2 className="text-sm text-white/45">Shop</h2>
              <ul className="mt-4">
                <li>
                  <FooterLink href="/collections/top-sellers">
                    Top sellers
                  </FooterLink>
                </li>
                {CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <FooterLink href={`/collections/${c.slug}`}>
                      {c.label}
                    </FooterLink>
                  </li>
                ))}
                <li>
                  <FooterLink href="/collections/deals">Deals</FooterLink>
                </li>
              </ul>
            </nav>

            <nav aria-label="Help">
              <h2 className="text-sm text-white/45">Help</h2>
              <ul className="mt-4">
                {HELP_LINKS.map((l) => (
                  <li key={l.href}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>

            <nav
              aria-label="Company"
              className="col-span-2 sm:col-span-1"
            >
              <h2 className="text-sm text-white/45">Company</h2>
              <ul className="mt-4">
                {COMPANY_LINKS.map((l) => (
                  <li key={l.href}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-t border-white/15 py-6 text-sm text-white/55">
          <div className="space-y-1.5">
            <p>
              © {year} Offline House. All prices in South African rand (ZAR).
            </p>
            <p>
              Developed by{" "}
              <a
                href="https://tafadzwa.site/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 underline decoration-white/25 underline-offset-4 transition-colors hover:text-gold hover:decoration-gold"
              >
                taachii
              </a>
              <br />
            </p>
          </div>
          <button
            type="button"
            onClick={toTop}
            className="group inline-flex items-center gap-3 text-white/80 transition-colors hover:text-white"
          >
            Back to top
            <span
              aria-hidden="true"
              className={`grid h-11 w-11 place-items-center rounded-full border border-white/25 transition-all duration-500 ${EASE} group-hover:-translate-y-1 group-hover:border-gold group-hover:bg-gold group-hover:text-ink`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Giant wordmark with a cursor-following gold spotlight */}
      <div
        ref={mark}
        aria-hidden="true"
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{ "--fx": "50%", "--fy": "50%" } as React.CSSProperties}
        className="select-none overflow-hidden px-2 pb-2 text-center sm:pb-4"
      >
        <p
          className="whitespace-nowrap font-serif text-[clamp(3rem,13.2vw,14rem)] font-light leading-[0.95] tracking-[-0.03em] text-transparent"
          style={{
            backgroundImage:
              "radial-gradient(circle 260px at var(--fx) var(--fy), var(--gold), rgba(255,255,255,0.09))",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          Offline House
        </p>
      </div>
    </footer>
  );
}
