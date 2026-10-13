"use client";

import { useRef, useState } from "react";

type NewsletterProps = {
  /** Called with the email. Throw to show an error. Defaults to POST /api/newsletter. */
  onSubscribe?: (email: string) => Promise<void>;
};

type Status = "idle" | "loading" | "success" | "error";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function defaultSubscribe(email: string) {
  const res = await fetch("/api/newsletter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error("Request failed");
}

export default function Newsletter({ onSubscribe }: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const trap = useRef<HTMLInputElement>(null);

  const connected = status === "success";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;

    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      setMessage("That email doesn't look right. Check it and try again.");
      input.current?.focus();
      return;
    }

    // Honeypot: bots fill the hidden field, people never see it.
    if (trap.current?.value) {
      setStatus("success");
      return;
    }

    setStatus("loading");
    setMessage("");
    try {
      await (onSubscribe ?? defaultSubscribe)(value);
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("Something went wrong on our side. Please try again.");
    }
  };

  const reset = () => {
    setEmail("");
    setStatus("idle");
    setMessage("");
    setTimeout(() => input.current?.focus(), 50);
  };

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="px-2 py-4 sm:px-4 sm:py-8"
    >
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-line bg-white sm:rounded-[48px]">
        {/* Gold glow that warms up when you connect */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-gold blur-3xl transition-opacity duration-1000 ${
            connected ? "opacity-50" : "opacity-15"
          }`}
        />

        <div className="relative grid gap-10 px-6 pb-6 pt-12 sm:px-12 sm:pt-16 lg:grid-cols-12 lg:items-center lg:gap-14 lg:px-16">
          <div className="lg:col-span-7">
            <h2
              id="newsletter-heading"
              className="max-w-[14ch] font-serif text-[clamp(2.5rem,6vw,4.75rem)] font-light leading-[0.98] tracking-[-0.01em] text-ink"
            >
              Stay plugged in, minus the noise.
            </h2>
            <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted sm:text-lg">
              One email a month. New drops, restocks and first access to deals.
              Nothing else.
            </p>
          </div>

          <div className="lg:col-span-5">
            {!connected ? (
              <form
                onSubmit={submit}
                noValidate
              >
                <label
                  htmlFor="newsletter-email"
                  className="sr-only"
                >
                  Email address
                </label>
                <div
                  className={`flex items-center rounded-full border bg-ivory p-1.5 transition-colors duration-300 focus-within:border-ink ${
                    status === "error" ? "border-sale" : "border-line"
                  }`}
                >
                  <input
                    id="newsletter-email"
                    ref={input}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (status === "error") setStatus("idle");
                    }}
                    placeholder="Your email address"
                    aria-invalid={status === "error"}
                    aria-describedby="newsletter-msg"
                    className="min-w-0 flex-1 bg-transparent px-5 py-3 text-[15px] text-ink placeholder:text-muted/70 focus:outline-none"
                  />
                  {/* hidden honeypot */}
                  <input
                    ref={trap}
                    type="text"
                    name="company"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  />
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className={`group relative inline-flex h-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink px-6 text-sm text-white transition-transform duration-500 ${EASE} hover:scale-[1.03] active:scale-[0.97] disabled:pointer-events-none sm:px-8`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
                    />
                    <span className="relative transition-colors duration-500 group-hover:text-ink">
                      {status === "loading" ? (
                        <span className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                          />
                          Connecting
                        </span>
                      ) : (
                        "Subscribe"
                      )}
                    </span>
                  </button>
                </div>
                <p
                  id="newsletter-msg"
                  role={status === "error" ? "alert" : undefined}
                  className={`mt-3 min-h-5 px-2 text-sm ${
                    status === "error" ? "text-sale" : "text-muted"
                  }`}
                >
                  {status === "error"
                    ? message
                    : "No spam. Unsubscribe whenever you like."}
                </p>
              </form>
            ) : (
              <div
                role="status"
                className="rounded-3xl bg-ivory p-6"
              >
                <div className="flex items-center gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gold text-ink">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path
                        d="m5 12.5 4.5 4.5L19 7.5"
                        pathLength={1}
                        className="animate-draw"
                        style={{
                          animationDuration: "0.6s",
                          animationDelay: "0.2s",
                        }}
                      />
                    </svg>
                  </span>
                  <div className="leading-tight">
                    <p className="font-serif text-2xl text-ink">
                      You&apos;re connected.
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Watch your inbox for a welcome from us.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-5 text-sm text-ink underline underline-offset-4 transition-colors hover:text-gold-deep"
                >
                  Use a different email
                </button>
              </div>
            )}
          </div>
        </div>

        {/* The cable: plugs into the socket when you subscribe */}
        <div
          aria-hidden="true"
          className="relative mt-8 px-6 pb-8 sm:px-12 lg:px-16"
        >
          <svg
            viewBox="0 0 600 60"
            className="mx-auto h-auto w-full max-w-3xl overflow-visible"
          >
            {/* cable */}
            <line
              x1="0"
              y1="30"
              x2="430"
              y2="30"
              stroke="var(--ink)"
              strokeWidth="3"
              strokeLinecap="round"
              style={{
                transformBox: "fill-box",
                transformOrigin: "left center",
                transform: connected ? "scaleX(1)" : "scaleX(0.78)",
                transition: "transform 1s cubic-bezier(0.22,1,0.36,1)",
              }}
            />
            {/* plug */}
            <g
              style={{
                transform: connected ? "translateX(0)" : "translateX(-95px)",
                transition: "transform 1s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <rect
                x="430"
                y="16"
                width="44"
                height="28"
                rx="8"
                fill="var(--ink)"
              />
              <rect
                x="474"
                y="22"
                width="30"
                height="5"
                rx="2.5"
                fill="var(--ink)"
              />
              <rect
                x="474"
                y="33"
                width="30"
                height="5"
                rx="2.5"
                fill="var(--ink)"
              />
            </g>
            {/* socket */}
            <rect
              x="498"
              y="6"
              width="100"
              height="48"
              rx="14"
              fill={connected ? "var(--gold)" : "var(--ivory)"}
              stroke="var(--ink)"
              strokeWidth="2"
              style={{ transition: "fill 0.6s ease 0.7s" }}
            />
            <rect
              x="508"
              y="21"
              width="12"
              height="5"
              rx="2.5"
              fill="var(--ink)"
              opacity="0.7"
            />
            <rect
              x="508"
              y="34"
              width="12"
              height="5"
              rx="2.5"
              fill="var(--ink)"
              opacity="0.7"
            />
            <circle
              cx="568"
              cy="30"
              r="5"
              fill={connected ? "var(--ink)" : "var(--stone)"}
              style={{ transition: "fill 0.6s ease 0.8s" }}
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
