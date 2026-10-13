"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "../components/home/bestseller";
import ProductCard from "./ProductCard";

type Crumb = { label: string; href?: string };

type CollectionViewProps = {
  title: string;
  tagline?: string;
  products: Product[];
  breadcrumbs?: Crumb[];
  /** Sub-collection links shown as chips under the title. */
  subcollections?: { label: string; href: string }[];
  /** Colour of the glow behind the title, e.g. "var(--cat-tech)". */
  accent?: string;
};

type SortKey = "featured" | "price-asc" | "price-desc" | "name" | "discount";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const PAGE_SIZE = 12;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "discount", label: "Biggest discount" },
  { key: "name", label: "Name: A to Z" },
];

const BANDS = [
  { id: "u200", label: "Under R200", min: 0, max: 200 },
  { id: "200-500", label: "R200 to R500", min: 200, max: 500 },
  { id: "500-1000", label: "R500 to R1 000", min: 500, max: 1000 },
  { id: "o1000", label: "R1 000 and over", min: 1000, max: Infinity },
];

type Filters = {
  bands: string[];
  cats: string[];
  sale: boolean;
};

const EMPTY: Filters = { bands: [], cats: [], sale: false };

const discountOf = (p: Product) =>
  p.compareAtPrice && p.compareAtPrice > p.price
    ? 1 - p.price / p.compareAtPrice
    : 0;

/* ---------- filter controls, shared by sidebar and mobile sheet ---------- */

function Check({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5 text-[15px] text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep ${
          checked
            ? "border-ink bg-ink text-white"
            : "border-ink/30 group-hover:border-ink"
        }`}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-300 ${
            checked ? "scale-100" : "scale-0"
          }`}
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      {children}
    </label>
  );
}

function FilterPanel({
  filters,
  setFilters,
  categories,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  categories: string[];
}) {
  const toggle = (key: "bands" | "cats", value: string) =>
    setFilters({
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    });

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-2 font-serif text-2xl font-light text-ink">
          Price
        </legend>
        {BANDS.map((b) => (
          <Check
            key={b.id}
            checked={filters.bands.includes(b.id)}
            onChange={() => toggle("bands", b.id)}
          >
            {b.label}
          </Check>
        ))}
      </fieldset>

      {categories.length > 1 && (
        <fieldset>
          <legend className="mb-2 font-serif text-2xl font-light text-ink">
            Category
          </legend>
          {categories.map((c) => (
            <Check
              key={c}
              checked={filters.cats.includes(c)}
              onChange={() => toggle("cats", c)}
            >
              {c}
            </Check>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 font-serif text-2xl font-light text-ink">
          Offers
        </legend>
        <Check
          checked={filters.sale}
          onChange={() => setFilters({ ...filters, sale: !filters.sale })}
        >
          On sale
        </Check>
      </fieldset>
    </div>
  );
}

/* ---------- main ---------- */

export default function CollectionView({
  title,
  tagline,
  products,
  breadcrumbs,
  subcollections,
  accent = "var(--gold)",
}: CollectionViewProps) {
  const [sort, setSort] = useState<SortKey>("featured");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  // How many products are visible, remembered together with the filters it
  // belongs to. When the filters change the count falls back to one page
  // automatically, with no effect needed to reset it.
  const [pager, setPager] = useState({ sig: "", count: PAGE_SIZE });
  const [sheet, setSheet] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          products.map((p) => p.category).filter((c): c is string => !!c),
        ),
      ),
    [products],
  );

  const results = useMemo(() => {
    const bands = BANDS.filter((b) => filters.bands.includes(b.id));
    const list = products.filter((p) => {
      if (
        bands.length &&
        !bands.some((b) => p.price >= b.min && p.price < b.max)
      )
        return false;
      if (filters.cats.length && !filters.cats.includes(p.category ?? ""))
        return false;
      if (filters.sale && discountOf(p) === 0) return false;
      return true;
    });
    const sorted = [...list];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        sorted.sort((a, b) => b.price - a.price);
        break;
      case "discount":
        sorted.sort((a, b) => discountOf(b) - discountOf(a));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [products, filters, sort]);

  const signature = `${sort}|${filters.bands.join()}|${filters.cats.join()}|${filters.sale}`;
  const shown = pager.sig === signature ? pager.count : PAGE_SIZE;

  /* Sheet: scroll lock, Esc, focus */
  useEffect(() => {
    if (!sheet) return;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => closeBtn.current?.focus(), 100);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [sheet]);

  const activeCount =
    filters.bands.length + filters.cats.length + (filters.sale ? 1 : 0);
  const visible = results.slice(0, shown);

  const chips: { label: string; remove: () => void }[] = [
    ...filters.bands.map((id) => ({
      label: BANDS.find((b) => b.id === id)?.label ?? id,
      remove: () =>
        setFilters({
          ...filters,
          bands: filters.bands.filter((b) => b !== id),
        }),
    })),
    ...filters.cats.map((c) => ({
      label: c,
      remove: () =>
        setFilters({ ...filters, cats: filters.cats.filter((x) => x !== c) }),
    })),
    ...(filters.sale
      ? [
          {
            label: "On sale",
            remove: () => setFilters({ ...filters, sale: false }),
          },
        ]
      : []),
  ];

  return (
    <div>
      {/* Title block */}
      <header className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full opacity-40 blur-3xl sm:h-[28rem] sm:w-[28rem]"
          style={{ background: accent }}
        />
        <div className="mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-6 sm:pb-12 sm:pt-12">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb">
              <ol className="flex flex-wrap items-center gap-2 text-sm text-muted">
                {breadcrumbs.map((c, i) => (
                  <li
                    key={c.label}
                    className="flex items-center gap-2"
                  >
                    {c.href ? (
                      <Link
                        href={c.href}
                        className="transition-colors hover:text-ink"
                      >
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        aria-current="page"
                        className="text-ink"
                      >
                        {c.label}
                      </span>
                    )}
                    {i < breadcrumbs.length - 1 && (
                      <span aria-hidden="true">/</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="mt-5 font-serif text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] tracking-[-0.02em] text-ink">
            <span className="mask-word">
              <span className="animate-word-up">{title}</span>
            </span>
          </h1>
          {tagline && (
            <p
              className="animate-fade-up mt-4 max-w-[48ch] text-base leading-relaxed text-muted sm:text-lg"
              style={{ animationDelay: "250ms" }}
            >
              {tagline}
            </p>
          )}
          {subcollections && subcollections.length > 0 && (
            <ul
              className="animate-fade-up mt-7 flex flex-wrap gap-2"
              style={{ animationDelay: "350ms" }}
            >
              {subcollections.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="inline-block rounded-full border border-line bg-white/60 px-4 py-2 text-sm text-ink backdrop-blur transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-6">
        {/* Toolbar */}
        <div className="sticky top-0 z-20 -mx-5 flex items-center justify-between gap-4 border-y border-line bg-ivory/90 px-5 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-line px-5 text-sm text-ink transition-colors hover:border-ink lg:hidden"
            >
              Filters
              {activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[11px] text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <p
              aria-live="polite"
              className="text-sm text-muted"
            >
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
          </div>

          <label className="flex items-center gap-3 text-sm text-muted">
            <span className="hidden sm:inline">Sort by</span>
            <span className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-11 cursor-pointer appearance-none rounded-full border border-line bg-white/60 pl-5 pr-10 text-sm text-ink transition-colors hover:border-ink focus:outline-none focus-visible:border-ink"
              >
                {SORTS.map((s) => (
                  <option
                    key={s.key}
                    value={s.key}
                  >
                    {s.label}
                  </option>
                ))}
              </select>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink"
              >
                ▾
              </span>
            </span>
          </label>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-12">
          {/* Sidebar */}
          <aside
            aria-label="Filters"
            className="hidden lg:col-span-3 lg:block"
          >
            <div className="sticky top-40">
              <FilterPanel
                filters={filters}
                setFilters={setFilters}
                categories={categories}
              />
            </div>
          </aside>

          {/* Grid */}
          <div className="lg:col-span-9">
            {chips.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={c.remove}
                    aria-label={`Remove filter ${c.label}`}
                    className="group inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-white transition-colors hover:bg-sale"
                  >
                    {c.label}
                    <span
                      aria-hidden="true"
                      className="text-white/70 group-hover:text-white"
                    >
                      ×
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
                  className="ml-1 text-sm text-ink underline underline-offset-4"
                >
                  Clear all
                </button>
              </div>
            )}

            {results.length === 0 ? (
              <div className="animate-fade-up rounded-3xl border border-line bg-white/50 px-6 py-20 text-center">
                <p className="font-serif text-4xl font-light text-ink">
                  Nothing matches those filters.
                </p>
                <p className="mt-3 text-muted">
                  Try removing one, or start again.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY)}
                  className="mt-8 h-12 rounded-full bg-ink px-8 text-sm text-white transition-colors hover:bg-gold hover:text-ink"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <ul
                key={signature}
                className="grid grid-cols-2 gap-x-3 gap-y-9 sm:grid-cols-3 sm:gap-x-5"
              >
                {visible.map((p, i) => (
                  <li
                    key={p.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${(i % PAGE_SIZE) * 55}ms` }}
                  >
                    <ProductCard
                      product={p}
                      priority={i < 3}
                    />
                  </li>
                ))}
              </ul>
            )}

            {results.length > shown && (
              <div className="mt-14 text-center">
                <p className="text-sm text-muted">
                  Showing {visible.length} of {results.length}
                </p>
                <div
                  aria-hidden="true"
                  className="mx-auto mt-3 h-[3px] w-48 overflow-hidden rounded-full bg-line"
                >
                  <span
                    className={`block h-full rounded-full bg-gold transition-[width] duration-700 ${EASE}`}
                    style={{
                      width: `${(visible.length / results.length) * 100}%`,
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPager({ sig: signature, count: shown + PAGE_SIZE })
                  }
                  className="mt-6 h-14 rounded-full border border-ink px-10 text-[15px] text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
                >
                  Load more
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <div
        inert={!sheet}
        className={`fixed inset-0 z-[60] transition-[visibility] lg:hidden ${
          sheet ? "visible delay-0" : "invisible delay-500"
        }`}
      >
        <div
          onClick={() => setSheet(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-500 ${
            sheet ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filters"
          className={`absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[32px] bg-ivory transition-transform duration-500 ${EASE} ${
            sheet ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="flex shrink-0 items-center justify-between px-6 pb-2 pt-5">
            <h2 className="font-serif text-3xl font-light text-ink">Filters</h2>
            <button
              ref={closeBtn}
              type="button"
              aria-label="Close filters"
              onClick={() => setSheet(false)}
              className="grid h-11 w-11 place-items-center rounded-full text-2xl text-ink hover:bg-stone/40"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              categories={categories}
            />
          </div>
          <div className="flex shrink-0 gap-3 border-t border-line px-6 py-4">
            <button
              type="button"
              onClick={() => setFilters(EMPTY)}
              className="h-14 rounded-full border border-line px-6 text-[15px] text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setSheet(false)}
              className="h-14 flex-1 rounded-full bg-ink text-[15px] text-white"
            >
              Show {results.length}{" "}
              {results.length === 1 ? "product" : "products"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
