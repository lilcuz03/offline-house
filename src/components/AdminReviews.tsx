"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Owner-only review moderation. As with the product page, the real
 * protection is the database: only an admin can read pending reviews or
 * change them (see the policies in reviews-admin.sql).
 */

type Status = "pending" | "approved" | "rejected";
type Review = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  status: Status;
  created_at: string;
  products:
    | { name: string; slug: string }
    | { name: string; slug: string }[]
    | null;
};

type Access = "unconfigured" | "loading" | "signedout" | "forbidden" | "ready";

const TABS: { id: Status; label: string }[] = [
  { id: "pending", label: "Waiting" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

const btn =
  "h-10 rounded-full border border-line px-4 text-sm transition-colors duration-300 hover:border-ink";

export default function AdminReviews() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured
      ? null
      : getSupabase(),
  );
  const [access, setAccess] = useState<Access>(
    supabaseConfigured ? "loading" : "unconfigured",
  );
  const [tab, setTab] = useState<Status>("pending");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [message, setMessage] = useState("");

  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (cancelled) return;
      if (!data.user) return setAccess("signedout");
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      setAccess(profile?.is_admin ? "ready" : "forbidden");
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  useEffect(() => {
    if (!sb || access !== "ready") return;
    let cancelled = false;
    (async () => {
      const { data, error } = await sb
        .from("product_reviews")
        .select(
          "id, name, rating, title, body, status, created_at, products(name, slug)",
        )
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(100);
      if (cancelled) return;
      if (error) return setMessage(error.message);
      setMessage("");
      setReviews(data as unknown as Review[]);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, access, tab, tick]);

  async function setStatus(r: Review, status: Status) {
    if (!sb) return;
    const { error } = await sb
      .from("product_reviews")
      .update({ status })
      .eq("id", r.id);
    if (error) return setMessage(error.message);
    reload();
  }

  async function remove(r: Review) {
    if (!sb) return;
    if (!window.confirm("Delete this review for good?")) return;
    const { error } = await sb.from("product_reviews").delete().eq("id", r.id);
    if (error) return setMessage(error.message);
    reload();
  }

  if (access !== "ready") {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-light text-ink">Reviews</h1>
        <p className="mt-4 text-muted">
          {access === "unconfigured" &&
            "Supabase is not configured. Set the project URL and anon key to moderate reviews."}
          {access === "loading" && "Checking access..."}
          {access === "signedout" &&
            "Sign in with the owner account to moderate reviews."}
          {access === "forbidden" && "This account does not have admin access."}
        </p>
        {(access === "signedout" || access === "forbidden") && (
          <Link
            href="/account"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            Go to sign in
          </Link>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
          Reviews
        </h1>
        <Link
          href="/admin"
          className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Back to products
        </Link>
      </div>

      <div
        role="tablist"
        className="mt-8 flex gap-2"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`h-10 rounded-full px-5 text-sm transition-colors duration-300 ${
              tab === t.id
                ? "bg-ink text-white"
                : "border border-line text-ink hover:border-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && (
        <p
          role="alert"
          className="mt-4 text-sm text-sale"
        >
          {message}
        </p>
      )}

      <ul className="mt-6 divide-y divide-line rounded-3xl border border-line bg-white/50">
        {reviews.length === 0 && (
          <li className="p-6 text-muted">Nothing here.</li>
        )}
        {reviews.map((r) => {
          const product = Array.isArray(r.products)
            ? r.products[0]
            : r.products;
          return (
            <li
              key={r.id}
              className="p-5 sm:p-6"
            >
              <p className="text-sm text-muted">
                {product ? (
                  <Link
                    href={`/products/${product.slug}`}
                    className="underline underline-offset-4 hover:text-ink"
                  >
                    {product.name}
                  </Link>
                ) : (
                  "Deleted product"
                )}
              </p>
              <p
                className="mt-1 text-gold-deep"
                aria-label={`${r.rating} out of 5 stars`}
              >
                {"★".repeat(r.rating)}
                <span className="text-stone">{"★".repeat(5 - r.rating)}</span>
              </p>
              {r.title && (
                <p className="mt-1 text-[15px] text-ink">{r.title}</p>
              )}
              <p className="mt-1 whitespace-pre-line text-muted">{r.body}</p>
              <p className="mt-2 text-sm text-muted">{r.name}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {r.status !== "approved" && (
                  <button
                    onClick={() => setStatus(r, "approved")}
                    className={`${btn} text-ink`}
                  >
                    Approve
                  </button>
                )}
                {r.status !== "rejected" && (
                  <button
                    onClick={() => setStatus(r, "rejected")}
                    className={`${btn} text-ink`}
                  >
                    Reject
                  </button>
                )}
                <button
                  onClick={() => remove(r)}
                  className={`${btn} text-sale hover:border-sale`}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
