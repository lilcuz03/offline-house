"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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
  description: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  category_id: string | null;
  is_best_seller: boolean;
  is_active: boolean;
  images: string[];
};

type Editing = {
  id: string;
  slug: string;
  name: string;
  /** Photos the product had when editing started, to clean up removed ones. */
  original: string[];
};

type Status = "unconfigured" | "loading" | "signedout" | "forbidden" | "ready";

const BUCKET = "product-images";

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

// Accepts "449", "449.99" and "449,99"
const toCents = (value: string) =>
  Math.round(parseFloat(value.trim().replace(",", ".")) * 100);

// Works out the file path inside the bucket from a photo's public URL
function storagePath(url: string) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1
    ? null
    : decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

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

  // The form is used both for adding and for editing
  const [editing, setEditing] = useState<Editing | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compare, setCompare] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [active, setActive] = useState(true);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0); // resets the file picker

  const formRef = useRef<HTMLFormElement>(null);

  const load = useCallback(async () => {
    if (!sb) return;
    const [cats, prods] = await Promise.all([
      sb
        .from("categories")
        .select("id, slug, name, parent_id")
        .order("sort_order"),
      sb
        .from("products")
        .select(
          "id, slug, name, description, price_cents, compare_at_cents, stock, category_id, is_best_seller, is_active, images",
        )
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

  function resetForm() {
    setEditing(null);
    setName("");
    setPrice("");
    setCompare("");
    setStock("10");
    setCategoryId("");
    setDescription("");
    setBestSeller(false);
    setActive(true);
    setKeptImages([]);
    setFiles([]);
    setFileKey((k) => k + 1);
  }

  function startEdit(r: Row) {
    setEditing({ id: r.id, slug: r.slug, name: r.name, original: r.images });
    setName(r.name);
    setPrice((r.price_cents / 100).toFixed(2));
    setCompare(r.compare_at_cents ? (r.compare_at_cents / 100).toFixed(2) : "");
    setStock(String(r.stock));
    setCategoryId(r.category_id ?? "");
    setDescription(r.description ?? "");
    setBestSeller(r.is_best_seller);
    setActive(r.is_active);
    setKeptImages(r.images);
    setFiles([]);
    setFileKey((k) => k + 1);
    setMessage("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function makeMainPhoto(url: string) {
    setKeptImages((imgs) => [url, ...imgs.filter((u) => u !== url)]);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!sb) return;
    setMessage("");

    const priceCents = toCents(price);
    const compareCents = compare.trim() ? toCents(compare) : null;
    const slug = editing ? editing.slug : slugify(name);

    if (!name.trim() || !slug) return setMessage("Give the product a name.");
    if (!Number.isFinite(priceCents) || priceCents < 0)
      return setMessage("Enter a valid price in rands.");
    if (
      compareCents !== null &&
      (!Number.isFinite(compareCents) || !(compareCents > priceCents))
    )
      return setMessage(
        "The original price must be higher than the price, or leave it empty.",
      );
    if (!categoryId) return setMessage("Choose a category.");
    if (files.some((f) => f.size > 5 * 1024 * 1024))
      return setMessage("Each photo must be under 5 MB.");

    setBusy(true);
    try {
      // Upload any newly chosen photos
      const uploaded: string[] = [];
      for (const [i, file] of files.entries()) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const path = `${slug}/${Date.now()}-${i}.${ext}`;
        const { error } = await sb.storage
          .from(BUCKET)
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(`Photo upload failed: ${error.message}`);
        uploaded.push(sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
      }

      const fields = {
        name: name.trim(),
        description: description.trim() || null,
        price_cents: priceCents,
        compare_at_cents: compareCents,
        stock: Math.max(0, parseInt(stock, 10) || 0),
        category_id: categoryId,
        images: [...keptImages, ...uploaded],
        is_best_seller: bestSeller,
      };

      if (editing) {
        // The web address (slug) is left alone so existing links keep working
        const { error } = await sb
          .from("products")
          .update({
            ...fields,
            is_active: active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editing.id);
        if (error) throw new Error(error.message);

        // Tidy up photos that were taken off the product (best effort)
        const removed = editing.original.filter((u) => !keptImages.includes(u));
        const paths = removed
          .map(storagePath)
          .filter((p): p is string => !!p);
        if (paths.length > 0) await sb.storage.from(BUCKET).remove(paths);

        setMessage(`Saved changes to "${name.trim()}".`);
        resetForm();
      } else {
        const { error } = await sb.from("products").insert({ slug, ...fields });
        if (error) throw new Error(error.message);
        setMessage(`Added "${name.trim()}".`);
        resetForm();
      }
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
    if (
      !window.confirm(
        `Delete "${r.name}"? Its reviews are deleted with it and this cannot be undone. If it has already sold, hide it instead.`,
      )
    )
      return;
    const { error } = await sb.from("products").delete().eq("id", r.id);
    if (error) return setMessage(error.message);
    if (editing?.id === r.id) resetForm();
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
        <nav aria-label="Admin" className="flex gap-5 text-sm">
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
        ref={formRef}
        onSubmit={submit}
        className={`mt-10 grid scroll-mt-28 gap-4 rounded-3xl border bg-white/50 p-5 transition-colors duration-300 sm:grid-cols-2 sm:p-8 ${
          editing ? "border-gold-deep" : "border-line"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <h2 className="text-lg text-ink">
            {editing ? `Editing: ${editing.name}` : "Add a product"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={resetForm}
              className="h-10 rounded-full border border-line px-5 text-sm text-ink transition-colors duration-300 hover:border-ink"
            >
              Cancel
            </button>
          )}
        </div>

        <label className="text-sm text-muted sm:col-span-2">
          Name
          <input
            className={`${field} mt-1.5`}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted">
          Price (R)
          <input
            className={`${field} mt-1.5`}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted">
          Original price (R), only for a sale
          <input
            className={`${field} mt-1.5`}
            placeholder="Leave empty when not on sale"
            inputMode="decimal"
            value={compare}
            onChange={(e) => setCompare(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted">
          Category
          <select
            className={`${field} mt-1.5`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {categoryLabel(c)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          Stock
          <input
            className={`${field} mt-1.5`}
            inputMode="numeric"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </label>
        <label className="text-sm text-muted sm:col-span-2">
          Description
          <textarea
            className={`${field} mt-1.5 h-28 py-3`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>

        <div className="flex flex-wrap gap-x-8 gap-y-3 sm:col-span-2">
          <label className="flex items-center gap-3 text-[15px] text-ink">
            <input
              type="checkbox"
              checked={bestSeller}
              onChange={(e) => setBestSeller(e.target.checked)}
              className="size-5"
            />
            Mark as best seller
          </label>
          {editing && (
            <label className="flex items-center gap-3 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="size-5"
              />
              Live on the shop
            </label>
          )}
        </div>

        {/* Current photos (editing only) */}
        {editing && keptImages.length > 0 && (
          <div className="sm:col-span-2">
            <p className="text-sm text-muted">
              Current photos. The first one is the main photo.
            </p>
            <ul className="mt-2 flex flex-wrap gap-3">
              {keptImages.map((url, i) => (
                <li key={url} className="w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className={`aspect-square w-full rounded-xl object-cover ${
                      i === 0 ? "ring-2 ring-ink" : ""
                    }`}
                  />
                  <div className="mt-1.5 flex flex-col gap-1 text-xs">
                    {i !== 0 && (
                      <button
                        type="button"
                        onClick={() => makeMainPhoto(url)}
                        className="text-left text-ink underline underline-offset-2"
                      >
                        Make main
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setKeptImages((imgs) => imgs.filter((u) => u !== url))
                      }
                      className="text-left text-sale underline underline-offset-2"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="text-sm text-muted sm:col-span-2">
          {editing
            ? "Add more photos"
            : "Photos (first one is the main photo)"}
          <input
            key={fileKey}
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
            {busy ? "Saving..." : editing ? "Save changes" : "Add product"}
          </button>
          {message && (
            <p role="status" className="text-[15px] text-muted">
              {message}
            </p>
          )}
        </div>
      </form>

      <ul className="mt-10 divide-y divide-line rounded-3xl border border-line bg-white/50">
        {rows.length === 0 && (
          <li className="p-6 text-muted">No products yet.</li>
        )}
        {rows.map((r) => {
          const onSale =
            r.compare_at_cents !== null && r.compare_at_cents > r.price_cents;
          return (
            <li
              key={r.id}
              className={`flex flex-wrap items-center gap-x-6 gap-y-2 p-4 sm:px-6 ${
                editing?.id === r.id ? "bg-gold/10" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">{r.name}</p>
                <p className="text-sm text-muted">
                  {rands(r.price_cents)}
                  {onSale && (
                    <>
                      {" "}
                      <span className="line-through">
                        {rands(r.compare_at_cents as number)}
                      </span>{" "}
                      <span className="text-sale">on sale</span>
                    </>
                  )}{" "}
                  · {r.stock === 0 ? (
                    <span className="text-sale">out of stock</span>
                  ) : (
                    `${r.stock} in stock`
                  )}{" "}
                  · {r.images.length} photo{r.images.length === 1 ? "" : "s"}{" "}
                  · {r.is_active ? "live" : <span className="text-sale">hidden</span>}
                </p>
              </div>
              <button
                onClick={() => startEdit(r)}
                className="h-10 rounded-full bg-ink px-5 text-sm text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
              >
                Edit
              </button>
              <button
                onClick={() => toggleActive(r)}
                className="h-10 rounded-full border border-line px-4 text-sm text-ink transition-colors duration-300 hover:border-ink"
              >
                {r.is_active ? "Hide" : "Show"}
              </button>
              <button
                onClick={() => remove(r)}
                className="h-10 rounded-full border border-line px-4 text-sm text-sale transition-colors duration-300 hover:border-sale"
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}