"use client";

import { useState } from "react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ComingSoonForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setState("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Something went wrong. Try again.");
      }
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="mt-10 rounded-full border border-line bg-white/70 px-7 py-4 text-[15px] text-ink">
        You&apos;re on the list. We&apos;ll email you the day we open.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="mt-10 w-full max-w-md"
    >
      <label
        htmlFor="soon-email"
        className="sr-only"
      >
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="soon-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-invalid={error ? true : undefined}
          className="h-14 flex-1 rounded-full border border-line bg-white/70 px-6 text-[15px] text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="h-14 rounded-full bg-ink px-8 text-[15px] text-white transition-colors hover:bg-gold hover:text-ink disabled:opacity-60"
        >
          {state === "busy" ? "Sending…" : "Notify me"}
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-sale"
        >
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        One email when we open. No spam.
      </p>
    </form>
  );
}
