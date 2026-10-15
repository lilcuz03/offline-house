import { createClient } from "@supabase/supabase-js";
import type { Product } from "@/components/home/bestseller";
import * as sample from "@/lib/sample-products";

/*
 * Real product data from Supabase. Same function names as
 * lib/sample-products.ts, but every one is async, so callers use `await`.
 * If the Supabase keys are missing (for example a fresh clone), it quietly
 * falls back to the sample data so the site still runs.
 */

export type CatalogProduct = Product & { description?: string };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(url && key);

// Server-side client: no stored session, read-only for visitors via RLS.
function db() {
  return createClient(url!, key!, { auth: { persistSession: false } });
}

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category_id: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  images: string[] | null;
  rating: number | string | null;
  review_count: number | null;
  is_best_seller: boolean;
};

const COLUMNS =
  "id, slug, name, description, category_id, price_cents, compare_at_cents, images, rating, review_count, is_best_seller";

async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await db()
    .from("categories")
    .select("id, slug, name, parent_id");
  if (error) throw new Error(`Could not load categories: ${error.message}`);
  return data ?? [];
}

function toProduct(row: ProductRow, categories: CategoryRow[]): CatalogProduct {
  const cat = categories.find((c) => c.id === row.category_id);
  // Show the top-level category name (Tech), even for a sub-category product
  const top = cat?.parent_id
    ? categories.find((c) => c.id === cat.parent_id)
    : cat;
  const rating = row.rating == null ? null : Number(row.rating);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: top?.name ?? null,
    price: row.price_cents / 100,
    compareAtPrice:
      row.compare_at_cents == null ? null : row.compare_at_cents / 100,
    image: row.images?.[0] ?? null,
    hoverImage: row.images?.[1] ?? null,
    rating: rating && rating > 0 ? rating : null,
    reviewCount: row.review_count || null,
    badge: row.is_best_seller ? "Best seller" : null,
    description: row.description ?? undefined,
  };
}

/** Products in a collection: "top-sellers", "deals", or any category slug. */
export async function getCollectionProducts(slug: string): Promise<CatalogProduct[]> {
  if (!configured) return sample.getCollectionProducts(slug);
  const categories = await getCategories();
  let q = db().from("products").select(COLUMNS).eq("is_active", true);

  if (slug === "top-sellers") {
    q = q.order("sales_count", { ascending: false }).limit(24);
  } else if (slug === "deals") {
    q = q.not("compare_at_cents", "is", null).order("sales_count", {
      ascending: false,
    });
  } else {
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return [];
    // A top-level category also includes everything in its sub-categories
    const ids = [
      cat.id,
      ...categories.filter((c) => c.parent_id === cat.id).map((c) => c.id),
    ];
    q = q.in("category_id", ids).order("sales_count", { ascending: false });
  }

  const { data, error } = await q;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductRow[]).map((r) => toProduct(r, categories));
}

/** Every active product, for the main shop page. */
export async function getAllProducts(): Promise<CatalogProduct[]> {
  if (!configured) {
    return sample.getProductSlugs().map((s) => sample.getProduct(s)!);
  }
  const categories = await getCategories();
  const { data, error } = await db()
    .from("products")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sales_count", { ascending: false });
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data as ProductRow[]).map((r) => toProduct(r, categories));
}

export async function searchProducts(query: string): Promise<CatalogProduct[]> {
  const q = query.trim();
  if (!q) return [];
  if (!configured) return sample.searchProducts(q);
  const categories = await getCategories();
  // Strip characters that have meaning inside a PostgREST filter
  const term = q.replace(/[%,()*\\]/g, " ").trim();
  if (!term) return [];
  const { data, error } = await db()
    .from("products")
    .select(COLUMNS)
    .eq("is_active", true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
    .order("sales_count", { ascending: false })
    .limit(48);
  if (error) throw new Error(`Search failed: ${error.message}`);
  return (data as ProductRow[]).map((r) => toProduct(r, categories));
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  if (!configured) return sample.getProduct(slug);
  const categories = await getCategories();
  const { data, error } = await db()
    .from("products")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data ? toProduct(data as ProductRow, categories) : null;
}

export async function getProductSlugs(): Promise<string[]> {
  if (!configured) return sample.getProductSlugs();
  const { data, error } = await db()
    .from("products")
    .select("slug")
    .eq("is_active", true);
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const slugs = (data ?? []).map((r) => r.slug as string);
  // Next needs at least one static param, even if the shop is still empty
  return slugs.length ? slugs : sample.getProductSlugs().slice(0, 1);
}
