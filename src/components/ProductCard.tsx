"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "../components/home/bestseller";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishListProvider";

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

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);

function accentFor(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return ACCENTS[sum % ACCENTS.length];
}

type ProductCardProps = {
  product: Product;
  priority?: boolean;
};

export default function ProductCard({
  product: p,
  priority,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const liked = has(p.id);
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onSale = !!p.compareAtPrice && p.compareAtPrice > p.price;
  const off = onSale
    ? Math.round((1 - p.price / (p.compareAtPrice as number)) * 100)
    : 0;

  const add = () => {
    addItem({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      image: p.image ?? null,
    });
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 1600);
  };

  const sizes =
    "(min-width:1280px) 22vw, (min-width:1024px) 28vw, (min-width:640px) 31vw, 48vw";

  return (
    <article
      className="group"
      style={{ "--accent": accentFor(p.id) } as React.CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone/30">
        <Link
          href={`/products/${p.slug}`}
          aria-label={p.name}
          className="absolute inset-0 block"
        >
          {p.image ? (
            <>
              <Image
                src={p.image}
                alt=""
                fill
                sizes={sizes}
                priority={priority}
                className={`object-cover transition-all duration-[900ms] ${EASE} group-hover:scale-105 ${
                  p.hoverImage ? "group-hover:opacity-0" : ""
                }`}
              />
              {p.hoverImage && (
                <Image
                  src={p.hoverImage}
                  alt=""
                  fill
                  sizes={sizes}
                  className={`object-cover opacity-0 transition-all duration-[900ms] ${EASE} group-hover:scale-105 group-hover:opacity-100`}
                />
              )}
            </>
          ) : (
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center overflow-hidden"
            >
              <span
                className={`absolute h-[70%] w-[70%] rounded-full bg-(--accent) opacity-40 transition-transform duration-[1200ms] ${EASE} group-hover:scale-125`}
              />
              <span
                className={`absolute h-[46%] w-[46%] rounded-full border border-ink/25 transition-transform duration-[1200ms] ${EASE} group-hover:rotate-90 group-hover:scale-[1.6]`}
              />
              <span className="relative font-serif text-6xl font-light text-ink/80">
                {p.name.charAt(0)}
              </span>
            </span>
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {onSale && (
            <span className="rounded-full bg-sale px-3 py-1 text-xs font-medium text-white">
              -{off}%
            </span>
          )}
          {p.badge && (
            <span className="rounded-full bg-white/85 px-3 py-1 text-xs text-ink backdrop-blur">
              {p.badge}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-pressed={liked}
          aria-label={
            liked
              ? `Remove ${p.name} from wishlist`
              : `Add ${p.name} to wishlist`
          }
          onClick={() =>
            toggle({
              id: p.id,
              slug: p.slug,
              name: p.name,
              price: p.price,
              compareAtPrice: p.compareAtPrice ?? null,
              image: p.image ?? null,
              category: p.category ?? null,
            })
          }
          className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 backdrop-blur transition-colors duration-300 hover:bg-white ${
            liked ? "text-sale" : "text-ink"
          }`}
        >
          <span
            key={String(liked)}
            className={liked ? "animate-pop block" : "block"}
          >
            <HeartIcon filled={liked} />
          </span>
        </button>

        <button
          type="button"
          onClick={add}
          aria-label={`Add ${p.name} to bag`}
          className={`absolute inset-x-3 bottom-3 z-10 h-12 translate-y-[calc(100%+16px)] rounded-full text-sm font-medium transition-all duration-500 ${EASE} group-hover:translate-y-0 group-focus-within:translate-y-0 [@media(hover:none)]:translate-y-0 ${
            added
              ? "bg-gold text-ink"
              : "bg-ink text-white hover:bg-gold hover:text-ink"
          }`}
        >
          {added ? "Added to bag" : "Add to bag"}
        </button>
      </div>

      <div className="mt-4 px-1">
        {p.category && <p className="text-xs text-muted">{p.category}</p>}
        <h3 className="mt-1 text-[15px] leading-snug text-ink">
          <Link
            href={`/products/${p.slug}`}
            className="transition-colors duration-300 hover:text-gold-deep"
          >
            {p.name}
          </Link>
        </h3>
        <p className="mt-2 flex items-baseline gap-2.5">
          <span className="text-base text-ink">{zar.format(p.price)}</span>
          {onSale && (
            <span className="text-sm text-muted line-through">
              {zar.format(p.compareAtPrice as number)}
            </span>
          )}
        </p>
        {p.rating ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span
              aria-hidden="true"
              className="text-gold-deep"
            >
              ★
            </span>
            {p.rating.toFixed(1)}
            {p.reviewCount ? ` (${p.reviewCount})` : ""}
          </p>
        ) : null}
      </div>
    </article>
  );
}
