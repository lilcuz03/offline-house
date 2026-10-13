"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIES } from "../../lib/categories";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

// Desktop bento layout: the first category gets the tall feature tile.
const SPANS = [
  "sm:col-span-2 lg:col-span-6 lg:row-span-2",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-3",
];

function useInView<T extends HTMLElement>() {
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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

export default function CategoryShowcase() {
  const [gridRef, seen] = useInView<HTMLUListElement>();

  return (
    <section
      aria-labelledby="categories-heading"
      className="relative"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          <h2
            id="categories-heading"
            className="max-w-[16ch] font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
          >
            Pick a corner of the house.
          </h2>
          <Link
            href="/collections/top-sellers"
            className="group inline-flex items-center gap-3 border-b border-ink pb-1 text-sm text-ink"
          >
            Shop top sellers
            <span
              aria-hidden="true"
              className={`transition-transform duration-500 ${EASE} group-hover:translate-x-1.5`}
            >
              →
            </span>
          </Link>
        </div>

        <ul
          ref={gridRef}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:auto-rows-[minmax(260px,auto)] lg:grid-cols-12 lg:gap-5"
        >
          {CATEGORIES.map((c, i) => {
            const feature = i === 0;
            return (
              <li
                key={c.slug}
                data-in={seen}
                style={
                  {
                    "--accent": c.accent,
                    transitionDelay: `${i * 110}ms`,
                  } as React.CSSProperties
                }
                className={`reveal-tile ${SPANS[i] ?? "lg:col-span-3"}`}
              >
                <article
                  className={`group relative isolate flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] border border-line bg-white/60 p-6 transition-[transform,box-shadow,border-color] duration-700 ${EASE} hover:-translate-y-1 hover:border-transparent hover:shadow-[0_40px_80px_-40px_rgba(0,0,0,0.35)] sm:p-8 ${
                    feature ? "lg:min-h-[540px] lg:p-10" : ""
                  }`}
                >
                  {/* The accent bloom: a small dot that floods the whole tile on hover */}
                  <span
                    aria-hidden="true"
                    className={`absolute -right-10 -top-10 -z-10 h-24 w-24 rounded-full bg-(--accent) transition-transform duration-[900ms] ${EASE} group-hover:scale-[14] group-focus-within:scale-[14] ${
                      feature ? "sm:h-32 sm:w-32" : ""
                    }`}
                  />
                  {/* Orbit lines that spin up on hover */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    className={`pointer-events-none absolute -bottom-16 -right-16 -z-10 h-56 w-56 text-ink/15 transition-transform duration-[1400ms] ${EASE} group-hover:rotate-[60deg] group-hover:scale-110 ${
                      feature
                        ? "lg:-bottom-24 lg:-right-24 lg:h-96 lg:w-96"
                        : ""
                    }`}
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="48"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.4"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="34"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.4"
                      strokeDasharray="1 3"
                    />
                    <circle
                      cx="50"
                      cy="2"
                      r="2.2"
                      fill="currentColor"
                    />
                  </svg>

                  <div>
                    <h3
                      className={`font-serif font-light leading-none text-ink ${
                        feature
                          ? "text-5xl sm:text-6xl lg:text-7xl"
                          : "text-4xl sm:text-5xl"
                      }`}
                    >
                      {/* Stretched link: the whole tile is clickable */}
                      <Link
                        href={`/collections/${c.slug}`}
                        className="after:absolute after:inset-0 after:z-0 after:content-[''] focus-visible:outline-none"
                      >
                        {c.label}
                      </Link>
                    </h3>
                    <p
                      className={`mt-3 max-w-[30ch] text-sm leading-relaxed text-ink/70 ${
                        feature ? "sm:text-base" : ""
                      }`}
                    >
                      {c.tagline}
                    </p>
                  </div>

                  <div className="relative z-10 mt-8 flex items-end justify-between gap-4">
                    <ul className="flex flex-wrap gap-2">
                      {c.children.slice(0, feature ? 6 : 3).map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={`/collections/${child.slug}`}
                            className="inline-block rounded-full border border-ink/15 bg-white/70 px-3.5 py-1.5 text-xs text-ink backdrop-blur transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                    <span
                      aria-hidden="true"
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-ink text-white transition-transform duration-500 ${EASE} group-hover:-rotate-45 group-hover:scale-110`}
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
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </span>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
