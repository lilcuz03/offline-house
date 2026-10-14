"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type PolicySection = {
  /** Used for the #anchor and the contents list. Lowercase, no spaces. */
  id: string;
  title: string;
  paragraphs?: string[];
  /** Rendered as a bulleted list after the paragraphs. */
  list?: string[];
  /** Anything richer, such as links or tables. */
  content?: React.ReactNode;
};

type PolicyPageProps = {
  title: string;
  /** e.g. "14 October 2026". Shown as "Last updated ...". */
  updated?: string;
  intro?: string;
  sections: PolicySection[];
  /** Where the "Questions?" link goes. Defaults to the help centre. */
  contactHref?: string;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

export default function PolicyPage({
  title,
  updated,
  intro,
  sections,
  contactHref = "/help",
}: PolicyPageProps) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  // Scroll-spy: the section crossing the upper part of the screen is "current".
  // State is set from the observer callback, which is an external event.
  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => !!el);
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  return (
    <article
      aria-labelledby="policy-heading"
      className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:px-6 sm:pt-16"
    >
      <header className="max-w-3xl">
        <h1
          id="policy-heading"
          className="font-serif text-[clamp(2.75rem,8vw,6.5rem)] font-light leading-[0.96] tracking-[-0.02em] text-ink"
        >
          <span className="mask-word">
            <span className="animate-word-up">{title}</span>
          </span>
        </h1>
        {updated && (
          <p
            className="animate-fade-up mt-5 text-sm text-muted"
            style={{ animationDelay: "250ms" }}
          >
            Last updated {updated}
          </p>
        )}
        {intro && (
          <p
            className="animate-fade-up mt-6 text-lg leading-relaxed text-ink/80 sm:text-xl"
            style={{ animationDelay: "350ms" }}
          >
            {intro}
          </p>
        )}
      </header>

      {/* Mobile contents: a scrolling row of chips */}
      <nav
        aria-label="On this page"
        className="mt-10 lg:hidden"
      >
        <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <li
              key={s.id}
              className="shrink-0"
            >
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={`inline-block rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${
                  active === s.id
                    ? "border-ink bg-ink text-white"
                    : "border-line text-ink hover:border-ink"
                }`}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-12 grid gap-14 lg:mt-16 lg:grid-cols-12">
        {/* Desktop contents: sticky, with a gold marker that follows you */}
        <nav
          aria-label="On this page"
          className="hidden lg:col-span-3 lg:block"
        >
          <div className="sticky top-40">
            <p className="text-sm text-muted">On this page</p>
            <ol className="relative mt-4 border-l border-line">
              {sections.map((s, i) => {
                const on = active === s.id;
                return (
                  <li
                    key={s.id}
                    className="relative"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute -left-px top-1/2 h-6 w-[2px] -translate-y-1/2 bg-gold transition-all duration-500 ${EASE} ${
                        on ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0"
                      }`}
                    />
                    <a
                      href={`#${s.id}`}
                      aria-current={on ? "true" : undefined}
                      className={`flex gap-3 py-2.5 pl-5 text-[15px] leading-snug transition-all duration-300 ${
                        on
                          ? "translate-x-1 text-ink"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      <span className="tabular-nums text-muted/60">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {s.title}
                    </a>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>

        {/* Sections */}
        <div className="lg:col-span-8 lg:col-start-5">
          {sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-title`}
              className="scroll-mt-44 border-t border-line py-10 first:border-t-0 first:pt-0 sm:py-14"
            >
              <h2
                id={`${s.id}-title`}
                className="group flex items-baseline gap-4 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl"
              >
                <span
                  aria-hidden="true"
                  className="font-sans text-sm tabular-nums text-muted/60"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {s.title}
                <a
                  href={`#${s.id}`}
                  aria-label={`Link to ${s.title}`}
                  className="text-xl text-muted opacity-0 transition-opacity duration-300 hover:text-gold-deep focus-visible:opacity-100 group-hover:opacity-100"
                >
                  #
                </a>
              </h2>

              <div className="mt-6 max-w-[65ch] space-y-5 text-base leading-relaxed text-ink/80">
                {s.paragraphs?.map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
                {s.list && s.list.length > 0 && (
                  <ul className="space-y-2.5">
                    {s.list.map((item, k) => (
                      <li
                        key={k}
                        className="flex gap-3"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-[0.7em] h-[5px] w-[5px] shrink-0 rounded-full bg-gold"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {s.content}
              </div>
            </section>
          ))}

          {/* Footer of the page */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-ink px-7 py-7 text-white">
            <p className="font-serif text-2xl font-light">
              Questions about this?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={contactHref}
                className="inline-flex h-12 items-center rounded-full bg-ivory px-7 text-sm text-ink transition-colors duration-300 hover:bg-gold"
              >
                Get in touch
              </Link>
              <a
                href="#policy-heading"
                className="inline-flex h-12 items-center rounded-full border border-white/30 px-7 text-sm text-white transition-colors duration-300 hover:border-gold hover:text-gold"
              >
                Back to top
              </a>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
