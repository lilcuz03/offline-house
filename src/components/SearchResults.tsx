"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "../components/home/bestseller";
import ProductCard from "./ProductCard";
import { CATEGORIES, POPULAR_SEARCHES } from "../lib/categories";

type SearchResultsProps = {
  /** The search term from the URL (?q=). */
  query: string;
  products: Product[];
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const SearchIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle
      cx="11"
      cy="11"
      r="6.5"
    />
    <path d="m20 20-4.2-4.2" />
  </svg>
);

export default function SearchResults({ query, products }: SearchResultsProps) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  const term = query.trim();
  const hasQuery = term.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = value.trim();
    if (!next) return;
    router.push(`/search?q=${encodeURIComponent(next)}`);
  };

  return (
    <section
      aria-labelledby="search-heading"
      className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16"
    >
      <h1
        id="search-heading"
        className="font-serif text-[clamp(2.5rem,7vw,5.5rem)] font-light leading-[0.98] tracking-[-0.02em] text-ink"
      >
        {hasQuery ? (
          <>
            {products.length > 0 ? "Results for" : "No results for"}{" "}
            <span className="break-words">&ldquo;{term}&rdquo;</span>
          </>
        ) : (
          "Search Offline House"
        )}
      </h1>

      {/* Refine */}
      <form
        role="search"
        onSubmit={submit}
        className="mt-8 max-w-2xl"
      >
        <label
          htmlFor="refine-search"
          className="sr-only"
        >
          Search products
        </label>
        <div className="flex items-center gap-3 border-b-2 border-ink pb-3 text-ink">
          <SearchIcon />
          <input
            id="refine-search"
            type="search"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Search chargers, cables, cases"
            autoComplete="off"
            className="w-full bg-transparent text-xl placeholder:text-muted/70 focus:outline-none sm:text-2xl"
          />
          <button
            type="submit"
            className={`h-11 shrink-0 rounded-full bg-ink px-6 text-sm text-white transition-all duration-500 ${EASE} hover:bg-gold hover:text-ink`}
          >
            Search
          </button>
        </div>
      </form>

      {hasQuery && products.length > 0 && (
        <p
          aria-live="polite"
          className="mt-6 text-sm text-muted"
        >
          {products.length} {products.length === 1 ? "product" : "products"}{" "}
          found
        </p>
      )}

      {/* Results */}
      {hasQuery && products.length > 0 && (
        <ul
          key={term}
          className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4"
        >
          {products.map((p, i) => (
            <li
              key={p.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 11) * 55}ms` }}
            >
              <ProductCard
                product={p}
                priority={i < 4}
              />
            </li>
          ))}
        </ul>
      )}

      {/* Empty or no query: guide them somewhere useful */}
      {(!hasQuery || products.length === 0) && (
        <div className="animate-fade-up mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-light text-ink">
              {hasQuery ? "Try one of these" : "Popular right now"}
            </h2>
            {hasQuery && (
              <p className="mt-2 text-muted">
                Check the spelling, or search for something broader like
                &ldquo;charger&rdquo;.
              </p>
            )}
            <ul className="mt-5 flex flex-wrap gap-2">
              {POPULAR_SEARCHES.map((t) => (
                <li key={t}>
                  <Link
                    href={`/search?q=${encodeURIComponent(t)}`}
                    className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {t}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-serif text-3xl font-light text-ink">
              Or browse a category
            </h2>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {CATEGORIES.map((c) => (
                <li
                  key={c.slug}
                  style={{ "--accent": c.accent } as React.CSSProperties}
                >
                  <Link
                    href={`/collections/${c.slug}`}
                    className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-line bg-white/60 px-5 py-4 text-[15px] text-ink transition-colors duration-300 hover:border-(--accent)"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 origin-left scale-x-0 bg-(--accent) opacity-25 transition-transform duration-500 ${EASE} group-hover:scale-x-100`}
                    />
                    <span
                      aria-hidden="true"
                      className="relative h-2 w-2 rounded-full bg-(--accent)"
                    />
                    <span className="relative">{c.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
