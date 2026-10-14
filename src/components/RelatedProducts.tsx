"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { Product } from "../components/home/bestseller";
import ProductCard from "./ProductCard";

type RelatedProductsProps = {
  products: Product[];
  title?: string;
  /** "See all" link. Hidden when omitted. */
  href?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const Arrow = ({ dir }: { dir: "left" | "right" }) => (
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

export default function RelatedProducts({
  products,
  title = "You may also like",
  href,
}: RelatedProductsProps) {
  const [rail, setRail] = useState<HTMLUListElement | null>(null);
  const [seen, setSeen] = useState(false);
  const [section, setSection] = useState<HTMLElement | null>(null);

  // Slide the cards in once the section is on screen (set from the observer callback)
  useEffect(() => {
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(section);
    return () => io.disconnect();
  }, [section]);

  // The rail's scroll position lives in the DOM, so it is read through a
  // subscription. The snapshot is a primitive string, which stays stable
  // between reads.
  const subscribe = useCallback(
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
  const getSnapshot = useCallback(
    () =>
      rail
        ? `${Math.round(rail.scrollLeft)}|${rail.scrollWidth}|${rail.clientWidth}`
        : "0|1|1",
    [rail],
  );
  const metrics = useSyncExternalStore(subscribe, getSnapshot, () => "0|1|1");

  const { thumb, atStart, atEnd, overflows } = useMemo(() => {
    const [left, width, client] = metrics.split("|").map(Number);
    return {
      thumb: {
        w: Math.min(100, (client / width) * 100),
        l: (left / width) * 100,
      },
      atStart: left < 4,
      atEnd: left + client >= width - 4,
      overflows: width > client + 4,
    };
  }, [metrics]);

  const page = (dir: 1 | -1) =>
    rail?.scrollBy({ left: dir * rail.clientWidth * 0.85, behavior: "smooth" });

  if (products.length === 0) return null;

  const arrowBtn =
    "grid h-12 w-12 place-items-center rounded-full border border-line text-ink transition-all duration-300 hover:border-ink hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30";

  return (
    <section
      ref={setSection}
      aria-labelledby="related-title"
      className="mx-auto max-w-7xl border-t border-line px-5 py-16 sm:px-6 sm:py-24"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <h2
          id="related-title"
          className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
        >
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {href && (
            <Link
              href={href}
              className="group mr-2 hidden items-center gap-3 border-b border-ink pb-1 text-sm text-ink transition-colors hover:border-gold-deep hover:text-gold-deep sm:inline-flex"
            >
              See all
              <span
                aria-hidden="true"
                className={`transition-transform duration-500 ${EASE} group-hover:translate-x-1.5`}
              >
                →
              </span>
            </Link>
          )}
          {overflows && (
            <>
              <button
                type="button"
                aria-label="Previous products"
                disabled={atStart}
                onClick={() => page(-1)}
                className={arrowBtn}
              >
                <Arrow dir="left" />
              </button>
              <button
                type="button"
                aria-label="Next products"
                disabled={atEnd}
                onClick={() => page(1)}
                className={arrowBtn}
              >
                <Arrow dir="right" />
              </button>
            </>
          )}
        </div>
      </div>

      <ul
        ref={setRail}
        aria-roledescription="carousel"
        aria-label={title}
        className="-mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-5 pb-2 [scrollbar-width:none] sm:-mx-6 sm:gap-5 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p, i) => (
          <li
            key={p.id}
            style={{ transitionDelay: `${Math.min(i, 5) * 90}ms` }}
            className={`w-[62%] shrink-0 snap-start transition-[opacity,transform] duration-[900ms] ${EASE} sm:w-[38%] md:w-[28%] lg:w-[23%] ${
              seen ? "translate-x-0 opacity-100" : "translate-x-16 opacity-0"
            }`}
          >
            <ProductCard product={p} />
          </li>
        ))}
      </ul>

      {overflows && (
        <div
          aria-hidden="true"
          className="relative mt-8 h-px w-full bg-line"
        >
          <span
            className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gold transition-[left,width] duration-200 ease-out"
            style={{ left: `${thumb.l}%`, width: `${thumb.w}%` }}
          />
        </div>
      )}
    </section>
  );
}
