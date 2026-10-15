"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Owner-only product manager. The page checks you are signed in as an admin,
 * but the real protection is the database: Row Level Security only lets an
 * admin change products or upload photos, whatever this page does.
 */

type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
};
type Row = {
  id: string;
  slug: string;
  name: string;
  price_cents: number;
  stock: number;
  is_active: boolean;
  images: string[];
};

type Status = "unconfigured" | "loading" | "signedout" | "forbidden" | "ready";

const field =
  "h-12 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const rands = (cents: number) => `R${(cents / 100).toFixed(2)}`;

export default function AdminProducts() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured
      ? null
      : getSupabase(),
  );
  const [status, setStatus] = useState<Status>(
    supabaseConfigured ? "loading" : "unconfigured",
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compare, setCompare] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  const load = useCallback(async () => {
    if (!sb) return;
    const [cats, prods] = await Promise.all([
      sb
        .from("categories")
        .select("id, slug, name, parent_id")
        .order("sort_order"),
      sb
        .from("products")
        .select("id, slug, name, price_cents, stock, is_active, images")
        .order("created_at", { ascending: false }),
    ]);
    if (cats.error || prods.error) {
      setMessage(cats.error?.message ?? prods.error?.message ?? "Load failed");
      return;
    }
    setCategories(cats.data as Category[]);
    setRows(prods.data as Row[]);
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (cancelled) return;
      if (!data.user) return setStatus("signedout");
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      if (!profile?.is_admin) return setStatus("forbidden");
      setStatus("ready");
      load();
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, load]);

  const categoryLabel = (c: Category) => {
    const parent = categories.find((p) => p.id === c.parent_id);
    return parent ? `${parent.name} / ${c.name}` : c.name;
  };

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setMessage("");
    const priceCents = Math.round(parseFloat(price) * 100);
    const compareCents = compare ? Math.round(parseFloat(compare) * 100) : null;
    const slug = slugify(name);

    if (!name.trim() || !slug) return setMessage("Give the product a name.");
    if (!Number.isFinite(priceCents) || priceCents < 0)
      return setMessage("Enter a valid price in rands.");
    if (compareCents !== null && !(compareCents > priceCents))
      return setMessage("The compare-at price must be higher than the price.");
    if (!categoryId) return setMessage("Choose a category.");
    if (files.some((f) => f.size > 5 * 1024 * 1024))
      return setMessage("Each photo must be under 5 MB.");

    setBusy(true);
    try {
      const urls: string[] = [];
      for (const [i, file] of files.entries()) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${slug}/${Date.now()}-${i}.${ext}`;
        const { error } = await sb.storage
          .from("product-images")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        urls.push(
          sb.storage.from("product-images").getPublicUrl(path).data.publicUrl,
        );
      }

      const { error } = await sb.from("products").insert({
        slug,
        name: name.trim(),
        description: description.trim() || null,
        price_cents: priceCents,
        compare_at_cents: compareCents,
        stock: Math.max(0, parseInt(stock, 10) || 0),
        category_id: categoryId,
        images: urls,
        is_best_seller: bestSeller,
      });
      if (error) throw new Error(error.message);

      setName("");
      setPrice("");
      setCompare("");
      setDescription("");
      setBestSeller(false);
      setFiles([]);
      setMessage(`Added "${name.trim()}".`);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(r: Row) {
    if (!sb) return;
    const { error } = await sb
      .from("products")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) return setMessage(error.message);
    load();
  }

  async function remove(r: Row) {
    if (!sb) return;
    if (!window.confirm(`Delete "${r.name}"? This cannot be undone.`)) return;
    const { error } = await sb.from("products").delete().eq("id", r.id);
    if (error) return setMessage(error.message);
    load();
  }

  if (status !== "ready") {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-light text-ink">Admin</h1>
        <p className="mt-4 text-muted">
          {status === "unconfigured" &&
            "Supabase is not configured. Set the project URL and anon key to manage products."}
          {status === "loading" && "Checking access..."}
          {status === "signedout" &&
            "Sign in with the owner account to manage products."}
          {status === "forbidden" && "This account does not have admin access."}
        </p>
        {(status === "signedout" || status === "forbidden") && (
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
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
          Products
        </h1>
        <nav
          aria-label="Admin"
          className="flex gap-5 text-sm"
        >
          <Link
            href="/admin/orders"
            className="text-muted underline underline-offset-4 hover:text-ink"
          >
            Orders
          </Link>
          <Link
            href="/admin/reviews"
            className="text-muted underline underline-offset-4 hover:text-ink"
          >
            Review approvals
          </Link>
        </nav>
      </div>

      <form
        onSubmit={addProduct}
        className="mt-10 grid gap-4 rounded-3xl border border-line bg-white/50 p-5 sm:grid-cols-2 sm:p-8"
      >
        <h2 className="text-lg text-ink sm:col-span-2">Add a product</h2>
        <input
          className={`${field} sm:col-span-2`}
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={field}
          placeholder="Price (R)"
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          className={field}
          placeholder="Compare-at price (R), optional"
          inputMode="decimal"
          value={compare}
          onChange={(e) => setCompare(e.target.value)}
        />
        <select
          className={field}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option
              key={c.id}
              value={c.id}
            >
              {categoryLabel(c)}
            </option>
          ))}
        </select>
        <input
          className={field}
          placeholder="Stock"
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
        <textarea
          className={`${field} h-28 py-3 sm:col-span-2`}
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="flex items-center gap-3 text-[15px] text-ink">
          <input
            type="checkbox"
            checked={bestSeller}
            onChange={(e) => setBestSeller(e.target.checked)}
            className="size-5"
          />
          Mark as best seller
        </label>
        <label className="text-[15px] text-ink">
          Photos (first one is the main photo)
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="mt-2 block w-full text-sm text-muted"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            {busy ? "Saving..." : "Add product"}
          </button>
          {message && (
            <p
              role="status"
              className="text-[15px] text-muted"
            >
              {message}
            </p>
          )}
        </div>
      </form>

      <ul className="mt-10 divide-y divide-line rounded-3xl border border-line bg-white/50">
        {rows.length === 0 && (
          <li className="p-6 text-muted">No products yet.</li>
        )}
        {rows.map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-ink">{r.name}</p>
              <p className="text-sm text-muted">
                {rands(r.price_cents)} · {r.stock} in stock · {r.images.length}{" "}
                photo{r.images.length === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={() => toggleActive(r)}
              className="h-10 rounded-full border border-line px-4 text-sm text-ink transition-colors duration-300 hover:border-ink"
            >
              {r.is_active ? "Live" : "Hidden"}
            </button>
            <button
              onClick={() => remove(r)}
              className="h-10 rounded-full border border-line px-4 text-sm text-sale transition-colors duration-300 hover:border-sale"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
