"use client";

import { useState } from "react";

const field =
  "w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, left empty by people
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Please choose a star rating.");
    setBusy(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          name,
          title,
          body: text,
          website,
        }),
      });
      const data: { error?: string } | null = await res
        .json()
        .catch(() => null);
      if (!res.ok)
        throw new Error(data?.error ?? "Could not send your review.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p
        role="status"
        className="rounded-2xl border border-line bg-white/50 p-6 text-ink"
      >
        Thank you. Your review will appear once we have read it.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-4"
      noValidate
    >
      <fieldset>
        <legend className="mb-2 text-[15px] text-ink">Your rating</legend>
        <div
          className="flex gap-1"
          role="radiogroup"
          aria-label="Star rating"
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              className={`grid h-11 w-11 place-items-center rounded-full text-2xl transition-colors duration-200 ${
                n <= rating ? "text-gold-deep" : "text-stone hover:text-gold"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>

      <input
        className={`${field} h-12`}
        placeholder="Your name"
        value={name}
        maxLength={80}
        onChange={(e) => setName(e.target.value)}
        autoComplete="name"
      />
      <input
        className={`${field} h-12`}
        placeholder="Title (optional)"
        value={title}
        maxLength={100}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className={`${field} h-32 py-3`}
        placeholder="What did you think of it?"
        value={text}
        maxLength={2000}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Honeypot: hidden from people and screen readers */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          {busy ? "Sending..." : "Send review"}
        </button>
        {error && (
          <p
            role="alert"
            className="text-[15px] text-sale"
          >
            {error}
          </p>
        )}
      </div>
    </form>
  );
}
