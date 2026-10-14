"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";

/* ---------- consent store ---------- */

export type Consent = {
  /** Always true: cart, wishlist and consent itself. */
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "offline-house-consent-v1";
const listeners = new Set<() => void>();

// Holds the choice for this visit when localStorage is blocked
let memory: string | null | undefined;
// Lets a footer link bring the banner back
let forceOpen = false;

function readRaw(): string | null {
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function notify() {
  listeners.forEach((l) => l());
}

function save(next: Pick<Consent, "analytics" | "marketing">) {
  const value = JSON.stringify({ ...next, at: new Date().toISOString() });
  memory = value;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* kept for this visit only */
  }
  forceOpen = false;
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      memory = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// The snapshot is one primitive string so it stays stable between reads:
// "<saved choice or none>|<reopen flag>". On the server and during hydration
// it is "pending", so nothing renders until the browser has been checked.
const getSnapshot = () => `${readRaw() ?? "none"}|${forceOpen ? 1 : 0}`;
const getServerSnapshot = () => "pending";

function parse(snapshot: string): {
  pending: boolean;
  saved: Consent | null;
  reopened: boolean;
} {
  if (snapshot === "pending")
    return { pending: true, saved: null, reopened: false };
  const cut = snapshot.lastIndexOf("|");
  const raw = snapshot.slice(0, cut);
  const reopened = snapshot.slice(cut + 1) === "1";
  if (raw === "none") return { pending: false, saved: null, reopened };
  try {
    const p = JSON.parse(raw) as Partial<Consent>;
    return {
      pending: false,
      saved: {
        necessary: true,
        analytics: p.analytics === true,
        marketing: p.marketing === true,
      },
      reopened,
    };
  } catch {
    return { pending: false, saved: null, reopened };
  }
}

/** Call from a "Cookie settings" link in the footer to show the banner again. */
export function openCookieSettings() {
  forceOpen = true;
  notify();
}

/** Read the visitor's choice anywhere. Load analytics or pixels only when
 *  `analytics` / `marketing` is true. */
export function useConsent() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { pending, saved } = useMemo(() => parse(snap), [snap]);
  return {
    /** False until the browser has been checked. */
    ready: !pending,
    /** True once the visitor has made a choice. */
    decided: saved !== null,
    analytics: saved?.analytics ?? false,
    marketing: saved?.marketing ?? false,
  };
}

/* ---------- banner ---------- */

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function Toggle({
  checked,
  onChange,
  disabled,
  label,
  description,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
  label: string;
  description: string;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-5 py-3 ${
        disabled ? "cursor-default" : "cursor-pointer"
      }`}
    >
      <span className="leading-snug">
        <span className="block text-[15px] text-ink">{label}</span>
        <span className="mt-0.5 block text-sm text-muted">{description}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors duration-300 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-gold-deep ${
          checked ? "bg-ink" : "bg-line"
        } ${disabled ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${EASE} ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
    </label>
  );
}

export default function CookieConsent() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { pending, saved, reopened } = useMemo(() => parse(snap), [snap]);

  const [customising, setCustomising] = useState(false);
  // null means "show what is saved"; set once the visitor flips a switch
  const [draft, setDraft] = useState<{
    analytics: boolean;
    marketing: boolean;
  } | null>(null);

  const open = !pending && (saved === null || reopened);
  const analytics = draft?.analytics ?? saved?.analytics ?? false;
  const marketing = draft?.marketing ?? saved?.marketing ?? false;

  const choose = (next: { analytics: boolean; marketing: boolean }) => {
    save(next);
    setCustomising(false);
    setDraft(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-hidden={!open}
      inert={!open}
      onKeyDown={(e) => e.key === "Escape" && setCustomising(false)}
      className={`fixed inset-x-3 bottom-3 z-[65] transition-[transform,opacity] duration-700 ${EASE} sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[26rem] ${
        open
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-8 opacity-0"
      }`}
    >
      <div className="rounded-3xl border border-line bg-ivory/95 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-start gap-4">
          <svg
            width="40"
            height="40"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="mt-0.5 shrink-0"
          >
            <path
              d="M24 4a20 20 0 1 0 20 20 6 6 0 0 1-7-6 6 6 0 0 1-6-6 6 6 0 0 1-7-8Z"
              fill="var(--gold)"
              stroke="var(--ink)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle
              cx="17"
              cy="20"
              r="2"
              fill="var(--ink)"
            />
            <circle
              cx="23"
              cy="31"
              r="2"
              fill="var(--ink)"
            />
            <circle
              cx="32"
              cy="28"
              r="1.6"
              fill="var(--ink)"
            />
          </svg>
          <div>
            <p className="font-serif text-2xl font-light leading-tight text-ink">
              Your privacy, your call.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              We keep your bag and wishlist on this device. With your OK we also
              use analytics to improve the shop. Read our{" "}
              <Link
                href="/privacy"
                className="text-ink underline underline-offset-4"
              >
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Customise */}
        <div
          inert={!customising}
          className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
            customising ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-4 divide-y divide-line border-t border-line">
              <Toggle
                checked
                disabled
                label="Necessary"
                description="Keeps your bag, wishlist and this choice. Always on."
              />
              <Toggle
                checked={analytics}
                onChange={(v) => setDraft({ analytics: v, marketing })}
                label="Analytics"
                description="Helps us see which pages work and which don't."
              />
              <Toggle
                checked={marketing}
                onChange={(v) => setDraft({ analytics, marketing: v })}
                label="Marketing"
                description="Lets us measure our ads and show you relevant ones."
              />
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {customising ? (
            <>
              <button
                type="button"
                onClick={() => choose({ analytics, marketing })}
                className="h-12 rounded-full bg-ink px-5 text-sm text-white transition-colors duration-300 hover:bg-gold hover:text-ink sm:col-span-2"
              >
                Save my choices
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => choose({ analytics: true, marketing: true })}
                className="h-12 rounded-full bg-ink px-5 text-sm text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => choose({ analytics: false, marketing: false })}
                className="h-12 rounded-full border border-ink/25 px-5 text-sm text-ink transition-colors duration-300 hover:border-ink"
              >
                Necessary only
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-expanded={customising}
          onClick={() => setCustomising((c) => !c)}
          className="mt-3 w-full text-center text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {customising ? "Back" : "Choose what to allow"}
        </button>
      </div>
    </div>
  );
}
