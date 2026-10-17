warning: in the working copy of 'src/app/layout.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/lib/shipping.ts', LF will be replaced by CRLF the next time Git touches it
[1mdiff --git a/src/app/layout.tsx b/src/app/layout.tsx[m
[1mindex 91bcd96..74da70e 100644[m
[1m--- a/src/app/layout.tsx[m
[1m+++ b/src/app/layout.tsx[m
[36m@@ -5,6 +5,7 @@[m [mimport "./globals.css";[m
 import Footer from "@/components/Footer";[m
 import Header from "@/components/Header";[m
 import CartProvider from "@/components/CartProvider";[m
[32m+[m[32mimport { FREE_DELIVERY_THRESHOLD } from "../lib/shipping";[m
 import WishlistProvider from "@/components/WishListProvider";[m
 [m
 const jost = Jost({[m
[36m@@ -100,7 +101,7 @@[m [mexport default function RootLayout({ children }: LayoutProps<"/">) {[m
           type="application/ld+json"[m
           dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}[m
         />[m
[31m-        <CartProvider>[m
[32m+[m[32m        <CartProvider freeShippingThreshold={FREE_DELIVERY_THRESHOLD}>[m
           <WishlistProvider>[m
             <Header />[m
             <main[m
[1mdiff --git a/src/app/not-found.tsx b/src/app/not-found.tsx[m
[1mindex b8ffaf5..893d969 100644[m
[1m--- a/src/app/not-found.tsx[m
[1m+++ b/src/app/not-found.tsx[m
[36m@@ -1,14 +1,6 @@[m
 import NotFoundView from "@/components/NoteFoundView";[m
 [m
[32m+[m[32m// layout.tsx already provides the header, <main id="main"> and footer.[m
 export default function NotFound() {[m
[31m-  return ([m
[31m-    <>[m
[31m-      <main[m
[31m-        id="main"[m
[31m-        className="flex-1"[m
[31m-      >[m
[31m-        <NotFoundView />[m
[31m-      </main>[m
[31m-    </>[m
[31m-  );[m
[32m+[m[32m  return <NotFoundView />;[m
 }[m
[1mdiff --git a/src/components/CheckoutForm.tsx b/src/components/CheckoutForm.tsx[m
[1mdeleted file mode 100644[m
[1mindex 6bc2438..0000000[m
[1m--- a/src/components/CheckoutForm.tsx[m
[1m+++ /dev/null[m
[36m@@ -1,712 +0,0 @@[m
[31m-"use client";[m
[31m-[m
[31m-import Image from "next/image";[m
[31m-import Link from "next/link";[m
[31m-import { useMemo, useRef, useState } from "react";[m
[31m-import { useCart } from "./CartProvider";[m
[31m-[m
[31m-/* ---------- types ---------- */[m
[31m-[m
[31m-export type CheckoutPayload = {[m
[31m-  email: string;[m
[31m-  phone: string;[m
[31m-  firstName: string;[m
[31m-  lastName: string;[m
[31m-  address1: string;[m
[31m-  address2: string;[m
[31m-  suburb: string;[m
[31m-  city: string;[m
[31m-  province: string;[m
[31m-  postalCode: string;[m
[31m-  notes: string;[m
[31m-  shippingId: string;[m
[31m-  items: { id: string; quantity: number; variant: string | null }[];[m
[31m-};[m
[31m-[m
[31m-export type ShippingOption = {[m
[31m-  id: string;[m
[31m-  label: string;[m
[31m-  eta: string;[m
[31m-  /** Rands. 0 shows as Free. */[m
[31m-  price: number;[m
[31m-};[m
[31m-[m
[31m-type CheckoutFormProps = {[m
[31m-  /** Create the order and send the customer to payment. Throw to show an error. */[m
[31m-  onSubmit?: (payload: CheckoutPayload) => Promise<void>;[m
[31m-  shippingOptions?: ShippingOption[];[m
[31m-};[m
[31m-[m
[31m-/* PLACEHOLDER rates. Replace with your real delivery options and prices. */[m
[31m-const DEFAULT_SHIPPING: ShippingOption[] = [[m
[31m-  {[m
[31m-    id: "standard",[m
[31m-    label: "Standard delivery",[m
[31m-    eta: "3 to 5 working days",[m
[31m-    price: 99,[m
[31m-  },[m
[31m-  {[m
[31m-    id: "express",[m
[31m-    label: "Express delivery",[m
[31m-    eta: "1 to 2 working days",[m
[31m-    price: 149,[m
[31m-  },[m
[31m-];[m
[31m-[m
[31m-const PROVINCES = [[m
[31m-  "Eastern Cape",[m
[31m-  "Free State",[m
[31m-  "Gauteng",[m
[31m-  "KwaZulu-Natal",[m
[31m-  "Limpopo",[m
[31m-  "Mpumalanga",[m
[31m-  "Northern Cape",[m
[31m-  "North West",[m
[31m-  "Western Cape",[m
[31m-];[m
[31m-[m
[31m-const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";[m
[31m-[m
[31m-const zar = new Intl.NumberFormat("en-ZA", {[m
[31m-  style: "currency",[m
[31m-  currency: "ZAR",[m
[31m-  maximumFractionDigits: 0,[m
[31m-});[m
[31m-[m
[31m-type Fields = Omit<CheckoutPayload, "items" | "shippingId">;[m
[31m-type Errors = Partial<Record<keyof Fields, string>>;[m
[31m-[m
[31m-const EMPTY: Fields = {[m
[31m-  email: "",[m
[31m-  phone: "",[m
[31m-  firstName: "",[m
[31m-  lastName: "",[m
[31m-  address1: "",[m
[31m-  address2: "",[m
[31m-  suburb: "",[m
[31m-  city: "",[m
[31m-  province: "",[m
[31m-  postalCode: "",[m
[31m-  notes: "",[m
[31m-};[m
[31m-[m
[31m-function validate(v: Fields): Errors {[m
[31m-  const e: Errors = {};[m
[31m-  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim()))[m
[31m-    e.email = "Enter a valid email address.";[m
[31m-  if (!/^\+?\d{9,15}$/.test(v.phone.replace(/[\s()-]/g, "")))[m
[31m-    e.phone = "Enter a phone number we can reach you on.";[m
[31m-  if (!v.firstName.trim()) e.firstName = "Enter your first name.";[m
[31m-  if (!v.lastName.trim()) e.lastName = "Enter your last name.";[m
[31m-  if (!v.address1.trim()) e.address1 = "Enter your street address.";[m
[31m-  if (!v.suburb.trim()) e.suburb = "Enter your suburb.";[m
[31m-  if (!v.city.trim()) e.city = "Enter your city or town.";[m
[31m-  if (!v.province) e.province = "Choose your province.";[m
[31m-  if (!/^\d{4}$/.test(v.postalCode.trim()))[m
[31m-    e.postalCode = "Postal codes are 4 digits.";[m
[31m-  return e;[m
[31m-}[m
[31m-[m
[31m-/* ---------- field ---------- */[m
[31m-[m
[31m-function Field({[m
[31m-  id,[m
[31m-  label,[m
[31m-  error,[m
[31m-  optional,[m
[31m-  className = "",[m
[31m-  children,[m
[31m-}: {[m
[31m-  id: string;[m
[31m-  label: string;[m
[31m-  error?: string;[m
[31m-  optional?: boolean;[m
[31m-  className?: string;[m
[31m-  children: React.ReactNode;[m
[31m-}) {[m
[31m-  return ([m
[31m-    <div className={className}>[m
[31m-      <label[m
[31m-        htmlFor={id}[m
[31m-        className="mb-2 block text-sm text-ink"[m
[31m-      >[m
[31m-        {label}[m
[31m-        {optional && <span className="text-muted"> (optional)</span>}[m
[31m-      </label>[m
[31m-      {children}[m
[31m-      {error && ([m
[31m-        <p[m
[31m-          id={`${id}-error`}[m
[31m-          role="alert"[m
[31m-          className="mt-1.5 text-sm text-sale"[m
[31m-        >[m
[31m-          {error}[m
[31m-        </p>[m
[31m-      )}[m
[31m-    </div>[m
[31m-  );[m
[31m-}[m
[31m-[m
[31m-const inputClass = (error?: string) =>[m
[31m-  `h-14 w-full rounded-2xl border bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 focus:border-ink focus:outline-none ${[m
[31m-    error ? "border-sale" : "border-line hover:border-ink/40"[m
[31m-  }`;[m
[31m-[m
[31m-/* ---------- main ---------- */[m
[31m-[m
[31m-export default function CheckoutForm({[m
[31m-  onSubmit,[m
[31m-  shippingOptions = DEFAULT_SHIPPING,[m
[31m-}: CheckoutFormProps) {[m
[31m-  const { items, subtotal, hydrated } = useCart();[m
[31m-[m
[31m-  const [values, setValues] = useState<Fields>(EMPTY);[m
[31m-  const [errors, setErrors] = useState<Errors>({});[m
[31m-  const [shippingId, setShippingId] = useState(shippingOptions[0]?.id ?? "");[m
[31m-  const [submitting, setSubmitting] = useState(false);[m
[31m-  const [formError, setFormError] = useState("");[m
[31m-  const [summaryOpen, setSummaryOpen] = useState(false);[m
[31m-  const formRef = useRef<HTMLFormElement>(null);[m
[31m-[m
[31m-  const shipping = shippingOptions.find((s) => s.id === shippingId);[m
[31m-  const shippingCost = shipping?.price ?? 0;[m
[31m-  const total = subtotal + shippingCost;[m
[31m-  const count = useMemo([m
[31m-    () => items.reduce((n, i) => n + i.quantity, 0),[m
[31m-    [items],[m
[31m-  );[m
[31m-[m
[31m-  const set =[m
[31m-    (key: keyof Fields) =>[m
[31m-    ([m
[31m-      e: React.ChangeEvent<[m
[31m-        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement[m
[31m-      >,[m
[31m-    ) => {[m
[31m-      setValues((v) => ({ ...v, [key]: e.target.value }));[m
[31m-      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));[m
[31m-    };[m
[31m-[m
[31m-  const submit = async (e: React.FormEvent) => {[m
[31m-    e.preventDefault();[m
[31m-    if (submitting) return;[m
[31m-[m
[31m-    const found = validate(values);[m
[31m-    setErrors(found);[m
[31m-    setFormError("");[m
[31m-[m
[31m-    const firstBad = Object.keys(found)[0];[m
[31m-    if (firstBad) {[m
[31m-      formRef.current[m
[31m-        ?.querySelector<HTMLElement>(`[name="${firstBad}"]`)[m
[31m-        ?.focus();[m
[31m-      return;[m
[31m-    }[m
[31m-[m
[31m-    setSubmitting(true);[m
[31m-    try {[m
[31m-      if (!onSubmit) throw new Error("not-connected");[m
[31m-      await onSubmit({[m
[31m-        ...values,[m
[31m-        shippingId,[m
[31m-        items: items.map((i) => ({[m
[31m-          id: i.id,[m
[31m-          quantity: i.quantity,[m
[31m-          variant: i.variant ?? null,[m
[31m-        })),[m
[31m-      });[m
[31m-    } catch (err) {[m
[31m-      // userFacing marks a message that is safe to show, such as "out of stock"[m
[31m-      const userFacing =[m
[31m-        err instanceof Error &&[m
[31m-        (err as Error & { userFacing?: boolean }).userFacing;[m
[31m-      setFormError([m
[31m-        err instanceof Error && err.message === "not-connected"[m
[31m-          ? "Payment isn't connected yet."[m
[31m-          : userFacing && err instanceof Error[m
[31m-            ? err.message[m
[31m-            : "We couldn't place your order. Please try again.",[m
[31m-      );[m
[31m-      setSubmitting(false);[m
[31m-    }[m
[31m-  };[m
[31m-[m
[31m-  /* Wait for the saved bag before deciding it's empty */[m
[31m-  if (!hydrated) {[m
[31m-    return ([m
[31m-      <div[m
[31m-        className="mx-auto min-h-[60vh] max-w-7xl"[m
[31m-        aria-hidden="true"[m
[31m-      />[m
[31m-    );[m
[31m-  }[m
[31m-[m
[31m-  if (items.length === 0) {[m
[31m-    return ([m
[31m-      <section className="mx-auto max-w-xl px-5 py-28 text-center">[m
[31m-        <h1 className="font-serif text-5xl font-light text-ink">[m
[31m-          Your bag is empty.[m
[31m-        </h1>[m
[31m-        <p className="mt-4 text-muted">Add something before checking out.</p>[m
[31m-        <Link[m
[31m-          href="/collections/top-sellers"[m
[31m-          className="mt-8 inline-flex h-14 items-center rounded-full bg-ink px-9 text-[15px] text-white transition-colors hover:bg-gold hover:text-ink"[m
[31m-        >[m
[31m-          Shop top sellers[m
[31m-        </Link>[m
[31m-      </section>[m
[31m-    );[m
[31m-  }[m
[31m-[m
[31m-  const Summary = ([m
[31m-    <div>[m
[31m-      <ul className="divide-y divide-line">[m
[31m-        {items.map((i) => ([m
[31m-          <li[m
[31m-            key={i.id}[m
[31m-            className="flex gap-4 py-4"[m
[31m-          >[m
[31m-            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-stone/40">[m
[31m-              {i.image ? ([m
[31m-                <Image[m
[31m-                  src={i.image}[m
[31m-                  alt=""[m
[31m-                  fill[m
[31m-                  sizes="64px"[m
[31m-                  className="object-cover"[m
[31m-                />[m
[31m-              ) : ([m
[31m-                <span[m
[31m-                  aria-hidden="true"[m
[31m-                  className="grid h-full w-full place-items-center font-serif text-2xl text-ink/70"[m
[31m-                >[m
[31m-                  {i.name.charAt(0)}[m
[31m-                </span>[m
[31m-              )}[m
[31m-              <span className="absolute -right-0 -top-0 grid h-5 min-w-5 place-items-center rounded-bl-lg bg-ink px-1 text-[11px] text-white">[m
[31m-                {i.quantity}[m
[31m-              </span>[m
[31m-            </div>[m
[31m-            <div className="min-w-0 flex-1">[m
[31m-              <p className="text-[15px] leading-snug text-ink">{i.name}</p>[m
[31m-              {i.variant && ([m
[31m-                <p className="mt-0.5 text-xs text-muted">{i.variant}</p>[m
[31m-              )}[m
[31m-            </div>[m
[31m-            <p className="shrink-0 text-[15px] text-ink">[m
[31m-              {zar.format(i.price * i.quantity)}[m
[31m-            </p>[m
[31m-          </li>[m
[31m-        ))}[m
[31m-      </ul>[m
[31m-[m
[31m-      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-[15px]">[m
[31m-        <div className="flex justify-between">[m
[31m-          <dt className="text-muted">Subtotal</dt>[m
[31m-          <dd className="text-ink">{zar.format(subtotal)}</dd>[m
[31m-        </div>[m
[31m-        <div className="flex justify-between">[m
[31m-          <dt className="text-muted">Delivery</dt>[m
[31m-          <dd className="text-ink">[m
[31m-            {shippingCost === 0 ? "Free" : zar.format(shippingCost)}[m
[31m-          </dd>[m
[31m-        </div>[m
[31m-        <div className="flex items-baseline justify-between border-t border-line pt-4">[m
[31m-          <dt className="text-ink">Total</dt>[m
[31m-          <dd[m
[31m-            key={total}[m
[31m-            className="animate-pop font-serif text-4xl font-light tabular-nums text-ink"[m
[31m-          >[m
[31m-            {zar.format(total)}[m
[31m-          </dd>[m
[31m-        </div>[m
[31m-      </dl>[m
[31m-    </div>[m
[31m-  );[m
[31m-[m
[31m-  return ([m
[31m-    <section[m
[31m-      aria-labelledby="checkout-heading"[m
[31m-      className="mx-auto max-w-7xl px-5 pb-24 pt-8 sm:px-6 sm:pt-14"[m
[31m-    >[m
[31m-      <h1[m
[31m-        id="checkout-heading"[m
[31m-        className="font-serif text-[clamp(2.75rem,7vw,5rem)] font-light leading-none tracking-[-0.02em] text-ink"[m
[31m-      >[m
[31m-        Checkout[m
[31m-      </h1>[m
[31m-[m
[31m-      <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-16">[m
[31m-        {/* Mobile summary toggle */}[m
[31m-        <div className="lg:hidden">[m
[31m-          <button[m
[31m-            type="button"[m
[31m-            aria-expanded={summaryOpen}[m
[31m-            aria-controls="mobile-summary"[m
[31m-            onClick={() => setSummaryOpen((o) => !o)}[m
[31m-            className="flex w-full items-center justify-between rounded-2xl border border-line bg-white/60 px-5 py-4 text-[15px] text-ink"[m
[31m-          >[m
[31m-            <span>[m
[31m-              {summaryOpen ? "Hide" : "Show"} order summary ({count})[m
[31m-            </span>[m
[31m-            <span className="font-serif text-2xl font-light">[m
[31m-              {zar.format(total)}[m
[31m-            </span>[m
[31m-          </button>[m
[31m-          <div[m
[31m-            id="mobile-summary"[m
[31m-            inert={!summaryOpen}[m
[31m-            className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${[m
[31m-              summaryOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"[m
[31m-            }`}[m
[31m-          >[m
[31m-            <div className="overflow-hidden">[m
[31m-              <div className="pt-4">{Summary}</div>[m
[31m-            </div>[m
[31m-          </div>[m
[31m-        </div>[m
[31m-[m
[31m-        {/* Form */}[m
[31m-        <form[m
[31m-          ref={formRef}[m
[31m-          onSubmit={submit}[m
[31m-          noValidate[m
[31m-          className="space-y-12 lg:col-span-7"[m
[31m-        >[m
[31m-          <fieldset>[m
[31m-            <legend className="font-serif text-3xl font-light text-ink">[m
[31m-              Contact[m
[31m-            </legend>[m
[31m-            <div className="mt-5 grid gap-4 sm:grid-cols-2">[m
[31m-              <Field[m
[31m-                id="email"[m
[31m-                label="Email"[m
[31m-                error={errors.email}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="email"[m
[31m-                  name="email"[m
[31m-                  type="email"[m
[31m-                  inputMode="email"[m
[31m-                  autoComplete="email"[m
[31m-                  value={values.email}[m
[31m-                  onChange={set("email")}[m
[31m-                  aria-invalid={!!errors.email}[m
[31m-                  aria-describedby={errors.email ? "email-error" : undefined}[m
[31m-                  className={inputClass(errors.email)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="phone"[m
[31m-                label="Phone"[m
[31m-                error={errors.phone}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="phone"[m
[31m-                  name="phone"[m
[31m-                  type="tel"[m
[31m-                  inputMode="tel"[m
[31m-                  autoComplete="tel"[m
[31m-                  value={values.phone}[m
[31m-                  onChange={set("phone")}[m
[31m-                  aria-invalid={!!errors.phone}[m
[31m-                  aria-describedby={errors.phone ? "phone-error" : undefined}[m
[31m-                  className={inputClass(errors.phone)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-            </div>[m
[31m-          </fieldset>[m
[31m-[m
[31m-          <fieldset>[m
[31m-            <legend className="font-serif text-3xl font-light text-ink">[m
[31m-              Delivery address[m
[31m-            </legend>[m
[31m-            <div className="mt-5 grid gap-4 sm:grid-cols-2">[m
[31m-              <Field[m
[31m-                id="firstName"[m
[31m-                label="First name"[m
[31m-                error={errors.firstName}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="firstName"[m
[31m-                  name="firstName"[m
[31m-                  autoComplete="given-name"[m
[31m-                  value={values.firstName}[m
[31m-                  onChange={set("firstName")}[m
[31m-                  aria-invalid={!!errors.firstName}[m
[31m-                  aria-describedby={[m
[31m-                    errors.firstName ? "firstName-error" : undefined[m
[31m-                  }[m
[31m-                  className={inputClass(errors.firstName)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="lastName"[m
[31m-                label="Last name"[m
[31m-                error={errors.lastName}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="lastName"[m
[31m-                  name="lastName"[m
[31m-                  autoComplete="family-name"[m
[31m-                  value={values.lastName}[m
[31m-                  onChange={set("lastName")}[m
[31m-                  aria-invalid={!!errors.lastName}[m
[31m-                  aria-describedby={[m
[31m-                    errors.lastName ? "lastName-error" : undefined[m
[31m-                  }[m
[31m-                  className={inputClass(errors.lastName)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="address1"[m
[31m-                label="Street address"[m
[31m-                error={errors.address1}[m
[31m-                className="sm:col-span-2"[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="address1"[m
[31m-                  name="address1"[m
[31m-                  autoComplete="address-line1"[m
[31m-                  value={values.address1}[m
[31m-                  onChange={set("address1")}[m
[31m-                  aria-invalid={!!errors.address1}[m
[31m-                  aria-describedby={[m
[31m-                    errors.address1 ? "address1-error" : undefined[m
[31m-                  }[m
[31m-                  className={inputClass(errors.address1)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="address2"[m
[31m-                label="Apartment, complex or building"[m
[31m-                optional[m
[31m-                className="sm:col-span-2"[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="address2"[m
[31m-                  name="address2"[m
[31m-                  autoComplete="address-line2"[m
[31m-                  value={values.address2}[m
[31m-                  onChange={set("address2")}[m
[31m-                  className={inputClass()}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="suburb"[m
[31m-                label="Suburb"[m
[31m-                error={errors.suburb}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="suburb"[m
[31m-                  name="suburb"[m
[31m-                  autoComplete="address-level3"[m
[31m-                  value={values.suburb}[m
[31m-                  onChange={set("suburb")}[m
[31m-                  aria-invalid={!!errors.suburb}[m
[31m-                  aria-describedby={errors.suburb ? "suburb-error" : undefined}[m
[31m-                  className={inputClass(errors.suburb)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="city"[m
[31m-                label="City or town"[m
[31m-                error={errors.city}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="city"[m
[31m-                  name="city"[m
[31m-                  autoComplete="address-level2"[m
[31m-                  value={values.city}[m
[31m-                  onChange={set("city")}[m
[31m-                  aria-invalid={!!errors.city}[m
[31m-                  aria-describedby={errors.city ? "city-error" : undefined}[m
[31m-                  className={inputClass(errors.city)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="province"[m
[31m-                label="Province"[m
[31m-                error={errors.province}[m
[31m-              >[m
[31m-                <select[m
[31m-                  id="province"[m
[31m-                  name="province"[m
[31m-                  autoComplete="address-level1"[m
[31m-                  value={values.province}[m
[31m-                  onChange={set("province")}[m
[31m-                  aria-invalid={!!errors.province}[m
[31m-                  aria-describedby={[m
[31m-                    errors.province ? "province-error" : undefined[m
[31m-                  }[m
[31m-                  className={inputClass(errors.province)}[m
[31m-                >[m
[31m-                  <option value="">Choose a province</option>[m
[31m-                  {PROVINCES.map((p) => ([m
[31m-                    <option[m
[31m-                      key={p}[m
[31m-                      value={p}[m
[31m-                    >[m
[31m-                      {p}[m
[31m-                    </option>[m
[31m-                  ))}[m
[31m-                </select>[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="postalCode"[m
[31m-                label="Postal code"[m
[31m-                error={errors.postalCode}[m
[31m-              >[m
[31m-                <input[m
[31m-                  id="postalCode"[m
[31m-                  name="postalCode"[m
[31m-                  inputMode="numeric"[m
[31m-                  autoComplete="postal-code"[m
[31m-                  maxLength={4}[m
[31m-                  value={values.postalCode}[m
[31m-                  onChange={set("postalCode")}[m
[31m-                  aria-invalid={!!errors.postalCode}[m
[31m-                  aria-describedby={[m
[31m-                    errors.postalCode ? "postalCode-error" : undefined[m
[31m-                  }[m
[31m-                  className={inputClass(errors.postalCode)}[m
[31m-                />[m
[31m-              </Field>[m
[31m-              <Field[m
[31m-                id="notes"[m
[31m-                label="Delivery notes"[m
[31m-                optional[m
[31m-                className="sm:col-span-2"[m
[31m-              >[m
[31m-                <textarea[m
[31m-                  id="notes"[m
[31m-                  name="notes"[m
[31m-                  rows={3}[m
[31m-                  value={values.notes}[m
[31m-                  onChange={set("notes")}[m
[31m-                  placeholder="Gate code, complex name, best time to deliver"[m
[31m-                  className="w-full resize-none rounded-2xl border border-line bg-white/70 px-4 py-3.5 text-[15px] text-ink placeholder:text-muted/60 transition-colors hover:border-ink/40 focus:border-ink focus:outline-none"[m
[31m-                />[m
[31m-              </Field>[m
[31m-            </div>[m
[31m-          </fieldset>[m
[31m-[m
[31m-          <fieldset>[m
[31m-            <legend className="font-serif text-3xl font-light text-ink">[m
[31m-              Delivery method[m
[31m-            </legend>[m
[31m-            <div className="mt-5 space-y-3">[m
[31m-              {shippingOptions.map((s) => {[m
[31m-                const on = shippingId === s.id;[m
[31m-                return ([m
[31m-                  <label[m
[31m-                    key={s.id}[m
[31m-                    className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-deep ${[m
[31m-                      on[m
[31m-                        ? "border-ink bg-white"[m
[31m-                        : "border-line bg-white/50 hover:border-ink/40"[m
[31m-                    }`}[m
[31m-                  >[m
[31m-                    <input[m
[31m-                      type="radio"[m
[31m-                      name="shipping"[m
[31m-                      value={s.id}[m
[31m-                      checked={on}[m
[31m-                      onChange={() => setShippingId(s.id)}[m
[31m-                      className="sr-only"[m
[31m-                    />[m
[31m-                    <span[m
[31m-                      aria-hidden="true"[m
[31m-                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${[m
[31m-                        on ? "border-ink" : "border-ink/30"[m
[31m-                      }`}[m
[31m-                    >[m
[31m-                      <span[m
[31m-                        className={`h-2.5 w-2.5 rounded-full bg-ink transition-transform duration-300 ${[m
[31m-                          on ? "scale-100" : "scale-0"[m
[31m-                        }`}[m
[31m-                      />[m
[31m-                    </span>[m
[31m-                    <span className="flex-1 leading-tight">[m
[31m-                      <span className="block text-[15px] text-ink">[m
[31m-                        {s.label}[m
[31m-                      </span>[m
[31m-                      <span className="block text-sm text-muted">{s.eta}</span>[m
[31m-                    </span>[m
[31m-                    <span className="text-[15px] text-ink">[m
[31m-                      {s.price === 0 ? "Free" : zar.format(s.price)}[m
[31m-                    </span>[m
[31m-                  </label>[m
[31m-                );[m
[31m-              })}[m
[31m-            </div>[m
[31m-          </fieldset>[m
[31m-[m
[31m-          <div>[m
[31m-            {formError && ([m
[31m-              <p[m
[31m-                role="alert"[m
[31m-                className="mb-4 rounded-2xl bg-sale/10 px-5 py-4 text-[15px] text-sale"[m
[31m-              >[m
[31m-                {formError}[m
[31m-              </p>[m
[31m-            )}[m
[31m-            <button[m
[31m-              type="submit"[m
[31m-              disabled={submitting}[m
[31m-              className={`group relative flex h-16 w-full items-center justify-center overflow-hidden rounded-full bg-ink text-base text-white transition-transform duration-500 ${EASE} hover:scale-[1.01] active:scale-[0.99] disabled:pointer-events-none`}[m
[31m-            >[m
[31m-              <span[m
[31m-                aria-hidden="true"[m
[31m-                className={`absolute inset-0 -translate-x-full bg-gold transition-transform duration-500 ${EASE} group-hover:translate-x-0`}[m
[31m-              />[m
[31m-              <span className="relative flex items-center gap-3 transition-colors duration-500 group-hover:text-ink">[m
[31m-                {submitting ? ([m
[31m-                  <>[m
[31m-                    <span[m
[31m-                      aria-hidden="true"[m
[31m-                      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"[m
[31m-                    />[m
[31m-                    Placing your order[m
[31m-                  </>[m
[31m-                ) : ([m
[31m-                  <>Continue to payment · {zar.format(total)}</>[m
[31m-                )}[m
[31m-              </span>[m
[31m-            </button>[m
[31m-            <p className="mt-4 text-center text-sm text-muted">[m
[31m-              You&apos;ll pay on the next step. By continuing you agree to our{" "}[m
[31m-              <Link[m
[31m-                href="/terms"[m
[31m-                className="underline underline-offset-4 hover:text-ink"[m
[31m-              >[m
[31m-                terms[m
[31m-              </Link>{" "}[m
[31m-              and{" "}[m
[31m-              <Link[m
[31m-                href="/privacy"[m
[31m-                className="underline underline-offset-4 hover:text-ink"[m
[31m-              >[m
[31m-                privacy policy[m
[31m-              </Link>[m
[31m-              .[m
[31m-            </p>[m
[31m-          </div>[m
[31m-        </form>[m
[31m-[m
[31m-        {/* Desktop summary */}[m
[31m-        <aside[m
[31m-          aria-label="Order summary"[m
[31m-          className="hidden lg:col-span-5 lg:block"[m
[31m-        >[m
[31m-          <div className="sticky top-40 rounded-3xl border border-line bg-white/60 p-8">[m
[31m-            <h2 className="mb-2 font-serif text-3xl font-light text-ink">[m
[31m-              Order summary[m
[31m-            </h2>[m
[31m-            {Summary}[m
[31m-          </div>[m
[31m-        </aside>[m
[31m-      </div>[m
[31m-    </section>[m
[31m-  );[m
[31m-}[m
[1mdiff --git a/src/lib/shipping.ts b/src/lib/shipping.ts[m
[1mindex 7e6a5be..a9e5138 100644[m
[1m--- a/src/lib/shipping.ts[m
[1m+++ b/src/lib/shipping.ts[m
[36m@@ -16,3 +16,24 @@[m [mexport const SHIPPING_OPTIONS: ShippingOption[] = [[m
   { id: "standard", label: "Standard delivery", eta: "3 to 5 working days", price: 99 },[m
   { id: "express", label: "Express delivery", eta: "1 to 2 working days", price: 149 },[m
 ];[m
[32m+[m
[32m+[m[32m/** Orders at or above this subtotal (in rands) get free standard delivery. */[m
[32m+[m[32mexport const FREE_DELIVERY_THRESHOLD = 600;[m
[32m+[m
[32m+[m[32m/** The delivery option the free-delivery offer applies to. */[m
[32m+[m[32mconst FREE_DELIVERY_OPTION_ID = "standard";[m
[32m+[m
[32m+[m[32m/**[m
[32m+[m[32m * What a delivery option really costs for a given subtotal (both in rands).[m
[32m+[m[32m * The checkout form uses it to show the price, and the server uses the same[m
[32m+[m[32m * function to charge it, so the two can never disagree.[m
[32m+[m[32m */[m
[32m+[m[32mexport function shippingPriceFor([m
[32m+[m[32m  option: ShippingOption,[m
[32m+[m[32m  subtotalRands: number,[m
[32m+[m[32m): number {[m
[32m+[m[32m  return option.id === FREE_DELIVERY_OPTION_ID &&[m
[32m+[m[32m    subtotalRands >= FREE_DELIVERY_THRESHOLD[m
[32m+[m[32m    ? 0[m
[32m+[m[32m    : option.price;[m
[32m+[m[32m}[m
