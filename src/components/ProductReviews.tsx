"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ProductReview = {
  id: string;
  name: string;
  /** 1 to 5 */
  rating: number;
  title?: string | null;
  text: string;
  /** ISO date, e.g. "2026-09-30". */
  date: string;
  verified?: boolean;
};

export type NewReview = {
  rating: number;
  name: string;
  title: string;
  text: string;
};

type ProductReviewsProps = {
  productName: string;
  reviews?: ProductReview[];
  /** Save the review. Throw to show an error. Without it the form says reviews aren't connected yet. */
  onSubmit?: (review: NewReview) => Promise<void>;
};

type SortKey = "newest" | "highest" | "lowest";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const PAGE_SIZE = 5;

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest" },
  { key: "highest", label: "Highest rated" },
  { key: "lowest", label: "Lowest rated" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC", // same output on the server and in the browser
  });

function Stars({
  value,
  size = 16,
  label = true,
}: {
  value: number;
  size?: number;
  label?: boolean;
}) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? `${value} out of 5 stars` : undefined}
      aria-hidden={label ? undefined : true}
      className="inline-flex gap-0.5 text-gold-deep"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          width={size}
          height={size}
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

export default function ProductReviews({
  productName,
  reviews = [],
  onSubmit,
}: ProductReviewsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [pager, setPager] = useState({ sig: "", count: PAGE_SIZE });
  const [formOpen, setFormOpen] = useState(false);

  // Form
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<{
    rating?: string;
    name?: string;
    text?: string;
  }>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [formError, setFormError] = useState("");

  // Bars fill in once the section scrolls into view (set from the observer callback)
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
    : 0;

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((star) => ({
        star,
        n: reviews.filter((r) => Math.round(r.rating) === star).length,
      })),
    [reviews],
  );

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === "newest")
      list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else if (sort === "highest") list.sort((a, b) => b.rating - a.rating);
    else list.sort((a, b) => a.rating - b.rating);
    return list;
  }, [reviews, sort]);

  // The visible count belongs to the sort it was set under, so changing the
  // sort falls back to one page without an effect.
  const shown = pager.sig === sort ? pager.count : PAGE_SIZE;
  const visible = sorted.slice(0, shown);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const found: typeof errors = {};
    if (rating === 0) found.rating = "Choose a star rating.";
    if (!name.trim()) found.name = "Tell us your name.";
    if (text.trim().length < 10)
      found.text = "Add a little more detail, at least 10 characters.";
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      if (!onSubmit) throw new Error("not-connected");
      await onSubmit({
        rating,
        name: name.trim(),
        title: title.trim(),
        text: text.trim(),
      });
      setDone(true);
    } catch (err) {
      setFormError(
        err instanceof Error && err.message === "not-connected"
          ? "Reviews aren't connected yet."
          : "We couldn't save your review. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const inputClass = (error?: string) =>
    `w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-ink focus:outline-none ${
      error ? "border-sale" : "border-line hover:border-ink/40"
    }`;

  const shownRating = hover || rating;

  return (
    <section
      id="reviews"
      ref={sectionRef}
      aria-labelledby="reviews-title"
      className="mx-auto max-w-7xl scroll-mt-40 border-t border-line px-5 py-16 sm:px-6 sm:py-24"
    >
      <h2
        id="reviews-title"
        className="font-serif text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
      >
        Reviews
      </h2>

      <div className="mt-12 grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* Summary + write */}
        <div className="lg:col-span-4">
          {count > 0 ? (
            <>
              <div className="flex items-end gap-5">
                <p className="font-serif text-8xl font-light leading-none tabular-nums text-ink">
                  {average.toFixed(1)}
                </p>
                <div className="pb-2">
                  <Stars
                    value={average}
                    size={20}
                  />
                  <p className="mt-2 text-sm text-muted">
                    {count} {count === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </div>

              <ul
                className="mt-8 space-y-3"
                aria-label="Rating breakdown"
              >
                {distribution.map((d) => (
                  <li
                    key={d.star}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="w-8 tabular-nums text-ink">{d.star}★</span>
                    <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-line">
                      <span
                        className={`absolute inset-y-0 left-0 rounded-full bg-gold transition-[width] duration-[1200ms] ${EASE}`}
                        style={{
                          width: seen ? `${(d.n / count) * 100}%` : "0%",
                          transitionDelay: `${(5 - d.star) * 90}ms`,
                        }}
                      />
                    </span>
                    <span className="w-6 text-right tabular-nums text-muted">
                      {d.n}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="max-w-[30ch] text-lg leading-relaxed text-muted">
              No reviews yet. Be the first to share what you think.
            </p>
          )}

          <button
            type="button"
            aria-expanded={formOpen}
            aria-controls="review-form"
            onClick={() => setFormOpen((o) => !o)}
            className={`group relative mt-10 h-14 w-full overflow-hidden rounded-full border border-ink text-[15px] text-ink transition-colors duration-500 hover:text-white ${
              formOpen ? "bg-ink text-white" : ""
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute inset-0 -translate-x-full bg-ink transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
            />
            <span className="relative">
              {formOpen ? "Close" : "Write a review"}
            </span>
          </button>

          {/* Form */}
          <div
            id="review-form"
            inert={!formOpen}
            className={`grid transition-[grid-template-rows] duration-700 ${EASE} ${
              formOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              {done ? (
                <div
                  role="status"
                  className="animate-fade-up pt-8"
                >
                  <p className="font-serif text-3xl font-light text-ink">
                    Thank you.
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">
                    Your review of {productName} has been received.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  noValidate
                  className="space-y-5 pt-8"
                >
                  <fieldset>
                    <legend className="mb-2 text-sm text-ink">
                      Your rating
                    </legend>
                    <div
                      className="inline-flex"
                      onMouseLeave={() => setHover(0)}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label
                          key={n}
                          onMouseEnter={() => setHover(n)}
                          className="cursor-pointer p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep"
                        >
                          <input
                            type="radio"
                            name="rating"
                            value={n}
                            checked={rating === n}
                            onChange={() => {
                              setRating(n);
                              setErrors((x) => ({ ...x, rating: undefined }));
                            }}
                            className="sr-only"
                          />
                          <span className="sr-only">
                            {n} {n === 1 ? "star" : "stars"}
                          </span>
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                            fill={n <= shownRating ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                            className={`transition-all duration-300 ${
                              n <= shownRating
                                ? "scale-110 text-gold-deep"
                                : "text-stone"
                            }`}
                          >
                            <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.7l5.9-.8L12 3.5Z" />
                          </svg>
                        </label>
                      ))}
                    </div>
                    {errors.rating && (
                      <p
                        role="alert"
                        className="mt-1 text-sm text-sale"
                      >
                        {errors.rating}
                      </p>
                    )}
                  </fieldset>

                  <div>
                    <label
                      htmlFor="rv-name"
                      className="mb-2 block text-sm text-ink"
                    >
                      Your name
                    </label>
                    <input
                      id="rv-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors((x) => ({ ...x, name: undefined }));
                      }}
                      autoComplete="given-name"
                      aria-invalid={!!errors.name}
                      className={`${inputClass(errors.name)} h-14`}
                    />
                    {errors.name && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm text-sale"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="rv-title"
                      className="mb-2 block text-sm text-ink"
                    >
                      Headline <span className="text-muted">(optional)</span>
                    </label>
                    <input
                      id="rv-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={`${inputClass()} h-14`}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="rv-text"
                      className="mb-2 block text-sm text-ink"
                    >
                      Your review
                    </label>
                    <textarea
                      id="rv-text"
                      rows={5}
                      value={text}
                      onChange={(e) => {
                        setText(e.target.value);
                        setErrors((x) => ({ ...x, text: undefined }));
                      }}
                      aria-invalid={!!errors.text}
                      className={`${inputClass(errors.text)} resize-none py-3.5 leading-relaxed`}
                    />
                    {errors.text && (
                      <p
                        role="alert"
                        className="mt-1.5 text-sm text-sale"
                      >
                        {errors.text}
                      </p>
                    )}
                  </div>

                  {formError && (
                    <p
                      role="alert"
                      className="rounded-2xl bg-sale/10 px-5 py-4 text-[15px] text-sale"
                    >
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={busy}
                    className="flex h-14 w-full items-center justify-center rounded-full bg-ink text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink disabled:pointer-events-none disabled:opacity-60"
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                        Sending
                      </span>
                    ) : (
                      "Submit review"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-8">
          {count > 0 && (
            <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
              <p
                aria-live="polite"
                className="text-sm text-muted"
              >
                Showing {visible.length} of {count}
              </p>
              <label className="flex items-center gap-3 text-sm text-muted">
                Sort by
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
          )}

          <ul key={sort}>
            {visible.map((r, i) => (
              <li
                key={r.id}
                className="animate-fade-up border-b border-line py-8"
                style={{ animationDelay: `${(i % PAGE_SIZE) * 70}ms` }}
              >
                <article>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars value={r.rating} />
                    <time
                      dateTime={r.date}
                      className="text-sm text-muted"
                    >
                      {formatDate(r.date)}
                    </time>
                  </div>
                  {r.title && (
                    <h3 className="mt-4 font-serif text-2xl font-light leading-snug text-ink">
                      {r.title}
                    </h3>
                  )}
                  <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-ink/80">
                    {r.text}
                  </p>
                  <p className="mt-4 flex items-center gap-3 text-sm text-ink">
                    {r.name}
                    {r.verified && (
                      <span className="rounded-full bg-sage/30 px-3 py-1 text-xs text-ink">
                        Verified buyer
                      </span>
                    )}
                  </p>
                </article>
              </li>
            ))}
          </ul>

          {count > shown && (
            <button
              type="button"
              onClick={() => setPager({ sig: sort, count: shown + PAGE_SIZE })}
              className="mt-10 h-14 rounded-full border border-ink px-10 text-[15px] text-ink transition-colors duration-300 hover:bg-ink hover:text-white"
            >
              Show more reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
