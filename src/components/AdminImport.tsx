"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Bulk product import from a CSV file. Shown inside AdminShell, which already
 * checked the visitor is an admin; Row Level Security is the real protection.
 *
 * New products are created hidden (they have no photos yet) unless you tick
 * "make live". Products whose name already exists are updated instead, which
 * also makes this a quick way to change many prices at once.
 */

type Category = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
};
type Existing = { id: string; slug: string };

type Parsed = {
  line: number;
  name: string;
  slug: string;
  categoryId: string | null;
  cost: number | null;
  price: number;
  compare: number | null;
  stock: number | null;
  description: string | null;
  best: boolean | null;
  existingId: string | null;
  errors: string[];
};

const MAX_ROWS = 500;
const CHUNK = 100;

const field =
  "h-12 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const rands = (cents: number) => `R${(cents / 100).toFixed(2)}`;

// "449", "449.99", "449,99", "R1 299.00" and "1,299.00" all work
function toCents(raw: string): number {
  let v = raw.trim().replace(/^R\s*/i, "").replace(/\s/g, "");
  if (v.includes(",") && v.includes(".")) v = v.replace(/,/g, "");
  else v = v.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(v)) return NaN;
  return Math.round(parseFloat(v) * 100);
}

/** Small CSV reader: quotes, commas or semicolons, line breaks inside quotes. */
function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delim =
    (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0)
      ? ";"
      : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

const ALIASES: Record<string, string> = {
  name: "name",
  productname: "name",
  title: "name",
  category: "category",
  costprice: "cost",
  cost: "cost",
  sellingprice: "price",
  price: "price",
  saleprice: "price",
  retailprice: "compare",
  compareat: "compare",
  compareatprice: "compare",
  originalprice: "compare",
  stock: "stock",
  quantity: "stock",
  description: "description",
  bestseller: "best",
};

const TEMPLATE_HEAD =
  "name,category,cost_price,selling_price,retail_price,stock,description,best_seller";

export default function AdminImport() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [existing, setExisting] = useState<Existing[]>([]);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Parsed[] | null>(null);
  const [has, setHas] = useState<Set<string>>(new Set());
  const [fileError, setFileError] = useState("");
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!sb) return;
    const [cats, prods] = await Promise.all([
      sb
        .from("categories")
        .select("id, slug, name, parent_id")
        .order("sort_order"),
      sb.from("products").select("id, slug"),
    ]);
    if (cats.error || prods.error) {
      setMessage(cats.error?.message ?? prods.error?.message ?? "Load failed");
      return;
    }
    setCategories(cats.data as Category[]);
    setExisting(prods.data as Existing[]);
  }, [sb]);

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, [load]);

  // Ways a category can be written in the file: slug, name, or "Tech / Chargers"
  const categoryLookup = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) {
      const parent = categories.find((p) => p.id === c.parent_id);
      map.set(c.slug.toLowerCase(), c.id);
      map.set(c.name.toLowerCase(), c.id);
      if (parent) map.set(`${parent.name} / ${c.name}`.toLowerCase(), c.id);
    }
    return map;
  }, [categories]);

  function downloadTemplate() {
    const sub = categories.find((c) => c.parent_id) ?? categories[0];
    const slug = sub?.slug ?? "chargers";
    const body = [
      TEMPLATE_HEAD,
      `20W USB-C Fast Charger,${slug},89.00,199.00,249.00,25,Charges a phone to 50% in about 30 minutes.,yes`,
      `"Braided USB-C Cable, 2m",${slug},35.00,99.00,,40,Tough braided cable that lasts.,no`,
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "offline-house-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onFile(file: File | undefined) {
    setMessage("");
    setFileError("");
    setRows(null);
    if (!file) return;
    setFileName(file.name);
    if (file.size > 2 * 1024 * 1024)
      return setFileError("That file is over 2 MB.");

    const table = parseCsv(await file.text());
    if (table.length < 2) return setFileError("The file has no product rows.");
    if (table.length - 1 > MAX_ROWS)
      return setFileError(`Import up to ${MAX_ROWS} products at a time.`);

    // Work out which column is which from the header row
    const index: Record<string, number> = {};
    table[0].forEach((h, i) => {
      const key = ALIASES[h.toLowerCase().replace(/[^a-z]/g, "")];
      if (key && !(key in index)) index[key] = i;
    });
    const missing = ["name", "category", "price"].filter((k) => !(k in index));
    if (missing.length > 0) {
      const labels: Record<string, string> = {
        name: "name",
        category: "category",
        price: "selling_price",
      };
      return setFileError(
        `Missing column: ${missing.map((m) => labels[m]).join(", ")}. Download the template to see the layout.`,
      );
    }
    setHas(new Set(Object.keys(index)));

    const slugToId = new Map(existing.map((e) => [e.slug, e.id]));
    const seen = new Map<string, number>();
    const get = (r: string[], k: string) =>
      k in index ? (r[index[k]] ?? "").trim() : "";

    const parsed: Parsed[] = table.slice(1).map((r, i) => {
      const errors: string[] = [];
      const name = get(r, "name");
      const slug = slugify(name);
      if (!name || !slug) errors.push("Name is missing");

      const catRaw = get(r, "category");
      const categoryId = catRaw
        ? (categoryLookup.get(catRaw.toLowerCase()) ?? null)
        : null;
      if (!catRaw) errors.push("Category is missing");
      else if (!categoryId) errors.push(`Unknown category "${catRaw}"`);

      const priceRaw = get(r, "price");
      const price = toCents(priceRaw);
      if (!priceRaw || !Number.isFinite(price))
        errors.push("Selling price is not a number");

      const costRaw = get(r, "cost");
      const cost = costRaw ? toCents(costRaw) : null;
      if (cost !== null && !Number.isFinite(cost))
        errors.push("Cost price is not a number");

      const compareRaw = get(r, "compare");
      const compare = compareRaw ? toCents(compareRaw) : null;
      if (compare !== null && !Number.isFinite(compare))
        errors.push("Retail price is not a number");
      else if (compare !== null && Number.isFinite(price) && !(compare > price))
        errors.push("Retail price must be higher than the selling price");

      const stockRaw = get(r, "stock");
      let stock: number | null = null;
      if (stockRaw) {
        if (/^\d+$/.test(stockRaw)) stock = parseInt(stockRaw, 10);
        else errors.push("Stock must be a whole number");
      }

      const bestRaw = get(r, "best").toLowerCase();
      const best = bestRaw ? ["yes", "y", "true", "1"].includes(bestRaw) : null;

      if (slug) {
        const prev = seen.get(slug);
        if (prev) errors.push(`Same product as row ${prev}`);
        else seen.set(slug, i + 2);
      }

      return {
        line: i + 2,
        name,
        slug,
        categoryId,
        cost: cost !== null && Number.isFinite(cost) ? cost : null,
        price,
        compare: compare !== null && Number.isFinite(compare) ? compare : null,
        stock,
        description: get(r, "description") || null,
        best,
        existingId: slugToId.get(slug) ?? null,
        errors,
      };
    });
    setRows(parsed);
  }

  const good = rows?.filter((r) => r.errors.length === 0) ?? [];
  const fresh = good.filter((r) => !r.existingId);
  const updates = good.filter((r) => r.existingId);
  const bad = (rows?.length ?? 0) - good.length;

  async function runImport() {
    if (!sb || !rows || good.length === 0) return;
    setBusy(true);
    setMessage("");
    let created = 0;
    let updated = 0;
    try {
      const costRows: {
        product_id: string;
        cost_cents: number;
        updated_at: string;
      }[] = [];
      const now = new Date().toISOString();

      // New products, in batches
      for (let i = 0; i < fresh.length; i += CHUNK) {
        const batch = fresh.slice(i, i + CHUNK);
        const { data, error } = await sb
          .from("products")
          .insert(
            batch.map((r) => ({
              slug: r.slug,
              name: r.name,
              description: r.description,
              price_cents: r.price,
              compare_at_cents: r.compare,
              stock: r.stock ?? 0,
              category_id: r.categoryId,
              images: [],
              is_best_seller: r.best ?? false,
              is_active: live,
            })),
          )
          .select("id, slug");
        if (error) throw new Error(error.message);
        created += batch.length;
        const ids = new Map((data as Existing[]).map((d) => [d.slug, d.id]));
        for (const r of batch) {
          const id = ids.get(r.slug);
          if (id && r.cost !== null)
            costRows.push({
              product_id: id,
              cost_cents: r.cost,
              updated_at: now,
            });
        }
      }

      // Existing products: only change the columns that are in the file
      for (const r of updates) {
        const patch: Record<string, unknown> = {
          name: r.name,
          category_id: r.categoryId,
          price_cents: r.price,
          updated_at: now,
        };
        if (has.has("compare")) patch.compare_at_cents = r.compare;
        if (r.stock !== null) patch.stock = r.stock;
        if (r.description) patch.description = r.description;
        if (r.best !== null) patch.is_best_seller = r.best;
        const { error } = await sb
          .from("products")
          .update(patch)
          .eq("id", r.existingId);
        if (error) throw new Error(`${r.name}: ${error.message}`);
        updated++;
        if (r.cost !== null)
          costRows.push({
            product_id: r.existingId!,
            cost_cents: r.cost,
            updated_at: now,
          });
      }

      if (costRows.length > 0) {
        const { error } = await sb.from("product_costs").upsert(costRows);
        if (error)
          throw new Error(
            `Products saved, but cost prices were not: ${error.message}`,
          );
      }

      setMessage(
        `Done. ${created} added${created > 0 && !live ? " (hidden until you add photos and make them live)" : ""}, ${updated} updated.`,
      );
      setRows(null);
      setFileName("");
      await load();
    } catch (err) {
      setMessage(
        `Stopped: ${err instanceof Error ? err.message : "something went wrong"}. ${created} added and ${updated} updated before it stopped. Fix the problem and import again; products that already exist are updated, not duplicated.`,
      );
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
        Import products
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Add or update many products at once from a spreadsheet saved as CSV.
        Photos are added afterwards with Edit, so new products start hidden.
      </p>

      <div className="mt-8 grid gap-4 rounded-3xl border border-line bg-white/50 p-5 sm:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={downloadTemplate}
            className="h-12 rounded-full border border-line px-6 text-[15px] text-ink transition-colors duration-300 hover:border-ink"
          >
            1. Download the template
          </button>
          <p className="text-sm text-muted">
            Columns: name, category, cost_price, selling_price, retail_price,
            stock, description, best_seller. Category can be its slug or name.
          </p>
        </div>

        <label className="text-[15px] text-ink">
          2. Choose your CSV file
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFile(e.target.files?.[0])}
            className={`${field} mt-2 flex items-center py-3 text-sm`}
          />
        </label>
        {fileError && (
          <p
            role="alert"
            className="text-[15px] text-sale"
          >
            {fileError}
          </p>
        )}
        {message && (
          <p
            role="status"
            className="text-[15px] text-ink"
          >
            {message}
          </p>
        )}
      </div>

      {rows && (
        <div className="mt-8">
          <p
            className="text-[15px] text-ink"
            role="status"
          >
            {fileName}: {fresh.length} new, {updates.length} to update
            {bad > 0 && (
              <span className="text-sale">, {bad} with problems (skipped)</span>
            )}
          </p>

          <div className="mt-4 overflow-x-auto rounded-3xl border border-line bg-white/50">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-muted">
                <tr className="border-b border-line">
                  <th className="px-4 py-3 font-normal">Row</th>
                  <th className="px-4 py-3 font-normal">Name</th>
                  <th className="px-4 py-3 font-normal">Cost</th>
                  <th className="px-4 py-3 font-normal">Selling</th>
                  <th className="px-4 py-3 font-normal">Stock</th>
                  <th className="px-4 py-3 font-normal">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((r) => (
                  <tr
                    key={r.line}
                    className={r.errors.length ? "bg-sale/5" : ""}
                  >
                    <td className="px-4 py-3 text-muted">{r.line}</td>
                    <td className="px-4 py-3 text-ink">
                      {r.name || "(no name)"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {r.cost !== null ? rands(r.cost) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {Number.isFinite(r.price) ? rands(r.price) : "-"}
                    </td>
                    <td className="px-4 py-3 text-muted">{r.stock ?? "-"}</td>
                    <td className="px-4 py-3">
                      {r.errors.length > 0 ? (
                        <span className="text-sale">{r.errors.join(". ")}</span>
                      ) : r.existingId ? (
                        <span className="text-ink">Update existing</span>
                      ) : (
                        <span className="text-muted">New</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-3 text-[15px] text-ink">
              <input
                type="checkbox"
                checked={live}
                onChange={(e) => setLive(e.target.checked)}
                className="size-5"
              />
              Make new products live straight away
            </label>
            <button
              onClick={runImport}
              disabled={busy || good.length === 0}
              className="inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink disabled:opacity-50"
            >
              {busy
                ? "Importing..."
                : `3. Import ${good.length} product${good.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
