"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export type ContactPayload = {
  name: string;
  email: string;
  topic: string;
  orderNumber: string;
  message: string;
};

type ContactFormProps = {
  /** Send the message. Throw to show an error. Defaults to POST /api/contact. */
  onSubmit?: (payload: ContactPayload) => Promise<void>;
  email?: string;
  /** Digits only with country code, e.g. 27821234567. */
  whatsapp?: string;
  /** Plain lines such as "Monday to Friday, 9:00 to 17:00". */
  hours?: string[];
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const MAX_MESSAGE = 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const TOPICS = [
  "An order I've placed",
  "Delivery",
  "Returns and refunds",
  "A product question",
  "Something else",
];

type Fields = ContactPayload;
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  name: "",
  email: "",
  topic: "",
  orderNumber: "",
  message: "",
};

async function defaultSubmit(payload: ContactPayload) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Request failed");
}

const inputClass = (error?: string) =>
  `h-14 w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-ink focus:outline-none ${
    error ? "border-sale" : "border-line hover:border-ink/40"
  }`;

function validate(v: Fields): Errors {
  const e: Errors = {};
  if (!v.name.trim()) e.name = "Tell us your name.";
  if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";
  if (!v.topic) e.topic = "Choose what this is about.";
  if (v.message.trim().length < 10)
    e.message = "Add a little more detail, at least 10 characters.";
  return e;
}

export default function ContactForm({
  onSubmit,
  email,
  whatsapp,
  hours,
}: ContactFormProps) {
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const trap = useRef<HTMLInputElement>(null);

  const set =
    (key: keyof Fields) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >,
    ) => {
      setValues((v) => ({ ...v, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const found = validate(values);
    setErrors(found);
    setFormError("");

    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    // Honeypot: bots fill the hidden field, people never see it.
    if (trap.current?.value) {
      setSent(true);
      return;
    }

    setBusy(true);
    try {
      await (onSubmit ?? defaultSubmit)({
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      });
      setSent(true);
    } catch {
      setFormError(
        "We couldn't send your message. Please try again, or email us directly.",
      );
    } finally {
      setBusy(false);
    }
  };

  const again = () => {
    setValues(EMPTY);
    setErrors({});
    setSent(false);
  };

  const left = MAX_MESSAGE - values.message.length;

  return (
    <section
      aria-labelledby="contact-heading"
      className="mx-auto max-w-7xl px-5 pb-28 pt-10 sm:px-6 sm:pt-16"
    >
      <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
        {/* Left: who and how */}
        <div className="lg:col-span-5">
          <h1
            id="contact-heading"
            className="font-serif text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.95] tracking-[-0.02em] text-ink"
          >
            <span className="mask-word">
              <span className="animate-word-up">Say hello.</span>
            </span>
          </h1>
          <p
            className="animate-fade-up mt-6 max-w-[40ch] text-base leading-relaxed text-muted sm:text-lg"
            style={{ animationDelay: "250ms" }}
          >
            Questions about an order, a product or anything else. A real person
            reads every message.
          </p>

          <ul
            className="animate-fade-up mt-10 space-y-4"
            style={{ animationDelay: "380ms" }}
          >
            {email && (
              <li>
                <a
                  href={`mailto:${email}`}
                  className={`group flex items-center justify-between rounded-2xl border border-line bg-white/60 px-6 py-5 transition-all duration-500 ${EASE} hover:border-ink hover:bg-white`}
                >
                  <span className="leading-tight">
                    <span className="block text-sm text-muted">Email</span>
                    <span className="mt-1 block text-[15px] text-ink">
                      {email}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-xl text-ink transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
                  >
                    →
                  </span>
                </a>
              </li>
            )}
            {whatsapp && (
              <li>
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group flex items-center justify-between rounded-2xl border border-line bg-white/60 px-6 py-5 transition-all duration-500 ${EASE} hover:border-ink hover:bg-white`}
                >
                  <span className="leading-tight">
                    <span className="block text-sm text-muted">WhatsApp</span>
                    <span className="mt-1 block text-[15px] text-ink">
                      Chat with us
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`text-xl text-ink transition-transform duration-500 ${EASE} group-hover:translate-x-1`}
                  >
                    →
                  </span>
                </a>
              </li>
            )}
          </ul>

          {hours && hours.length > 0 && (
            <div
              className="animate-fade-up mt-8"
              style={{ animationDelay: "460ms" }}
            >
              <p className="text-sm text-muted">When we reply</p>
              <ul className="mt-2 space-y-1 text-[15px] text-ink">
                {hours.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <p
            className="animate-fade-up mt-8 text-[15px] text-muted"
            style={{ animationDelay: "540ms" }}
          >
            Looking for a quick answer? Try the{" "}
            <Link
              href="/help"
              className="text-ink underline underline-offset-4"
            >
              help centre
            </Link>{" "}
            or{" "}
            <Link
              href="/track-order"
              className="text-ink underline underline-offset-4"
            >
              track your order
            </Link>
            .
          </p>
        </div>

        {/* Right: form or sent state */}
        <div className="lg:col-span-7">
          <div className="rounded-[32px] border border-line bg-white/60 p-6 sm:p-10">
            {sent ? (
              <div
                role="status"
                className="animate-fade-up py-6 text-center"
              >
                {/* Envelope whose flap closes */}
                <svg
                  viewBox="0 0 120 90"
                  aria-hidden="true"
                  className="mx-auto h-24 w-auto overflow-visible"
                  fill="none"
                >
                  <rect
                    x="8"
                    y="22"
                    width="104"
                    height="62"
                    rx="10"
                    fill="var(--ivory)"
                    stroke="var(--ink)"
                    strokeWidth="2"
                  />
                  <path
                    d="M8 32 60 62 112 32"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                  {/* The flap starts open and closes, drawn by an SVG animation
                      so no extra CSS keyframes are needed */}
                  <path
                    d="M8 22 60 -12 112 22Z"
                    fill="var(--gold)"
                    stroke="var(--ink)"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  >
                    <animate
                      attributeName="d"
                      from="M8 22 60 -12 112 22Z"
                      to="M8 22 60 56 112 22Z"
                      dur="0.9s"
                      begin="0.2s"
                      fill="freeze"
                      calcMode="spline"
                      keyTimes="0;1"
                      keySplines="0.22 1 0.36 1"
                    />
                  </path>
                </svg>
                <h2 className="mt-8 font-serif text-5xl font-light leading-none text-ink">
                  Message sent.
                </h2>
                <p className="mx-auto mt-4 max-w-[38ch] text-[15px] leading-relaxed text-muted">
                  Thanks, {values.name.split(" ")[0]}. We&apos;ll reply to{" "}
                  <span className="text-ink">{values.email}</span> as soon as we
                  can.
                </p>
                <button
                  type="button"
                  onClick={again}
                  className="mt-8 text-sm text-ink underline underline-offset-4 hover:text-gold-deep"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                ref={formRef}
                onSubmit={submit}
                noValidate
                className="space-y-5"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="c-name"
                      className="mb-2 block text-sm text-ink"
                    >
                      Your name
                    </label>
                    <input
                      id="c-name"
                      name="name"
                      autoComplete="name"
                      value={values.name}
                      onChange={set("name")}
                      aria-invalid={!!errors.name}
                      aria-describedby={
                        errors.name ? "c-name-error" : undefined
                      }
                      className={inputClass(errors.name)}
                    />
                    {errors.name && (
                      <p
                        id="c-name-error"
                        role="alert"
                        className="mt-1.5 text-sm text-sale"
                      >
                        {errors.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="c-email"
                      className="mb-2 block text-sm text-ink"
                    >
                      Email
                    </label>
                    <input
                      id="c-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={values.email}
                      onChange={set("email")}
                      aria-invalid={!!errors.email}
                      aria-describedby={
                        errors.email ? "c-email-error" : undefined
                      }
                      className={inputClass(errors.email)}
                    />
                    {errors.email && (
                      <p
                        id="c-email-error"
                        role="alert"
                        className="mt-1.5 text-sm text-sale"
                      >
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="c-topic"
                      className="mb-2 block text-sm text-ink"
                    >
                      What is this about?
                    </label>
                    <select
                      id="c-topic"
                      name="topic"
                      value={values.topic}
                      onChange={set("topic")}
                      aria-invalid={!!errors.topic}
                      aria-describedby={
                        errors.topic ? "c-topic-error" : undefined
                      }
                      className={inputClass(errors.topic)}
                    >
                      <option value="">Choose a topic</option>
                      {TOPICS.map((t) => (
                        <option
                          key={t}
                          value={t}
                        >
                          {t}
                        </option>
                      ))}
                    </select>
                    {errors.topic && (
                      <p
                        id="c-topic-error"
                        role="alert"
                        className="mt-1.5 text-sm text-sale"
                      >
                        {errors.topic}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="c-order"
                      className="mb-2 block text-sm text-ink"
                    >
                      Order number{" "}
                      <span className="text-muted">(optional)</span>
                    </label>
                    <input
                      id="c-order"
                      name="orderNumber"
                      autoComplete="off"
                      value={values.orderNumber}
                      onChange={set("orderNumber")}
                      className={inputClass()}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-baseline justify-between">
                    <label
                      htmlFor="c-message"
                      className="text-sm text-ink"
                    >
                      Your message
                    </label>
                    <span
                      className={`text-xs tabular-nums ${
                        left < 50 ? "text-sale" : "text-muted"
                      }`}
                    >
                      {left} left
                    </span>
                  </div>
                  <textarea
                    id="c-message"
                    name="message"
                    rows={6}
                    maxLength={MAX_MESSAGE}
                    value={values.message}
                    onChange={set("message")}
                    aria-invalid={!!errors.message}
                    aria-describedby={
                      errors.message ? "c-message-error" : undefined
                    }
                    className={`w-full resize-none rounded-2xl border bg-white/70 px-4 py-3.5 text-[15px] leading-relaxed text-ink transition-colors duration-300 focus:border-ink focus:outline-none ${
                      errors.message
                        ? "border-sale"
                        : "border-line hover:border-ink/40"
                    }`}
                  />
                  {errors.message && (
                    <p
                      id="c-message-error"
                      role="alert"
                      className="mt-1.5 text-sm text-sale"
                    >
                      {errors.message}
                    </p>
                  )}
                </div>

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
                  className={`group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-full bg-ink text-base text-white transition-transform duration-500 ${EASE} hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
                  />
                  <span className="relative flex items-center gap-3 transition-colors duration-500 group-hover:text-ink">
                    {busy ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        />
                        Sending
                      </>
                    ) : (
                      "Send message"
                    )}
                  </span>
                </button>

                <p className="text-center text-sm text-muted">
                  We only use your details to reply. See our{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    privacy policy
                  </Link>
                  .
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
