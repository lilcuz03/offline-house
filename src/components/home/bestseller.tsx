"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useWishlist } from "../WishListProvider";

/* ---------- types ---------- */

export type Product = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  /** Price in rands (not cents). */
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  hoverImage?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  badge?: string | null;
};

type BestSellersProps = {
  products?: Product[];
  onAddToCart?: (product: Product) => void;
  title?: string;
  href?: string;
};

/* Shown until you pass real products from Supabase. */
const SAMPLE: Product[] = [
  {
    id: "1",
    slug: "gan-charger-65w",
    name: "65W GaN Charger",
    category: "Tech",
    price: 449,
    compareAtPrice: 599,
    rating: 4.8,
    reviewCount: 212,
    badge: "Best seller",
  },
  {
    id: "2",
    slug: "braided-usb-c-cable",
    name: "Braided USB-C Cable, 2 m",
    category: "Tech",
    price: 189,
    rating: 4.7,
    reviewCount: 148,
  },
  {
    id: "3",
    slug: "magnetic-phone-case",
    name: "Magnetic Phone Case",
    category: "Tech",
    price: 329,
    rating: 4.6,
    reviewCount: 96,
    badge: "New",
  },
  {
    id: "4",
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    category: "Tech",
    price: 799,
    compareAtPrice: 999,
    rating: 4.5,
    reviewCount: 304,
  },
  {
    id: "5",
    slug: "ceramic-diffuser",
    name: "Ceramic Aroma Diffuser",
    category: "Home",
    price: 359,
    rating: 4.9,
    reviewCount: 61,
  },
  {
    id: "6",
    slug: "silk-sleep-mask",
    name: "Silk Sleep Mask",
    category: "Beauty",
    price: 219,
    rating: 4.8,
    reviewCount: 87,
  },
  {
    id: "7",
    slug: "desk-organiser",
    name: "Oak Desk Organiser",
    category: "Living",
    price: 499,
    rating: 4.7,
    reviewCount: 42,
  },
  {
    id: "8",
    slug: "travel-organiser",
    name: "Cable Travel Organiser",
    category: "Essentials",
    price: 159,
    rating: 4.6,
    reviewCount: 119,
  },
];

const ACCENTS = [
  "var(--cat-tech)",
  "var(--gold)",
  "var(--cat-beauty)",
  "var(--cat-living)",
  "var(--cat-essentials)",
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

/* ---------- icons ---------- */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ArrowIcon = ({ dir }: { dir: "left" | "right" }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...stroke}
  >
    <path
      d={dir === "right" ? "M5 12h14M13 6l6 6-6 6" : "M19 12H5M11 6l-6 6 6 6"}
    />
  </svg>
);

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...stroke}
    fill={filled ? "currentColor" : "none"}
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);

/* ---------- reveal hook ---------- */

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
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, seen] as const;
}

/* ---------- component ---------- */

export default function BestSellers({
  products,
  onAddToCart,
  title = "Top sellers",
  href = "/collections/top-sellers",
}: BestSellersProps) {
  const items = products && products.length > 0 ? products : SAMPLE;

  const [sectionRef, seen] = useInView<HTMLElement>();
  const [rail, setRail] = useState<HTMLUListElement | null>(null);
  const { has, toggle } = useWishlist();
  const [added, setAdded] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll position of the rail lives in the DOM, so subscribe to it
  // instead of copying it into state from an effect. The snapshot is a
  // primitive string, which keeps it stable between reads.
  const subscribeRail = useCallback(
    (notify: () => void) => {
      if (!rail) return () => {};
      let raf = 0;
      const onChange = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(notify);
      };
      rail.addEventListener("scroll", onChange, { passive: true });
      window.addEventListener("resize", onChange);
      const ro = new ResizeObserver(onChange);
      ro.observe(rail);
      return () => {
        cancelAnimationFrame(raf);
        rail.removeEventListener("scroll", onChange);
        window.removeEventListener("resize", onChange);
        ro.disconnect();
      };
    },
    [rail],
  );
  const getRailSnapshot = useCallback(
    () =>
      rail
        ? `${Math.round(rail.scrollLeft)}|${rail.scrollWidth}|${rail.clientWidth}`
        : "0|1|1",
    [rail],
  );
  const railMetrics = useSyncExternalStore(
    subscribeRail,
    getRailSnapshot,
    () => "0|1|1",
  );

  const { thumb, atStart, atEnd } = useMemo(() => {
    const [left, width, client] = railMetrics.split("|").map(Number);
    return {
      thumb: {
        w: Math.min(100, (client / width) * 100),
        l: (left / width) * 100,
      },
      atStart: left < 4,
      atEnd: left + client >= width - 4,
    };
  }, [railMetrics]);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const scrollByPage = (dir: 1 | -1) => {
    if (!rail) return;
    rail.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: "smooth" });
  };

  const toggleLike = (p: Product) =>
    toggle({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      image: p.image ?? null,
      category: p.category ?? null,
    });

  const addToBag = (p: Product) => {
    onAddToCart?.(p);
    setAdded(p.id);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(null), 1600);
  };

  const arrowBtn =
    "grid h-12 w-12 place-items-center rounded-full border border-white/25 text-white transition-all duration-300 hover:border-gold hover:bg-gold hover:text-ink disabled:pointer-events-none disabled:opacity-30";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="best-sellers-heading"
      className="mx-2 overflow-hidden rounded-[32px] bg-ink text-white sm:mx-4 sm:rounded-[48px]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        {/* Heading + controls */}
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <div>
            <h2
              id="best-sellers-heading"
              className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em]"
            >
              {title}
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-white/65">
              The pieces people come back for, picked by what sells most.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={href}
              className="group mr-2 hidden items-center gap-3 border-b border-white/60 pb-1 text-sm transition-colors hover:border-gold hover:text-gold sm:inline-flex"
            >
              Shop all
              <span
                aria-hidden="true"
                className={`transition-transform duration-500 ${EASE} group-hover:translate-x-1.5`}
              >
                →
              </span>
            </Link>
            <button
              type="button"
              aria-label="Previous products"
              onClick={() => scrollByPage(-1)}
              disabled={atStart}
              className={arrowBtn}
            >
              <ArrowIcon dir="left" />
            </button>
            <button
              type="button"
              aria-label="Next products"
              onClick={() => scrollByPage(1)}
              disabled={atEnd}
              className={arrowBtn}
            >
              <ArrowIcon dir="right" />
            </button>
          </div>
        </div>

        {/* Rail */}
        <ul
          ref={setRail}
          aria-roledescription="carousel"
          aria-label={title}
          className="-mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:-mx-8 sm:scroll-px-8 sm:gap-5 sm:px-8 [&::-webkit-scrollbar]:hidden"
        >
          {items.map((p, i) => {
            const isLiked = has(p.id);
            const onSale = !!p.compareAtPrice && p.compareAtPrice > p.price;
            const off = onSale
              ? Math.round((1 - p.price / (p.compareAtPrice as number)) * 100)
              : 0;
            const accent = ACCENTS[i % ACCENTS.length];

            return (
              <li
                key={p.id}
                style={{ transitionDelay: `${Math.min(i, 5) * 90}ms` }}
                className={`w-[72%] shrink-0 snap-start transition-[opacity,transform] duration-[900ms] ${EASE} sm:w-[44%] md:w-[31%] lg:w-[23.5%] ${
                  seen
                    ? "translate-x-0 opacity-100"
                    : "translate-x-16 opacity-0"
                }`}
              >
                <article className="group">
                  {/* Image */}
                  <div
                    style={{ "--accent": accent } as React.CSSProperties}
                    className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ivory"
                  >
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
                            sizes="(min-width:1024px) 24vw, (min-width:768px) 31vw, (min-width:640px) 44vw, 72vw"
                            className={`object-cover transition-all duration-[900ms] ${EASE} group-hover:scale-105 ${
                              p.hoverImage ? "group-hover:opacity-0" : ""
                            }`}
                          />
                          {p.hoverImage && (
                            <Image
                              src={p.hoverImage}
                              alt=""
                              fill
                              sizes="(min-width:1024px) 24vw, (min-width:768px) 31vw, (min-width:640px) 44vw, 72vw"
                              className={`object-cover opacity-0 transition-all duration-[900ms] ${EASE} group-hover:scale-105 group-hover:opacity-100`}
                            />
                          )}
                        </>
                      ) : (
                        /* Placeholder art until a product has a photo */
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 grid place-items-center overflow-hidden"
                        >
                          <span
                            className={`absolute h-[70%] w-[70%] rounded-full bg-(--accent) opacity-40 transition-transform duration-[1200ms] ${EASE} group-hover:scale-125`}
                          />
                          <span
                            className={`absolute h-[46%] w-[46%] rounded-full border border-ink/25 transition-transform duration-[1200ms] ${EASE} group-hover:scale-[1.6] group-hover:rotate-90`}
                          />
                          <span className="relative font-serif text-6xl font-light text-ink/80">
                            {p.name.charAt(0)}
                          </span>
                        </span>
                      )}
                    </Link>

                    {/* Badges */}
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

                    {/* Wishlist */}
                    <button
                      type="button"
                      aria-pressed={isLiked}
                      aria-label={
                        isLiked
                          ? `Remove ${p.name} from wishlist`
                          : `Add ${p.name} to wishlist`
                      }
                      onClick={() => toggleLike(p)}
                      className={`absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/85 backdrop-blur transition-colors duration-300 hover:bg-white ${
                        isLiked ? "text-sale" : "text-ink"
                      }`}
                    >
                      <span
                        key={String(isLiked)}
                        className={isLiked ? "animate-pop block" : "block"}
                      >
                        <HeartIcon filled={isLiked} />
                      </span>
                    </button>

                    {/* Add to bag: slides up on hover or focus, always visible on touch */}
                    <button
                      type="button"
                      onClick={() => addToBag(p)}
                      aria-label={`Add ${p.name} to bag`}
                      className={`absolute inset-x-3 bottom-3 z-10 h-12 translate-y-[calc(100%+16px)] rounded-full text-sm font-medium transition-all duration-500 ${EASE} group-hover:translate-y-0 group-focus-within:translate-y-0 [@media(hover:none)]:translate-y-0 ${
                        added === p.id
                          ? "bg-gold text-ink"
                          : "bg-ink text-white hover:bg-gold hover:text-ink"
                      }`}
                    >
                      {added === p.id ? "Added to bag" : "Add to bag"}
                    </button>
                  </div>

                  {/* Info */}
                  <div className="mt-4 px-1">
                    {p.category && (
                      <p className="text-xs text-white/50">{p.category}</p>
                    )}
                    <h3 className="mt-1 text-[15px] leading-snug">
                      <Link
                        href={`/products/${p.slug}`}
                        className="transition-colors duration-300 hover:text-gold"
                      >
                        {p.name}
                      </Link>
                    </h3>
                    <p className="mt-2 flex items-baseline gap-2.5">
                      <span className="text-base text-white">
                        {zar.format(p.price)}
                      </span>
                      {onSale && (
                        <span className="text-sm text-white/45 line-through">
                          {zar.format(p.compareAtPrice as number)}
                        </span>
                      )}
                    </p>
                    {p.rating ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
                        <span
                          aria-hidden="true"
                          className="text-gold"
                        >
                          ★
                        </span>
                        {p.rating.toFixed(1)}
                        {p.reviewCount ? ` (${p.reviewCount})` : ""}
                      </p>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {/* Scroll progress: the thumb follows the rail */}
        <div
          aria-hidden="true"
          className="relative mt-8 h-px w-full bg-white/20"
        >
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gold transition-[left,width] duration-200 ease-out"
            style={{ left: `${thumb.l}%`, width: `${thumb.w}%` }}
          />
        </div>

        <Link
          href={href}
          className="mt-8 inline-flex items-center gap-3 border-b border-white/60 pb-1 text-sm sm:hidden"
        >
          Shop all →
        </Link>
      </div>
    </section>
  );
}
