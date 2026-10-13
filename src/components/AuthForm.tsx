"use client";

import Link from "next/link";
import { useRef, useState } from "react";

type Mode = "signin" | "signup";
type View = "form" | "check-email" | "reset-sent";

export type SignUpInput = { name: string; email: string; password: string };

type AuthFormProps = {
  /** Throw on failure; the message is shown if it's an Error. */
  onSignIn?: (email: string, password: string) => Promise<void>;
  /** Resolve with { needsConfirmation: true } if the user must confirm by email. */
  onSignUp?: (
    input: SignUpInput,
  ) => Promise<{ needsConfirmation?: boolean } | void>;
  onForgotPassword?: (email: string) => Promise<void>;
  /** Shows a "Continue with Google" button when provided. */
  onGoogle?: () => Promise<void>;
  defaultMode?: Mode;
};

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const inputClass = (error?: string) =>
  `h-14 w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-ink focus:outline-none ${
    error ? "border-sale" : "border-line hover:border-ink/40"
  }`;

export default function AuthForm({
  onSignIn,
  onSignUp,
  onForgotPassword,
  onGoogle,
  defaultMode = "signin",
}: AuthFormProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [view, setView] = useState<View>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const isSignup = mode === "signup";

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
    setFormError("");
  };

  const fail = (err: unknown, fallback: string) =>
    setFormError(
      err instanceof Error && err.message && err.message !== "not-connected"
        ? err.message
        : err instanceof Error && err.message === "not-connected"
          ? "Sign in isn't connected yet."
          : fallback,
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    const found: typeof errors = {};
    if (isSignup && !name.trim()) found.name = "Enter your name.";
    if (!EMAIL_RE.test(email.trim()))
      found.email = "Enter a valid email address.";
    if (isSignup ? password.length < 8 : password.length === 0)
      found.password = isSignup
        ? "Use at least 8 characters."
        : "Enter your password.";
    setErrors(found);
    setFormError("");

    const first = Object.keys(found)[0];
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setBusy(true);
    try {
      if (isSignup) {
        if (!onSignUp) throw new Error("not-connected");
        const res = await onSignUp({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (res && res.needsConfirmation) setView("check-email");
      } else {
        if (!onSignIn) throw new Error("not-connected");
        await onSignIn(email.trim(), password);
      }
    } catch (err) {
      fail(
        err,
        isSignup
          ? "We couldn't create your account. Please try again."
          : "That email and password don't match.",
      );
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!EMAIL_RE.test(email.trim())) {
      setErrors({
        email: "Enter your email first, then choose Forgot password.",
      });
      formRef.current?.querySelector<HTMLElement>('[name="email"]')?.focus();
      return;
    }
    setBusy(true);
    setFormError("");
    try {
      if (!onForgotPassword) throw new Error("not-connected");
      await onForgotPassword(email.trim());
      setView("reset-sent");
    } catch (err) {
      fail(err, "We couldn't send the reset email. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    if (!onGoogle || busy) return;
    setBusy(true);
    try {
      await onGoogle();
    } catch (err) {
      fail(err, "Google sign in didn't work. Please try again.");
      setBusy(false);
    }
  };

  return (
    <section
      aria-labelledby="auth-heading"
      className="mx-auto grid max-w-6xl gap-10 px-5 pb-24 pt-8 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:gap-16"
    >
      {/* Editorial panel */}
      <div className="relative hidden overflow-hidden rounded-[40px] bg-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <svg
            viewBox="0 0 100 100"
            className="animate-spin-slow absolute -bottom-24 -right-24 h-[28rem] w-[28rem] text-white/20"
            style={{ animationDuration: "80s" }}
          >
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.3"
              strokeDasharray="1 3"
            />
            <circle
              cx="50"
              cy="2"
              r="1.6"
              fill="var(--gold)"
            />
          </svg>
          <span className="animate-drift absolute -left-16 top-10 h-72 w-72 rounded-full bg-gold opacity-20 blur-3xl" />
        </div>
        <p className="relative font-serif text-xl text-white/70">
          Offline House
        </p>
        <div className="relative">
          <p className="font-serif text-6xl font-light leading-[0.98]">
            Your things,
            <br />
            all in one place.
          </p>
          <ul className="mt-8 space-y-3 text-[15px] text-white/75">
            <li>Track every order from bag to doorstep</li>
            <li>Check out faster with saved details</li>
            <li>Keep a wishlist for later</li>
          </ul>
        </div>
      </div>

      {/* Form side */}
      <div className="mx-auto w-full max-w-md self-center">
        {view === "form" && (
          <>
            <h1
              id="auth-heading"
              className="font-serif text-[clamp(2.5rem,6vw,4rem)] font-light leading-none tracking-[-0.01em] text-ink"
            >
              {isSignup ? "Create your account" : "Welcome back"}
            </h1>

            {/* Tabs */}
            <div
              role="tablist"
              aria-label="Account"
              className="relative mt-8 grid grid-cols-2 rounded-full border border-line bg-white/60 p-1"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-ink transition-transform duration-500 ${EASE} ${
                  isSignup ? "translate-x-full" : "translate-x-0"
                }`}
              />
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`relative h-12 rounded-full text-[15px] transition-colors duration-500 ${
                    mode === m ? "text-white" : "text-ink"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {onGoogle && (
              <>
                <button
                  type="button"
                  onClick={google}
                  disabled={busy}
                  className="mt-6 flex h-14 w-full items-center justify-center gap-3 rounded-full border border-line bg-white/70 text-[15px] text-ink transition-colors duration-300 hover:border-ink disabled:opacity-50"
                >
                  Continue with Google
                </button>
                <p className="my-5 flex items-center gap-4 text-sm text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                  or use email
                </p>
              </>
            )}

            <form
              ref={formRef}
              onSubmit={submit}
              noValidate
              className={`space-y-4 ${onGoogle ? "" : "mt-6"}`}
            >
              {isSignup && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="mb-2 block text-sm text-ink"
                  >
                    Your name
                  </label>
                  <input
                    id="auth-name"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((x) => ({ ...x, name: undefined }));
                    }}
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? "auth-name-error" : undefined
                    }
                    className={inputClass(errors.name)}
                  />
                  {errors.name && (
                    <p
                      id="auth-name-error"
                      role="alert"
                      className="mt-1.5 text-sm text-sale"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="mb-2 block text-sm text-ink"
                >
                  Email
                </label>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((x) => ({ ...x, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                  aria-describedby={
                    errors.email ? "auth-email-error" : undefined
                  }
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <p
                    id="auth-email-error"
                    role="alert"
                    className="mt-1.5 text-sm text-sale"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="auth-password"
                    className="text-sm text-ink"
                  >
                    Password
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={forgot}
                      className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    name="password"
                    type={show ? "text" : "password"}
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((x) => ({ ...x, password: undefined }));
                    }}
                    aria-invalid={!!errors.password}
                    aria-describedby={
                      errors.password ? "auth-password-error" : undefined
                    }
                    className={`${inputClass(errors.password)} pr-20`}
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-pressed={show}
                    className="absolute right-2 top-1/2 h-10 -translate-y-1/2 rounded-full px-4 text-sm text-ink hover:bg-stone/40"
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="auth-password-error"
                    role="alert"
                    className="mt-1.5 text-sm text-sale"
                  >
                    {errors.password}
                  </p>
                )}
                {isSignup && !errors.password && (
                  <p className="mt-1.5 text-sm text-muted">
                    At least 8 characters.
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
                className={`group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-ink text-[15px] text-white transition-transform duration-500 ${EASE} hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
                />
                <span className="relative flex items-center gap-2 transition-colors duration-500 group-hover:text-ink">
                  {busy ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                      One moment
                    </>
                  ) : isSignup ? (
                    "Create account"
                  ) : (
                    "Sign in"
                  )}
                </span>
              </button>

              {isSignup && (
                <p className="text-center text-sm text-muted">
                  By creating an account you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    privacy policy
                  </Link>
                  .
                </p>
              )}
            </form>
          </>
        )}

        {view !== "form" && (
          <div
            role="status"
            className="animate-fade-up"
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-ink">
              <svg
                width="26"
                height="26"
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
                  style={{ animationDuration: "0.6s", animationDelay: "0.2s" }}
                />
              </svg>
            </span>
            <h1
              id="auth-heading"
              className="mt-6 font-serif text-5xl font-light leading-none text-ink"
            >
              Check your email.
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              {view === "check-email"
                ? `We've sent a confirmation link to ${email}. Open it to finish creating your account.`
                : `If there's an account for ${email}, a reset link is on its way.`}
            </p>
            <button
              type="button"
              onClick={() => {
                setView("form");
                setPassword("");
              }}
              className="mt-8 text-sm text-ink underline underline-offset-4 hover:text-gold-deep"
            >
              Back to sign in
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
