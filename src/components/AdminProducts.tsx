"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Product manager, shown inside AdminShell (which already checked the visitor
 * is an admin). The real protection is the database: Row Level Security only
 * lets an admin change products or upload photos, whatever this page does.
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

const BUCKET = "product-images";
const PAGE = 25;
const LOW_STOCK = 5;

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
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  // Cost prices by product id. Admin-only table, never shown to customers.
  const [costs, setCosts] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // The form is used both for adding and for editing
  const [editing, setEditing] = useState<Editing | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [compare, setCompare] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("10");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [bestSeller, setBestSeller] = useState(false);
  const [active, setActive] = useState(true);
  const [keptImages, setKeptImages] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [fileKey, setFileKey] = useState(0); // resets the file picker

  const formRef = useRef<HTMLFormElement>(null);

  // List filters
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [sort, setSort] = useState("newest");
  const [visible, setVisible] = useState(PAGE);

  const load = useCallback(async () => {
    if (!sb) return;
    const [cats, prods, costRows] = await Promise.all([
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
      sb.from("product_costs").select("product_id, cost_cents"),
    ]);
    if (cats.error || prods.error) {
      setMessage(cats.error?.message ?? prods.error?.message ?? "Load failed");
      return;
    }
    setCategories(cats.data as Category[]);
    setRows(prods.data as Row[]);
    // If the cost table is missing the list still works, costs just stay empty
    setCosts(
      Object.fromEntries(
        (
          (costRows.data ?? []) as { product_id: string; cost_cents: number }[]
        ).map((c) => [c.product_id, c.cost_cents]),
      ),
    );
  }, [sb]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  const categoryLabel = (c: Category) => {
    const parent = categories.find((p) => p.id === c.parent_id);
    return parent ? `${parent.name} / ${c.name}` : c.name;
  };

  const parents = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) =>
    categories.filter((c) => c.parent_id === id);
  const nameOf = (id: string | null) => {
    const c = categories.find((x) => x.id === id);
    return c ? categoryLabel(c) : "No category";
  };

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    // Choosing a top-level category also includes everything inside it
    const catIds = filterCat
      ? new Set([
          filterCat,
          ...categories
            .filter((c) => c.parent_id === filterCat)
            .map((c) => c.id),
        ])
      : null;
    const list = rows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (catIds && (!r.category_id || !catIds.has(r.category_id)))
        return false;
      if (filterStatus === "live" && !r.is_active) return false;
      if (filterStatus === "hidden" && r.is_active) return false;
      if (filterStock === "out" && r.stock > 0) return false;
      if (filterStock === "low" && !(r.stock > 0 && r.stock <= LOW_STOCK))
        return false;
      if (filterStock === "in" && r.stock <= 0) return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "price-low")
      sorted.sort((a, b) => a.price_cents - b.price_cents);
    if (sort === "price-high")
      sorted.sort((a, b) => b.price_cents - a.price_cents);
    if (sort === "stock-low") sorted.sort((a, b) => a.stock - b.stock);
    return sorted; // "newest" keeps the order the database returned
  }, [rows, categories, search, filterCat, filterStatus, filterStock, sort]);

  const filtersOn =
    search !== "" ||
    filterCat !== "" ||
    filterStatus !== "all" ||
    filterStock !== "all";

  function clearFilters() {
    setSearch("");
    setFilterCat("");
    setFilterStatus("all");
    setFilterStock("all");
    setSort("newest");
    setVisible(PAGE);
  }

  // Live profit preview under the price fields
  const sellingCents = toCents(price);
  const costCents = cost.trim() ? toCents(cost) : NaN;
  const profit =
    Number.isFinite(sellingCents) && Number.isFinite(costCents)
      ? sellingCents - costCents
      : null;
  const margin =
    profit !== null && sellingCents > 0 ? (profit / sellingCents) * 100 : null;

  function resetForm() {
    setEditing(null);
    setName("");
    setPrice("");
    setCompare("");
    setCost("");
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
    setCost(costs[r.id] != null ? (costs[r.id] / 100).toFixed(2) : "");
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

  // Cost lives in its own admin-only table: set it, or clear it when emptied
  async function saveCost(productId: string, costCents: number | null) {
    if (!sb) return;
    const { error } =
      costCents === null
        ? await sb.from("product_costs").delete().eq("product_id", productId)
        : await sb.from("product_costs").upsert({
            product_id: productId,
            cost_cents: costCents,
            updated_at: new Date().toISOString(),
          });
    if (error)
      throw new Error(
        `Saved the product, but not its cost price: ${error.message}`,
      );
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
      return setMessage("Enter a valid selling price in rands.");
    if (
      compareCents !== null &&
      (!Number.isFinite(compareCents) || !(compareCents > priceCents))
    )
      return setMessage(
        "The retail price must be higher than the selling price, or leave it empty.",
      );
    const costCents = cost.trim() ? toCents(cost) : null;
    if (costCents !== null && (!Number.isFinite(costCents) || costCents < 0))
      return setMessage(
        "Enter a valid cost price in rands, or leave it empty.",
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
        uploaded.push(
          sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
        );
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
        await saveCost(editing.id, costCents);

        // Tidy up photos that were taken off the product (best effort)
        const removed = editing.original.filter((u) => !keptImages.includes(u));
        const paths = removed.map(storagePath).filter((p): p is string => !!p);
        if (paths.length > 0) await sb.storage.from(BUCKET).remove(paths);

        setMessage(`Saved changes to "${name.trim()}".`);
        resetForm();
      } else {
        const { data: created, error } = await sb
          .from("products")
          .insert({ slug, ...fields })
          .select("id")
          .single();
        if (error || !created)
          throw new Error(error?.message ?? "Could not add the product.");
        await saveCost(created.id as string, costCents);
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

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
        Products
      </h1>

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
        <fieldset className="grid gap-4 rounded-2xl border border-line p-4 sm:col-span-2 sm:grid-cols-3">
          <legend className="px-2 text-sm text-muted">Pricing</legend>
          <label className="text-sm text-muted">
            Cost price (R), only you see this
            <input
              className={`${field} mt-1.5`}
              placeholder="What you pay"
              inputMode="decimal"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </label>
          <label className="text-sm text-muted">
            Selling price (R)
            <input
              className={`${field} mt-1.5`}
              placeholder="What the customer pays"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </label>
          <label className="text-sm text-muted">
            Retail price (R), optional
            <input
              className={`${field} mt-1.5`}
              placeholder="Shown crossed out"
              inputMode="decimal"
              value={compare}
              onChange={(e) => setCompare(e.target.value)}
            />
          </label>
          <p
            className={`text-sm sm:col-span-3 ${
              profit !== null && profit < 0 ? "text-sale" : "text-muted"
            }`}
          >
            {profit === null
              ? "Enter a cost and a selling price to see your profit."
              : profit < 0
                ? `You would lose ${rands(-profit)} on every sale.`
                : `Profit ${rands(profit)} per item${margin !== null ? ` (${margin.toFixed(0)}% margin)` : ""}.`}
          </p>
        </fieldset>
        <label className="text-sm text-muted">
          Category
          <select
            className={`${field} mt-1.5`}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Choose a category</option>
            {categories.map((c) => (
              <option
                key={c.id}
                value={c.id}
              >
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
                <li
                  key={url}
                  className="w-28"
                >
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
          {editing ? "Add more photos" : "Photos (first one is the main photo)"}
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
            <p
              role="status"
              className="text-[15px] text-muted"
            >
              {message}
            </p>
          )}
        </div>
      </form>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          className={`${field} sm:col-span-2 lg:col-span-4`}
          type="search"
          placeholder="Search products by name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setVisible(PAGE);
          }}
        />
        <select
          className={field}
          aria-label="Category"
          value={filterCat}
          onChange={(e) => {
            setFilterCat(e.target.value);
            setVisible(PAGE);
          }}
        >
          <option value="">All categories</option>
          {parents.map((p) => (
            <optgroup
              key={p.id}
              label={p.name}
            >
              <option value={p.id}>All {p.name}</option>
              {childrenOf(p.id).map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <select
          className={field}
          aria-label="Status"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setVisible(PAGE);
          }}
        >
          <option value="all">Live and hidden</option>
          <option value="live">Live only</option>
          <option value="hidden">Hidden only</option>
        </select>
        <select
          className={field}
          aria-label="Stock"
          value={filterStock}
          onChange={(e) => {
            setFilterStock(e.target.value);
            setVisible(PAGE);
          }}
        >
          <option value="all">Any stock level</option>
          <option value="in">In stock</option>
          <option value="low">{`Low stock (${LOW_STOCK} or fewer)`}</option>
          <option value="out">Out of stock</option>
        </select>
        <select
          className={field}
          aria-label="Sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="name">Name A to Z</option>
          <option value="price-low">Price: low to high</option>
          <option value="price-high">Price: high to low</option>
          <option value="stock-low">Stock: lowest first</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <p role="status">
          Showing {Math.min(visible, shown.length)} of {shown.length}
          {filtersOn ? ` (${rows.length} in total)` : ""}
        </p>
        {filtersOn && (
          <button
            onClick={clearFilters}
            className="underline underline-offset-4 hover:text-ink"
          >
            Clear filters
          </button>
        )}
      </div>

      <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white/50">
        {shown.length === 0 && (
          <li className="p-6 text-muted">
            {rows.length === 0
              ? "No products yet."
              : "No products match these filters."}
          </li>
        )}
        {shown.slice(0, visible).map((r) => {
          const onSale =
            r.compare_at_cents !== null && r.compare_at_cents > r.price_cents;
          return (
            <li
              key={r.id}
              className={`grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 p-4 sm:flex sm:flex-wrap sm:gap-x-5 sm:gap-y-2 sm:px-6 ${
                editing?.id === r.id ? "bg-gold/10" : ""
              }`}
            >
              {r.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.images[0]}
                  alt=""
                  className="size-12 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="size-12 shrink-0 rounded-xl bg-line"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">{r.name}</p>
                <p className="text-sm text-muted">
                  {nameOf(r.category_id)} · {rands(r.price_cents)}
                  {costs[r.id] != null && (
                    <span
                      className={r.price_cents < costs[r.id] ? "text-sale" : ""}
                    >
                      {" "}
                      (cost {rands(costs[r.id])},{" "}
                      {r.price_cents > 0
                        ? Math.round(
                            ((r.price_cents - costs[r.id]) / r.price_cents) *
                              100,
                          )
                        : 0}
                      % margin)
                    </span>
                  )}
                  {onSale && (
                    <>
                      {" "}
                      <span className="line-through">
                        {rands(r.compare_at_cents as number)}
                      </span>{" "}
                      <span className="text-sale">on sale</span>
                    </>
                  )}{" "}
                  ·{" "}
                  {r.stock === 0 ? (
                    <span className="text-sale">out of stock</span>
                  ) : (
                    `${r.stock} in stock`
                  )}{" "}
                  · {r.images.length} photo{r.images.length === 1 ? "" : "s"} ·{" "}
                  {r.is_active ? (
                    "live"
                  ) : (
                    <span className="text-sale">hidden</span>
                  )}
                </p>
              </div>
              <div className="col-span-2 flex flex-wrap gap-2 sm:contents">
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
              </div>
            </li>
          );
        })}
      </ul>

      {visible < shown.length && (
        <button
          onClick={() => setVisible((v) => v + PAGE)}
          className="mx-auto mt-6 flex h-12 items-center rounded-full border border-line px-8 text-[15px] text-ink transition-colors duration-300 hover:border-ink"
        >
          Show more
        </button>
      )}
    </section>
  );
}
