"use client";

import { useEffect, useRef } from "react";

export type Review = {
  id: string;
  name: string;
  location?: string | null;
  /** 1 to 5 */
  rating: number;
  text: string;
  product?: string | null;
};

type ReviewsProps = {
  reviews?: Review[];
  /** Show the real total if you only pass a subset of reviews. */
  totalCount?: number;
  title?: string;
};

/* SAMPLE DATA. Replace with real customer reviews before launch. */
const SAMPLE: Review[] = [
  {
    id: "1",
    name: "Thandi M.",
    location: "Cape Town",
    rating: 5,
    product: "65W GaN Charger",
    text: "Charges my laptop and phone at the same time and it's barely warm. Smaller than the brick it replaced.",
  },
  {
    id: "2",
    name: "Kyle R.",
    location: "Durban",
    rating: 5,
    product: "Braided USB-C Cable",
    text: "Third cable I've bought here and the first ones are still going. The braid hasn't frayed at all.",
  },
  {
    id: "3",
    name: "Naledi P.",
    location: "Johannesburg",
    rating: 4,
    product: "Ceramic Aroma Diffuser",
    text: "Looks far more expensive than it was. Quiet enough to leave on in the bedroom.",
  },
  {
    id: "4",
    name: "Sipho D.",
    location: "Pretoria",
    rating: 5,
    product: "Magnetic Phone Case",
    text: "Snaps onto the car mount with a proper click. Grippy without being bulky.",
  },
  {
    id: "5",
    name: "Amy V.",
    location: "Gqeberha",
    rating: 5,
    product: "Silk Sleep Mask",
    text: "Genuinely sleeping better. Soft, doesn't press on my eyes and stays put all night.",
  },
  {
    id: "6",
    name: "Tendai C.",
    location: "Bloemfontein",
    rating: 5,
    product: "Wireless Earbuds",
    text: "Battery lasts the whole workday and the fit is comfortable. Delivery was quick too.",
  },
  {
    id: "7",
    name: "Lerato K.",
    location: "Sandton",
    rating: 4,
    product: "Oak Desk Organiser",
    text: "Cleared my desk in ten minutes. Solid build, and the oak finish is lovely.",
  },
  {
    id: "8",
    name: "Jason B.",
    location: "Stellenbosch",
    rating: 5,
    product: "Cable Travel Organiser",
    text: "Everything has a place now. Fits in my carry-on and I stopped losing chargers.",
  },
  {
    id: "9",
    name: "Zanele N.",
    location: "Umhlanga",
    rating: 5,
    product: "Magnetic Phone Case",
    text: "Ordered on Monday, had it on Wednesday. Packaging was neat and the case fits perfectly.",
  },
  {
    id: "10",
    name: "Pieter L.",
    location: "George",
    rating: 5,
    product: "65W GaN Charger",
    text: "Does exactly what it says. No fuss, no overheating, and it travels well.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <span
      role="img"
      aria-label={`${value} out of 5 stars`}
      className="inline-flex gap-0.5 text-gold"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={n <= Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          className={n <= Math.round(value) ? "" : "text-stone"}
        >
          <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
        </svg>
      ))}
    </span>
  );
}

function Card({ r }: { r: Review }) {
  return (
    <figure className="flex h-full w-[290px] flex-col justify-between rounded-3xl border border-line bg-white p-6 sm:w-[360px] sm:p-7">
      <div>
        <Stars value={r.rating} />
        <blockquote className="mt-4 text-[15px] leading-relaxed text-ink sm:text-base">
          {r.text}
        </blockquote>
      </div>
      <figcaption className="mt-6 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ivory font-serif text-lg text-ink"
        >
          {r.name.charAt(0)}
        </span>
        <span className="block min-w-0 leading-tight">
          <span className="block truncate text-sm font-medium text-ink">
            {r.name}
            {r.location ? (
              <span className="font-normal text-muted">, {r.location}</span>
            ) : null}
          </span>
          {r.product && (
            <span className="block truncate text-xs text-muted">
              Bought the {r.product}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}

/* Endless row driven by the Web Animations API, so no extra CSS is needed.
   Each item carries its own right padding (not flex gap) so that
   translating by exactly -50% lands on a perfect loop. */
function Row({
  items,
  reverse,
  seconds,
}: {
  items: Review[];
  reverse?: boolean;
  seconds: number;
}) {
  const track = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const a = el.animate(
      [{ transform: "translateX(0)" }, { transform: "translateX(-50%)" }],
      {
        duration: seconds * 1000,
        iterations: Infinity,
        easing: "linear",
        direction: reverse ? "reverse" : "normal",
      },
    );
    anim.current = a;
    return () => a.cancel();
  }, [reverse, seconds]);

  const pause = () => anim.current?.pause();
  const play = () => anim.current?.play();

  const mask =
    "linear-gradient(to right, transparent, #000 7%, #000 93%, transparent)";

  return (
    <div
      onMouseEnter={pause}
      onMouseLeave={play}
      onFocusCapture={pause}
      onBlurCapture={play}
      onTouchStart={pause}
      onTouchEnd={play}
      className="overflow-hidden motion-reduce:overflow-x-auto"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <div
        ref={track}
        className="flex w-max"
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1}
            className="flex shrink-0"
          >
            {items.map((r) => (
              <div
                key={`${copy}-${r.id}`}
                className="pr-4 sm:pr-5"
              >
                <Card r={r} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reviews({
  reviews,
  totalCount,
  title = "Loved by people who've logged off.",
}: ReviewsProps) {
  const list = reviews && reviews.length > 0 ? reviews : SAMPLE;
  const average = list.reduce((sum, r) => sum + r.rating, 0) / list.length;
  const count = totalCount ?? list.length;

  // Split into two rows so each row shows different faces.
  const half = Math.ceil(list.length / 2);
  const rowA = list.slice(0, half);
  const rowB = list.slice(half).length > 0 ? list.slice(half) : list;

  return (
    <section
      aria-labelledby="reviews-heading"
      className="relative overflow-hidden bg-stone/25 py-16 sm:py-24"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-x-12 gap-y-8 px-5 sm:px-6">
        <h2
          id="reviews-heading"
          className="max-w-[17ch] font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
        >
          {title}
        </h2>

        <div className="flex items-center gap-5">
          <p className="font-serif text-6xl font-light leading-none text-ink sm:text-7xl">
            {average.toFixed(1)}
          </p>
          <div className="leading-tight">
            <Stars value={average} />
            <p className="mt-2 text-sm text-muted">
              From {count.toLocaleString("en-ZA")}{" "}
              {count === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-12 space-y-4 sm:mt-14 sm:space-y-5">
        <Row
          items={rowA}
          seconds={Math.max(40, rowA.length * 9)}
        />
        <Row
          items={rowB}
          reverse
          seconds={Math.max(44, rowB.length * 10)}
        />
      </div>
    </section>
  );
}
