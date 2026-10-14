"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "../lib/categories";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function NotFoundView() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <section
      aria-labelledby="not-found-heading"
      className="relative isolate overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <span className="animate-drift absolute -left-20 top-10 h-80 w-80 rounded-full bg-(--cat-tech) opacity-20 blur-3xl" />
        <span
          className="animate-drift absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-gold opacity-25 blur-3xl"
          style={{ animationDelay: "-9s", animationDuration: "24s" }}
        />
      </div>

      <div className="mx-auto flex max-w-4xl flex-col items-center px-5 pb-28 pt-12 text-center sm:px-6 sm:pt-20">
        {/* 404 with an unplugged cable: the 0 is the socket */}
        <div
          aria-hidden="true"
          className="relative flex items-center justify-center font-serif text-[clamp(7rem,28vw,17rem)] font-light leading-none tracking-[-0.04em] text-ink"
        >
          <span className="animate-fade-up">4</span>

          <span
            className="animate-fade-up relative mx-[0.04em] grid aspect-square w-[0.72em] place-items-center"
            style={{ animationDelay: "120ms" }}
          >
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
            >
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="var(--ink)"
                strokeWidth="5"
              />
              <rect
                x="30"
                y="38"
                width="10"
                height="9"
                rx="3"
                fill="var(--ink)"
              />
              <rect
                x="30"
                y="54"
                width="10"
                height="9"
                rx="3"
                fill="var(--ink)"
              />
              <circle
                cx="66"
                cy="50"
                r="5"
                fill="var(--stone)"
              >
                <animate
                  attributeName="fill"
                  values="var(--stone);var(--sale);var(--stone)"
                  dur="2.4s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>

            {/* the plug hovers just out of reach */}
            <span
              className="animate-float absolute -left-[78%] top-1/2 w-[70%] -translate-y-1/2"
              style={{ animationDuration: "5s" }}
            >
              <svg
                viewBox="0 0 70 30"
                className="h-auto w-full overflow-visible"
              >
                <path
                  d="M0 15c10 0 10-8 20-8"
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <rect
                  x="20"
                  y="3"
                  width="26"
                  height="24"
                  rx="7"
                  fill="var(--ink)"
                />
                <rect
                  x="46"
                  y="8"
                  width="18"
                  height="4"
                  rx="2"
                  fill="var(--ink)"
                />
                <rect
                  x="46"
                  y="18"
                  width="18"
                  height="4"
                  rx="2"
                  fill="var(--ink)"
                />
                <path
                  d="M66 5l-3 6h5l-3 6"
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <animate
                    attributeName="opacity"
                    values="0;1;0;0"
                    dur="2.4s"
                    repeatCount="indefinite"
                  />
                </path>
              </svg>
            </span>
          </span>

          <span
            className="animate-fade-up"
            style={{ animationDelay: "240ms" }}
          >
            4
          </span>
        </div>

        <h1
          id="not-found-heading"
          className="mt-8 font-serif text-[clamp(2.25rem,6vw,4.5rem)] font-light leading-[1] tracking-[-0.01em] text-ink"
        >
          <span className="mask-word">
            <span
              className="animate-word-up"
              style={{ animationDelay: "350ms" }}
            >
              This page is offline.
            </span>
          </span>
        </h1>
        <p
          className="animate-fade-up mt-5 max-w-[44ch] text-base leading-relaxed text-muted sm:text-lg"
          style={{ animationDelay: "520ms" }}
        >
          The link might be broken, or the page may have moved. Search for what
          you were after, or pick a corner of the shop.
        </p>

        <form
          role="search"
          onSubmit={submit}
          className="animate-fade-up mt-10 w-full max-w-xl"
          style={{ animationDelay: "640ms" }}
        >
          <label
            htmlFor="nf-search"
            className="sr-only"
          >
            Search products
          </label>
          <div className="flex items-center gap-2 rounded-full border border-line bg-white/70 p-1.5 transition-colors duration-300 focus-within:border-ink">
            <input
              id="nf-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chargers, cables, cases"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
            />
            <button
              type="submit"
              className={`group relative h-12 shrink-0 overflow-hidden rounded-full bg-ink px-7 text-sm text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.97]`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
              />
              <span className="relative transition-colors duration-500 group-hover:text-ink">
                Search
              </span>
            </button>
          </div>
        </form>

        <ul
          className="animate-fade-up mt-8 flex flex-wrap justify-center gap-2"
          style={{ animationDelay: "760ms" }}
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
                  className="relative h-[7px] w-[7px] rounded-full bg-(--accent)"
                />
                <span className="relative">{c.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/"
          className="animate-fade-up mt-10 text-sm text-ink underline underline-offset-4 transition-colors hover:text-gold-deep"
          style={{ animationDelay: "880ms" }}
        >
          Back to the homepage
        </Link>
      </div>
    </section>
  );
}
