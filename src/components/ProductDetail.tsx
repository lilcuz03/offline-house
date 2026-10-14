"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishListProvider";

/* ---------- types ---------- */

export type ProductDetailData = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  categoryHref?: string;
  /** Rands (not cents). */
  price: number;
  compareAtPrice?: number | null;
  description?: string | null;
  images: string[];
  rating?: number | null;
  reviewCount?: number | null;
  inStock?: boolean;
  /** e.g. [{ name: "Colour", options: ["Black", "Sand"] }] */
  variants?: { name: string; options: string[] }[];
  details?: string[];
  delivery?: string;
  returns?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const MAX_QTY = 99;

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

/* Placeholder copy. Replace with your real policies. */
const DEFAULT_DELIVERY =
  "We ship across South Africa. You'll get a tracking link as soon as your order leaves us.";
const DEFAULT_RETURNS =
  "Changed your mind? Send it back unused in its original packaging and we'll sort a refund or exchange.";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const HeartIcon = ({ filled }: { filled: boolean }) => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    aria-hidden="true"
    {...stroke}
    fill={filled ? "currentColor" : "none"}
  >
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </svg>
);

/* ---------- gallery art when a product has no photo yet ---------- */

function PlaceholderArt({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 grid place-items-center overflow-hidden bg-ivory"
    >
      <span className="absolute h-[70%] w-[70%] rounded-full bg-gold opacity-30" />
      <span className="absolute h-[44%] w-[44%] rounded-full border border-ink/25" />
      <span className="relative font-serif text-8xl font-light text-ink/80">
        {name.charAt(0)}
      </span>
    </span>
  );
}

/* ---------- accordion ---------- */

function Accordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const id = `acc-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="border-b border-line">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className="flex w-full items-center justify-between py-5 text-left text-[15px] text-ink"
      >
        {title}
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 place-items-center rounded-full border border-line text-lg leading-none transition-transform duration-500 ${EASE} ${
            open ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        id={id}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="pb-6 text-[15px] leading-relaxed text-muted">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export default function ProductDetail({
  product,
}: {
  product: ProductDetailData;
}) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const liked = has(product.id);

  const slides: (string | null)[] =
    product.images.length > 0 ? product.images : [null];

  const [active, setActive] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (product.variants ?? []).map((v) => [v.name, v.options[0]]),
    ),
  );
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [openAcc, setOpenAcc] = useState<string | null>("Details");
  const [showBar, setShowBar] = useState(false);

  const zoomBox = useRef<HTMLDivElement>(null);
  const mobileRail = useRef<HTMLUListElement>(null);
  const buyButton = useRef<HTMLButtonElement>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inStock = product.inStock !== false;
  const onSale =
    !!product.compareAtPrice && product.compareAtPrice > product.price;
  const off = onSale
    ? Math.round((1 - product.price / (product.compareAtPrice as number)) * 100)
    : 0;

  const variantLabel =
    (product.variants ?? []).length > 0
      ? (product.variants ?? []).map((v) => selected[v.name]).join(" / ")
      : null;
  const cartId = variantLabel
    ? `${product.id}:${variantLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    : product.id;

  /* Sticky mobile bar appears once the main button scrolls out above */
  useEffect(() => {
    const el = buyButton.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) =>
        setShowBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const onZoomMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !zoomBox.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    zoomBox.current.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${
      ((e.clientY - r.top) / r.height) * 100
    }%`;
  };

  const onRailScroll = () => {
    const el = mobileRail.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  const goTo = (i: number) => {
    setActive(i);
    const el = mobileRail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const addToBag = () => {
    if (!inStock) return;
    addItem({
      id: cartId,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0] ?? null,
      variant: variantLabel,
      quantity: qty,
    });
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1800);
  };

  const sizes = "(min-width:1024px) 50vw, 100vw";

  return (
    <section
      aria-labelledby="product-title"
      className="mx-auto max-w-7xl px-0 pb-24 sm:px-6 lg:pb-16 lg:pt-8"
    >
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-14">
        {/* ---------- Gallery ---------- */}
        <div className="lg:col-span-7">
          {/* Mobile: swipeable */}
          <div className="relative lg:hidden">
            <ul
              ref={mobileRail}
              onScroll={onRailScroll}
              aria-roledescription="carousel"
              aria-label={`${product.name} photos`}
              className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {slides.map((src, i) => (
                <li
                  key={i}
                  className="relative aspect-[4/5] w-full shrink-0 snap-center bg-stone/30"
                >
                  {src ? (
                    <Image
                      src={src}
                      alt={
                        i === 0
                          ? product.name
                          : `${product.name}, photo ${i + 1}`
                      }
                      fill
                      sizes="100vw"
                      priority={i === 0}
                      className="object-cover"
                    />
                  ) : (
                    <PlaceholderArt name={product.name} />
                  )}
                </li>
              ))}
            </ul>
            {slides.length > 1 && (
              <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Show photo ${i + 1}`}
                    aria-current={i === active}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full bg-white/90 shadow transition-all duration-500 ${EASE} ${
                      i === active ? "w-6" : "w-2 opacity-60"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: thumbs + zoom */}
          <div className="hidden gap-4 lg:flex">
            {slides.length > 1 && (
              <ul className="flex w-20 shrink-0 flex-col gap-3">
                {slides.map((src, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      aria-label={`Show photo ${i + 1}`}
                      aria-current={i === active}
                      onClick={() => setActive(i)}
                      className={`relative block aspect-square w-full overflow-hidden rounded-xl bg-stone/30 ring-offset-2 ring-offset-ivory transition-all duration-300 ${
                        i === active
                          ? "ring-2 ring-ink"
                          : "opacity-60 hover:opacity-100"
                      }`}
                    >
                      {src ? (
                        <Image
                          src={src}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <PlaceholderArt name={product.name} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              onPointerMove={onZoomMove}
              className="group relative aspect-[4/5] flex-1 cursor-zoom-in overflow-hidden rounded-3xl bg-stone/30"
            >
              <div
                ref={zoomBox}
                className={`absolute inset-0 transition-transform duration-500 ${EASE} group-hover:scale-[1.9]`}
              >
                {slides.map((src, i) => (
                  <div
                    key={i}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      i === active ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {src ? (
                      <Image
                        src={src}
                        alt={
                          i === 0
                            ? product.name
                            : `${product.name}, photo ${i + 1}`
                        }
                        fill
                        sizes={sizes}
                        priority={i === 0}
                        className="object-cover"
                      />
                    ) : (
                      <PlaceholderArt name={product.name} />
                    )}
                  </div>
                ))}
              </div>
              {onSale && (
                <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-sale px-3.5 py-1.5 text-sm font-medium text-white">
                  -{off}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ---------- Info ---------- */}
        <div className="px-5 sm:px-0 lg:col-span-5">
          <div className="lg:sticky lg:top-40">
            {product.category && (
              <Link
                href={product.categoryHref ?? "/collections/top-sellers"}
                className="text-sm text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
              >
                {product.category}
              </Link>
            )}
            <h1
              id="product-title"
              className="mt-2 font-serif text-[clamp(2.25rem,5vw,3.75rem)] font-light leading-[1] tracking-[-0.01em] text-ink"
            >
              {product.name}
            </h1>

            {product.rating ? (
              <a
                href="#reviews"
                className="mt-4 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
              >
                <span
                  aria-hidden="true"
                  className="text-gold"
                >
                  ★★★★★
                </span>
                {product.rating.toFixed(1)}
                {product.reviewCount ? ` (${product.reviewCount} reviews)` : ""}
              </a>
            ) : null}

            <p className="mt-6 flex items-baseline gap-3">
              <span className="font-serif text-4xl font-light text-ink">
                {zar.format(product.price)}
              </span>
              {onSale && (
                <>
                  <span className="text-lg text-muted line-through">
                    {zar.format(product.compareAtPrice as number)}
                  </span>
                  <span className="rounded-full bg-sale/10 px-2.5 py-0.5 text-sm text-sale">
                    Save {off}%
                  </span>
                </>
              )}
            </p>

            {product.description && (
              <p className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted">
                {product.description}
              </p>
            )}

            {/* Variants */}
            {(product.variants ?? []).map((group) => (
              <fieldset
                key={group.name}
                className="mt-8"
              >
                <legend className="text-sm text-ink">
                  {group.name}:{" "}
                  <span className="text-muted">{selected[group.name]}</span>
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {group.options.map((opt) => {
                    const on = selected[group.name] === opt;
                    return (
                      <label
                        key={opt}
                        className={`relative cursor-pointer rounded-full border px-5 py-2.5 text-sm transition-all duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep ${
                          on
                            ? "border-ink bg-ink text-white"
                            : "border-line text-ink hover:border-ink"
                        }`}
                      >
                        <input
                          type="radio"
                          name={group.name}
                          value={opt}
                          checked={on}
                          onChange={() =>
                            setSelected((s) => ({ ...s, [group.name]: opt }))
                          }
                          className="sr-only"
                        />
                        {opt}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ))}

            {/* Quantity + add */}
            <div className="mt-8 flex items-stretch gap-3">
              <div
                role="group"
                aria-label="Quantity"
                className="inline-flex items-center rounded-full border border-line bg-white/60"
              >
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid h-14 w-12 place-items-center text-xl text-ink transition-colors hover:bg-stone/40 disabled:opacity-30"
                >
                  −
                </button>
                <span
                  key={qty}
                  aria-live="polite"
                  className="animate-pop w-8 text-center tabular-nums text-ink"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={qty >= MAX_QTY}
                  onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                  className="grid h-14 w-12 place-items-center text-xl text-ink transition-colors hover:bg-stone/40 disabled:opacity-30"
                >
                  +
                </button>
              </div>

              <button
                ref={buyButton}
                type="button"
                onClick={addToBag}
                disabled={!inStock}
                className={`group relative flex h-14 flex-1 items-center justify-center overflow-hidden rounded-full text-[15px] transition-all duration-500 ${EASE} active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone disabled:text-muted ${
                  added
                    ? "bg-gold text-ink"
                    : "bg-ink text-white hover:scale-[1.02]"
                }`}
              >
                {inStock && !added && (
                  <span
                    aria-hidden="true"
                    className="animate-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/25"
                  />
                )}
                <span className="relative">
                  {!inStock
                    ? "Out of stock"
                    : added
                      ? "Added to bag"
                      : `Add to bag · ${zar.format(product.price * qty)}`}
                </span>
              </button>

              <button
                type="button"
                aria-pressed={liked}
                aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                onClick={() =>
                  toggle({
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    price: product.price,
                    compareAtPrice: product.compareAtPrice ?? null,
                    image: product.images[0] ?? null,
                    category: product.category ?? null,
                  })
                }
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                  liked
                    ? "border-sale text-sale"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                <span
                  key={String(liked)}
                  className={liked ? "animate-pop block" : "block"}
                >
                  <HeartIcon filled={liked} />
                </span>
              </button>
            </div>

            {/* Accordions */}
            <div className="mt-10 border-t border-line">
              <Accordion
                title="Details"
                open={openAcc === "Details"}
                onToggle={() =>
                  setOpenAcc(openAcc === "Details" ? null : "Details")
                }
              >
                {product.details && product.details.length > 0 ? (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {product.details.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{product.description ?? "More details coming soon."}</p>
                )}
              </Accordion>
              <Accordion
                title="Delivery"
                open={openAcc === "Delivery"}
                onToggle={() =>
                  setOpenAcc(openAcc === "Delivery" ? null : "Delivery")
                }
              >
                <p>{product.delivery ?? DEFAULT_DELIVERY}</p>
              </Accordion>
              <Accordion
                title="Returns"
                open={openAcc === "Returns"}
                onToggle={() =>
                  setOpenAcc(openAcc === "Returns" ? null : "Returns")
                }
              >
                <p>{product.returns ?? DEFAULT_RETURNS}</p>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky add bar on mobile once the main button has scrolled away */}
      <div
        inert={!showBar}
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ivory/95 px-4 py-3 backdrop-blur-xl transition-transform duration-500 lg:hidden ${EASE} ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-xl items-center gap-4">
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm text-ink">{product.name}</p>
            <p className="mt-0.5 text-sm text-muted">
              {zar.format(product.price)}
            </p>
          </div>
          <button
            type="button"
            onClick={addToBag}
            disabled={!inStock}
            className={`h-12 shrink-0 rounded-full px-7 text-sm transition-colors duration-500 disabled:bg-stone disabled:text-muted ${
              added ? "bg-gold text-ink" : "bg-ink text-white"
            }`}
          >
            {!inStock ? "Out of stock" : added ? "Added" : "Add to bag"}
          </button>
        </div>
      </div>
    </section>
  );
}
