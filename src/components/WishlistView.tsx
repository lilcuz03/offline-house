"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { useWishlist, type WishlistItem } from "./WishListProvider";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const ACCENTS = [
  "var(--cat-tech)",
  "var(--gold)",
  "var(--cat-beauty)",
  "var(--cat-living)",
  "var(--cat-essentials)",
];

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

function accentFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return ACCENTS[sum % ACCENTS.length];
}

/* ---------- one saved item ---------- */

function SavedCard({
  item,
  leaving,
  onRemove,
}: {
  item: WishlistItem;
  leaving: boolean;
  onRemove: () => void;
}) {
  const { addItem, items: bag } = useCart();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const inBag = bag.some((b) => b.id === item.id);
  const onSale = !!item.compareAtPrice && item.compareAtPrice > item.price;
  const off = onSale
    ? Math.round((1 - item.price / (item.compareAtPrice as number)) * 100)
    : 0;

  const add = () => {
    addItem({
      id: item.id,
      slug: item.slug,
      name: item.name,
      price: item.price,
      image: item.image ?? null,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article
      style={{ "--accent": accentFor(item.id) } as React.CSSProperties}
      className={`group transition-all duration-[420ms] ${EASE} ${
        leaving ? "scale-90 opacity-0" : "scale-100 opacity-100"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone/30">
        <Link
          href={`/products/${item.slug}`}
          aria-label={item.name}
          className="absolute inset-0 block"
        >
          {item.image ? (
            <Image
              src={item.image}
              alt=""
              fill
              sizes="(min-width:1024px) 24vw, (min-width:640px) 31vw, 48vw"
              className={`object-cover transition-transform duration-[900ms] ${EASE} group-hover:scale-105`}
            />
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center overflow-hidden"
            >
              <span
                className={`absolute h-[70%] w-[70%] rounded-full bg-(--accent) opacity-40 transition-transform duration-[1200ms] ${EASE} group-hover:scale-125`}
              />
              <span className="relative font-serif text-6xl font-light text-ink/80">
                {item.name.charAt(0)}
              </span>
            </span>
          )}
        </Link>

        {onSale && (
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-sale px-3 py-1 text-xs font-medium text-white">
            -{off}%
          </span>
        )}

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name} from wishlist`}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-xl leading-none text-ink backdrop-blur transition-colors duration-300 hover:bg-sale hover:text-white"
        >
          ×
        </button>
      </div>

      <div className="mt-4 px-1">
        {item.category && <p className="text-xs text-muted">{item.category}</p>}
        <h3 className="mt-1 text-[15px] leading-snug text-ink">
          <Link
            href={`/products/${item.slug}`}
            className="transition-colors duration-300 hover:text-gold-deep"
          >
            {item.name}
          </Link>
        </h3>
        <p className="mt-2 flex items-baseline gap-2.5">
          <span className="text-base text-ink">{zar.format(item.price)}</span>
          {onSale && (
            <span className="text-sm text-muted line-through">
              {zar.format(item.compareAtPrice as number)}
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={add}
          className={`mt-4 h-12 w-full rounded-full text-sm transition-all duration-500 ${EASE} ${
            added
              ? "bg-gold text-ink"
              : "border border-ink text-ink hover:bg-ink hover:text-white"
          }`}
        >
          {added ? "Added to bag" : inBag ? "Add another" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}

/* ---------- page ---------- */

export default function WishlistView() {
  const { items, hydrated, remove, clear } = useWishlist();
  const { addItem, openCart } = useCart();

  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const removeAnimated = (id: string) => {
    setLeaving((prev) => new Set(prev).add(id));
    setTimeout(() => {
      remove(id);
      setLeaving((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 380);
  };

  const addAll = () => {
    items.forEach((i) =>
      addItem(
        {
          id: i.id,
          slug: i.slug,
          name: i.name,
          price: i.price,
          image: i.image ?? null,
        },
        { openDrawer: false },
      ),
    );
    openCart();
  };

  const askClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3500);
      return;
    }
    setConfirmClear(false);
    clear();
  };

  // Wait for the saved list before deciding it's empty
  if (!hydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-7xl"
        aria-hidden="true"
      />
    );
  }

  return (
    <section
      aria-labelledby="wishlist-heading"
      className="mx-auto max-w-7xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <h1
            id="wishlist-heading"
            className="font-serif text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] tracking-[-0.02em] text-ink"
          >
            <span className="mask-word">
              <span className="animate-word-up">Wishlist</span>
            </span>
          </h1>
          <p
            aria-live="polite"
            className="animate-fade-up mt-4 text-base text-muted"
            style={{ animationDelay: "250ms" }}
          >
            {items.length === 0
              ? "Nothing saved yet."
              : `${items.length} ${items.length === 1 ? "item" : "items"} saved on this device.`}
          </p>
        </div>

        {items.length > 0 && (
          <div
            className="animate-fade-up flex flex-wrap items-center gap-3"
            style={{ animationDelay: "350ms" }}
          >
            <button
              type="button"
              onClick={askClear}
              className={`h-12 rounded-full border px-6 text-sm transition-colors duration-300 ${
                confirmClear
                  ? "border-sale bg-sale text-white"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {confirmClear ? "Sure? Clear all" : "Clear all"}
            </button>
            <button
              type="button"
              onClick={addAll}
              className={`group relative h-12 overflow-hidden rounded-full bg-ink px-7 text-sm text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
              />
              <span className="relative transition-colors duration-500 group-hover:text-ink">
                Add all to bag
              </span>
            </button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="animate-fade-up flex flex-col items-center py-20 text-center sm:py-28">
          <div className="animate-float relative h-32 w-32">
            <svg
              viewBox="0 0 100 100"
              aria-hidden="true"
              className="animate-spin-slow absolute inset-0 h-full w-full text-ink/20"
              style={{ animationDuration: "40s" }}
            >
              <circle
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                strokeDasharray="1 3"
              />
              <circle
                cx="50"
                cy="2"
                r="2"
                fill="var(--gold)"
              />
            </svg>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="absolute inset-[28%] h-[44%] w-[44%] text-ink"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
            </svg>
          </div>
          <p className="mt-10 font-serif text-4xl font-light text-ink sm:text-5xl">
            Save what catches your eye.
          </p>
          <p className="mt-3 max-w-[38ch] text-[15px] leading-relaxed text-muted">
            Tap the heart on any product and it will wait for you here.
          </p>
          <Link
            href="/collections/top-sellers"
            className={`group mt-9 inline-flex h-14 items-center gap-3 rounded-full bg-ink pl-8 pr-3 text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.98]`}
          >
            Shop top sellers
            <span
              aria-hidden="true"
              className={`grid h-10 w-10 place-items-center rounded-full bg-white/15 transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
            >
              →
            </span>
          </Link>
        </div>
      ) : (
        <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
          {items.map((item, i) => (
            <li
              key={item.id}
              className="animate-fade-up"
              style={{ animationDelay: `${Math.min(i, 11) * 55}ms` }}
            >
              <SavedCard
                item={item}
                leaving={leaving.has(item.id)}
                onRemove={() => removeAnimated(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
