"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type FaqItem = {
  category: string;
  question: string;
  answer: string;
};

type HelpCenterProps = {
  faqs?: FaqItem[];
  email?: string;
  /** Digits only with country code, e.g. 27821234567. Shows a WhatsApp button. */
  whatsapp?: string;
};

/* PLACEHOLDER answers. Replace every one with your real policies before launch. */
const SAMPLE_FAQS: FaqItem[] = [
  {
    category: "Orders",
    question: "How do I track my order?",
    answer:
      "Use the Track order page with your order number and the email you ordered with. You'll find the number in your confirmation email.",
  },
  {
    category: "Orders",
    question: "Can I change or cancel my order?",
    answer:
      "Contact us as soon as you can with your order number. If your order hasn't been packed yet, we'll update or cancel it for you.",
  },
  {
    category: "Delivery",
    question: "Where do you deliver?",
    answer:
      "We deliver across South Africa. Delivery options and prices are shown at checkout once you enter your address.",
  },
  {
    category: "Delivery",
    question: "How long will my order take?",
    answer:
      "Delivery times depend on the method you choose at checkout and where you live. Your confirmation email shows the estimate for your order.",
  },
  {
    category: "Returns",
    question: "How do I return something?",
    answer:
      "Send it back unused and in its original packaging. Get in touch with your order number and we'll guide you through the next steps.",
  },
  {
    category: "Returns",
    question: "When will I get my refund?",
    answer:
      "Once we've received and checked your return, we'll refund the original payment method and let you know by email.",
  },
  {
    category: "Products",
    question: "Do your tech products come with a warranty?",
    answer:
      "Tech items carry a warranty against manufacturing faults. If something stops working, contact us and we'll sort a repair, replacement or refund.",
  },
  {
    category: "Products",
    question: "Which charger or cable is right for my phone?",
    answer:
      "Check the product page for compatibility and charging speeds. If you're unsure, message us with your phone model and we'll point you to the right one.",
  },
];

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

export default function HelpCenter({ faqs, email, whatsapp }: HelpCenterProps) {
  const list = faqs && faqs.length > 0 ? faqs : SAMPLE_FAQS;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [open, setOpen] = useState<string | null>(null);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(list.map((f) => f.category)))],
    [list],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list.filter(
      (f) =>
        (category === "All" || f.category === category) &&
        (!q ||
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)),
    );
  }, [list, query, category]);

  const hasContact = !!email || !!whatsapp;

  return (
    <section
      aria-labelledby="help-heading"
      className="mx-auto max-w-4xl px-5 pb-24 pt-10 sm:px-6 sm:pt-16"
    >
      <h1
        id="help-heading"
        className="font-serif text-[clamp(2.75rem,8vw,6rem)] font-light leading-[0.96] tracking-[-0.02em] text-ink"
      >
        <span className="mask-word">
          <span className="animate-word-up">How can we help?</span>
        </span>
      </h1>

      {/* Search */}
      <div
        className="animate-fade-up mt-10"
        style={{ animationDelay: "250ms" }}
      >
        <label
          htmlFor="help-search"
          className="sr-only"
        >
          Search help articles
        </label>
        <div className="flex items-center gap-4 border-b-2 border-ink pb-3 text-ink">
          <SearchIcon />
          <input
            id="help-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(null);
            }}
            placeholder="Search delivery, returns, warranty"
            autoComplete="off"
            className="w-full bg-transparent text-xl placeholder:text-muted/70 focus:outline-none sm:text-2xl"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl hover:bg-stone/40"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      <ul
        className="animate-fade-up mt-8 flex flex-wrap gap-2"
        style={{ animationDelay: "350ms" }}
      >
        {categories.map((c) => (
          <li key={c}>
            <button
              type="button"
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c);
                setOpen(null);
              }}
              className={`rounded-full border px-5 py-2.5 text-sm transition-all duration-300 ${
                category === c
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {c}
            </button>
          </li>
        ))}
      </ul>

      {/* Answers */}
      <p
        aria-live="polite"
        className="mt-8 text-sm text-muted"
      >
        {results.length} {results.length === 1 ? "answer" : "answers"}
      </p>

      {results.length > 0 ? (
        <ul
          key={`${category}|${query}`}
          className="mt-2 border-t border-line"
        >
          {results.map((f, i) => {
            const id = `faq-${list.indexOf(f)}`;
            const isOpen = open === id;
            return (
              <li
                key={id}
                className="animate-fade-up border-b border-line"
                style={{ animationDelay: `${Math.min(i, 8) * 55}ms` }}
              >
                <h2>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`${id}-panel`}
                    onClick={() => setOpen(isOpen ? null : id)}
                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                  >
                    <span className="font-serif text-2xl font-light leading-snug text-ink sm:text-3xl">
                      {f.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-xl leading-none transition-all duration-500 ${EASE} ${
                        isOpen
                          ? "rotate-45 border-ink bg-ink text-white"
                          : "border-line text-ink"
                      }`}
                    >
                      +
                    </span>
                  </button>
                </h2>
                <div
                  id={`${id}-panel`}
                  role="region"
                  inert={!isOpen}
                  className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="max-w-[60ch] pb-7 text-base leading-relaxed text-muted">
                      {f.answer}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="animate-fade-up mt-4 rounded-3xl border border-line bg-white/60 px-6 py-14 text-center">
          <p className="font-serif text-3xl font-light text-ink">
            No answers for that.
          </p>
          <p className="mt-3 text-muted">
            Try fewer words, or ask us directly below.
          </p>
        </div>
      )}

      {/* Contact */}
      {hasContact && (
        <div className="mt-16 rounded-[32px] bg-ink p-8 text-white sm:p-12">
          <h2 className="font-serif text-4xl font-light leading-none sm:text-5xl">
            Still stuck?
          </h2>
          <p className="mt-4 max-w-[44ch] text-white/70">
            Send us a message and we&apos;ll get back to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex h-14 items-center rounded-full bg-ivory px-8 text-[15px] text-ink transition-colors duration-300 hover:bg-gold"
              >
                Email us
              </a>
            )}
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-14 items-center rounded-full border border-white/30 px-8 text-[15px] text-white transition-colors duration-300 hover:border-gold hover:bg-gold hover:text-ink"
              >
                Chat on WhatsApp
              </a>
            )}
            <Link
              href="/track-order"
              className="inline-flex h-14 items-center rounded-full px-6 text-[15px] text-white/80 underline underline-offset-4 transition-colors hover:text-gold"
            >
              Track an order
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
