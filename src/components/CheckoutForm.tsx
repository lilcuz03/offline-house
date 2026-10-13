"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useCart } from "./CartProvider";

/* ---------- types ---------- */

export type CheckoutPayload = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string;
  shippingId: string;
  items: { id: string; quantity: number }[];
};

export type ShippingOption = {
  id: string;
  label: string;
  eta: string;
  /** Rands. 0 shows as Free. */
  price: number;
};

type CheckoutFormProps = {
  /** Create the order and send the customer to payment. Throw to show an error. */
  onSubmit?: (payload: CheckoutPayload) => Promise<void>;
  shippingOptions?: ShippingOption[];
};

/* PLACEHOLDER rates. Replace with your real delivery options and prices. */
const DEFAULT_SHIPPING: ShippingOption[] = [
  {
    id: "standard",
    label: "Standard delivery",
    eta: "3 to 5 working days",
    price: 99,
  },
  {
    id: "express",
    label: "Express delivery",
    eta: "1 to 2 working days",
    price: 149,
  },
];

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const zar = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 0,
});

type Fields = Omit<CheckoutPayload, "items" | "shippingId">;
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  suburb: "",
  city: "",
  province: "",
  postalCode: "",
  notes: "",
};

function validate(v: Fields): Errors {
  const e: Errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))
    e.email = "Enter a valid email address.";
  if (!/^\+?\d{9,15}$/.test(v.phone.replace(/[\s()-]/g, "")))
    e.phone = "Enter a phone number we can reach you on.";
  if (!v.firstName.trim()) e.firstName = "Enter your first name.";
  if (!v.lastName.trim()) e.lastName = "Enter your last name.";
  if (!v.address1.trim()) e.address1 = "Enter your street address.";
  if (!v.suburb.trim()) e.suburb = "Enter your suburb.";
  if (!v.city.trim()) e.city = "Enter your city or town.";
  if (!v.province) e.province = "Choose your province.";
  if (!/^\d{4}$/.test(v.postalCode.trim()))
    e.postalCode = "Postal codes are 4 digits.";
  return e;
}

/* ---------- field ---------- */

function Field({
  id,
  label,
  error,
  optional,
  className = "",
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-2 block text-sm text-ink"
      >
        {label}
        {optional && <span className="text-muted"> (optional)</span>}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-sm text-sale"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass = (error?: string) =>
  `h-14 w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-ink focus:outline-none ${
    error ? "border-sale" : "border-line hover:border-ink/40"
  }`;

/* ---------- main ---------- */

export default function CheckoutForm({
  onSubmit,
  shippingOptions = DEFAULT_SHIPPING,
}: CheckoutFormProps) {
  const { items, subtotal, hydrated } = useCart();

  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [shippingId, setShippingId] = useState(shippingOptions[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const shipping = shippingOptions.find((s) => s.id === shippingId);
  const shippingCost = shipping?.price ?? 0;
  const total = subtotal + shippingCost;
  const count = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items],
  );

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
    if (submitting) return;

    const found = validate(values);
    setErrors(found);
    setFormError("");

    const firstBad = Object.keys(found)[0];
    if (firstBad) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstBad}"]`)
        ?.focus();
      return;
    }

    setSubmitting(true);
    try {
      if (!onSubmit) throw new Error("not-connected");
      await onSubmit({
        ...values,
        shippingId,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })),
      });
    } catch (err) {
      setFormError(
        err instanceof Error && err.message === "not-connected"
          ? "Payment isn't connected yet."
          : "We couldn't place your order. Please try again.",
      );
      setSubmitting(false);
    }
  };

  /* Wait for the saved bag before deciding it's empty */
  if (!hydrated) {
    return (
      <div
        className="mx-auto min-h-[60vh] max-w-7xl"
        aria-hidden="true"
      />
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-5 py-28 text-center">
        <h1 className="font-serif text-5xl font-light text-ink">
          Your bag is empty.
        </h1>
        <p className="mt-4 text-muted">Add something before checking out.</p>
        <Link
          href="/collections/top-sellers"
          className="mt-8 inline-flex h-14 items-center rounded-full bg-ink px-9 text-[15px] text-white transition-colors hover:bg-gold hover:text-ink"
        >
          Shop top sellers
        </Link>
      </section>
    );
  }

  const Summary = (
    <div>
      <ul className="divide-y divide-line">
        {items.map((i) => (
          <li
            key={i.id}
            className="flex gap-4 py-4"
          >
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone/40">
              {i.image ? (
                <Image
                  src={i.image}
                  alt=""
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-full w-full place-items-center font-serif text-2xl text-ink/70"
                >
                  {i.name.charAt(0)}
                </span>
              )}
              <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[11px] text-white">
                {i.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] leading-snug text-ink">{i.name}</p>
              {i.variant && (
                <p className="mt-0.5 text-xs text-muted">{i.variant}</p>
              )}
            </div>
            <p className="shrink-0 text-[15px] text-ink">
              {zar.format(i.price * i.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="text-ink">{zar.format(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd className="text-ink">
            {shippingCost === 0 ? "Free" : zar.format(shippingCost)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="text-ink">Total</dt>
          <dd
            key={total}
            className="animate-pop font-serif text-4xl font-light tabular-nums text-ink"
          >
            {zar.format(total)}
          </dd>
        </div>
      </dl>
    </div>
  );

  return (
    <section
      aria-labelledby="checkout-heading"
      className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-6 sm:pt-14"
    >
      <h1
        id="checkout-heading"
        className="font-serif text-[clamp(2.75rem,7vw,5rem)] font-light leading-none tracking-[-0.02em] text-ink"
      >
        Checkout
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Mobile summary toggle */}
        <div className="lg:hidden">
          <button
            type="button"
            aria-expanded={summaryOpen}
            aria-controls="mobile-summary"
            onClick={() => setSummaryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/60 px-5 py-4 text-[15px] text-ink"
          >
            <span>
              {summaryOpen ? "Hide" : "Show"} order summary ({count})
            </span>
            <span className="font-serif text-2xl font-light">
              {zar.format(total)}
            </span>
          </button>
          <div
            id="mobile-summary"
            inert={!summaryOpen}
            className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
              summaryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-4">{Summary}</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={submit}
          noValidate
          className="space-y-12 lg:col-span-7"
        >
          <fieldset>
            <legend className="font-serif text-3xl font-light text-ink">
              Contact
            </legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                id="email"
                label="Email"
                error={errors.email}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={set("email")}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={inputClass(errors.email)}
                />
              </Field>
              <Field
                id="phone"
                label="Phone"
                error={errors.phone}
              >
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={values.phone}
                  onChange={set("phone")}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={inputClass(errors.phone)}
                />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-3xl font-light text-ink">
              Delivery address
            </legend>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field
                id="firstName"
                label="First name"
                error={errors.firstName}
              >
                <input
                  id="firstName"
                  name="firstName"
                  autoComplete="given-name"
                  value={values.firstName}
                  onChange={set("firstName")}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "firstName-error" : undefined
                  }
                  className={inputClass(errors.firstName)}
                />
              </Field>
              <Field
                id="lastName"
                label="Last name"
                error={errors.lastName}
              >
                <input
                  id="lastName"
                  name="lastName"
                  autoComplete="family-name"
                  value={values.lastName}
                  onChange={set("lastName")}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "lastName-error" : undefined
                  }
                  className={inputClass(errors.lastName)}
                />
              </Field>
              <Field
                id="address1"
                label="Street address"
                error={errors.address1}
                className="sm:col-span-2"
              >
                <input
                  id="address1"
                  name="address1"
                  autoComplete="address-line1"
                  value={values.address1}
                  onChange={set("address1")}
                  aria-invalid={!!errors.address1}
                  aria-describedby={
                    errors.address1 ? "address1-error" : undefined
                  }
                  className={inputClass(errors.address1)}
                />
              </Field>
              <Field
                id="address2"
                label="Apartment, complex or building"
                optional
                className="sm:col-span-2"
              >
                <input
                  id="address2"
                  name="address2"
                  autoComplete="address-line2"
                  value={values.address2}
                  onChange={set("address2")}
                  className={inputClass()}
                />
              </Field>
              <Field
                id="suburb"
                label="Suburb"
                error={errors.suburb}
              >
                <input
                  id="suburb"
                  name="suburb"
                  autoComplete="address-level3"
                  value={values.suburb}
                  onChange={set("suburb")}
                  aria-invalid={!!errors.suburb}
                  aria-describedby={errors.suburb ? "suburb-error" : undefined}
                  className={inputClass(errors.suburb)}
                />
              </Field>
              <Field
                id="city"
                label="City or town"
                error={errors.city}
              >
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={values.city}
                  onChange={set("city")}
                  aria-invalid={!!errors.city}
                  aria-describedby={errors.city ? "city-error" : undefined}
                  className={inputClass(errors.city)}
                />
              </Field>
              <Field
                id="province"
                label="Province"
                error={errors.province}
              >
                <select
                  id="province"
                  name="province"
                  autoComplete="address-level1"
                  value={values.province}
                  onChange={set("province")}
                  aria-invalid={!!errors.province}
                  aria-describedby={
                    errors.province ? "province-error" : undefined
                  }
                  className={inputClass(errors.province)}
                >
                  <option value="">Choose a province</option>
                  {PROVINCES.map((p) => (
                    <option
                      key={p}
                      value={p}
                    >
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                id="postalCode"
                label="Postal code"
                error={errors.postalCode}
              >
                <input
                  id="postalCode"
                  name="postalCode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={4}
                  value={values.postalCode}
                  onChange={set("postalCode")}
                  aria-invalid={!!errors.postalCode}
                  aria-describedby={
                    errors.postalCode ? "postalCode-error" : undefined
                  }
                  className={inputClass(errors.postalCode)}
                />
              </Field>
              <Field
                id="notes"
                label="Delivery notes"
                optional
                className="sm:col-span-2"
              >
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={values.notes}
                  onChange={set("notes")}
                  placeholder="Gate code, complex name, best time to deliver"
                  className="w-full resize-none rounded-2xl border border-line bg-white/70 px-4 py-3.5 text-[15px] text-ink placeholder:text-muted/60 transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"
                />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend className="font-serif text-3xl font-light text-ink">
              Delivery method
            </legend>
            <div className="mt-5 space-y-3">
              {shippingOptions.map((s) => {
                const on = shippingId === s.id;
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep ${
                      on
                        ? "border-ink bg-white"
                        : "border-line bg-white/50 hover:border-ink/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={s.id}
                      checked={on}
                      onChange={() => setShippingId(s.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                        on ? "border-ink" : "border-ink/30"
                      }`}
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full bg-ink transition-transform duration-300 ${
                          on ? "scale-100" : "scale-0"
                        }`}
                      />
                    </span>
                    <span className="flex-1 leading-tight">
                      <span className="block text-[15px] text-ink">
                        {s.label}
                      </span>
                      <span className="block text-sm text-muted">{s.eta}</span>
                    </span>
                    <span className="text-[15px] text-ink">
                      {s.price === 0 ? "Free" : zar.format(s.price)}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div>
            {formError && (
              <p
                role="alert"
                className="mb-4 rounded-2xl bg-sale/10 px-5 py-4 text-[15px] text-sale"
              >
                {formError}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-full bg-ink text-base text-white transition-transform duration-500 ${EASE} hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none`}
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}
              />
              <span className="relative flex items-center gap-3 transition-colors duration-500 group-hover:text-ink">
                {submitting ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                    />
                    Placing your order
                  </>
                ) : (
                  <>Continue to payment · {zar.format(total)}</>
                )}
              </span>
            </button>
            <p className="mt-4 text-center text-sm text-muted">
              You&apos;ll pay on the next step. By continuing you agree to our{" "}
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
          </div>
        </form>

        {/* Desktop summary */}
        <aside
          aria-label="Order summary"
          className="hidden lg:col-span-5 lg:block"
        >
          <div className="sticky top-40 rounded-3xl border border-line bg-white/60 p-8">
            <h2 className="mb-2 font-serif text-3xl font-light text-ink">
              Order summary
            </h2>
            {Summary}
          </div>
        </aside>
      </div>
    </section>
  );
}
