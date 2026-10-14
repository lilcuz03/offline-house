import { createClient } from "@supabase/supabase-js";

/* ---------- shapes the components expect ---------- */

/** What product cards and rails need. Matches the Product type in BestSellers. */
export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  category: string | null;
  /** Rands (the database stores cents). */
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  hoverImage: string | null;
  rating: number | null;
  reviewCount: number | null;
  badge: string | null;
};

/** Everything the product page needs. */
export type CatalogProductDetail = CatalogProduct & {
  description: string | null;
  images: string[];
  inStock: boolean;
  variants: { name: string; options: string[] }[];
  details: string[];
};

export type CatalogReview = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  text: string;
  date: string;
  verified: boolean;
};

/* ---------- database row ---------- */

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  images: string[] | null;
  badge: string | null;
  stock: number;
  variants: unknown;
  details: string[] | null;
  rating_avg: number | null;
  rating_count: number | null;
};

type ReviewRow = {
  id: string;
  name: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  created_at: string;
};

const COLUMNS =
  "id, slug, name, description, category, price_cents, compare_at_cents, images, badge, stock, variants, details, rating_avg, rating_count";

/* ---------- client (public reads only, protected by row level security) ---------- */

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error("Catalog: Supabase environment variables are missing.");
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/* ---------- mapping ---------- */

const rands = (cents: number) => cents / 100;

function toCard(r: ProductRow): CatalogProduct {
  const images = r.images ?? [];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    price: rands(r.price_cents),
    compareAtPrice: r.compare_at_cents ? rands(r.compare_at_cents) : null,
    image: images[0] ?? null,
    hoverImage: images[1] ?? null,
    rating: r.rating_avg,
    reviewCount: r.rating_count,
    badge: r.badge,
  };
}

function toVariants(raw: unknown): { name: string; options: string[] }[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((v) => {
    if (!v || typeof v !== "object") return [];
    const { name, options } = v as { name?: unknown; options?: unknown };
    if (typeof name !== "string" || !Array.isArray(options)) return [];
    const opts = options.filter((o): o is string => typeof o === "string");
    return opts.length > 0 ? [{ name, options: opts }] : [];
  });
}

function toDetail(r: ProductRow): CatalogProductDetail {
  return {
    ...toCard(r),
    description: r.description,
    images: r.images ?? [],
    inStock: r.stock > 0,
    variants: toVariants(r.variants),
    details: r.details ?? [],
  };
}

/* ---------- queries ---------- */

/** Products in a collection. "top-sellers" and "deals" are worked out from
 *  sales and prices; anything else matches the product's collections list.
 *  Pass extra slugs (such as a parent category) to widen the match. */
export async function getCollectionProducts(
  ...slugs: string[]
): Promise<CatalogProduct[]> {
  const db = client();
  if (!db) return [];

  let query = db.from("products").select(COLUMNS).eq("active", true);

  if (slugs.includes("top-sellers")) {
    query = query.gt("sales_count", 0).order("sales_count", { ascending: false }).limit(24);
  } else if (slugs.includes("deals")) {
    query = query.eq("on_sale", true).order("created_at", { ascending: false });
  } else {
    query = query.overlaps("collections", slugs).order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("getCollectionProducts failed:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(toCard);
}

export async function getTopSellers(limit = 8): Promise<CatalogProduct[]> {
  const db = client();
  if (!db) return [];

  const { data, error } = await db
    .from("products")
    .select(COLUMNS)
    .eq("active", true)
    .gt("sales_count", 0)
    .order("sales_count", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getTopSellers failed:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(toCard);
}

export async function searchProducts(query: string): Promise<CatalogProduct[]> {
  // Strip characters that have meaning inside a PostgREST filter
  const term = query.replace(/[%_*,()\\]/g, " ").trim().slice(0, 80);
  if (!term) return [];

  const db = client();
  if (!db) return [];

  const { data, error } = await db
    .from("products")
    .select(COLUMNS)
    .eq("active", true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%,category.ilike.%${term}%`)
    .order("sales_count", { ascending: false })
    .limit(48);

  if (error) {
    console.error("searchProducts failed:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(toCard);
}

export async function getProduct(slug: string): Promise<CatalogProductDetail | null> {
  const db = client();
  if (!db) return null;

  const { data, error } = await db
    .from("products")
    .select(COLUMNS)
    .eq("active", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getProduct failed:", error.message);
    return null;
  }
  return data ? toDetail(data as ProductRow) : null;
}

export async function getRelatedProducts(
  product: { id: string; category: string | null },
  limit = 8,
): Promise<CatalogProduct[]> {
  const db = client();
  if (!db) return [];

  let query = db
    .from("products")
    .select(COLUMNS)
    .eq("active", true)
    .neq("id", product.id)
    .order("sales_count", { ascending: false })
    .limit(limit);
  if (product.category) query = query.eq("category", product.category);

  const { data, error } = await query;
  if (error) {
    console.error("getRelatedProducts failed:", error.message);
    return [];
  }
  return (data as ProductRow[]).map(toCard);
}

export async function getProductReviews(productId: string): Promise<CatalogReview[]> {
  const db = client();
  if (!db) return [];

  const { data, error } = await db
    .from("product_reviews")
    .select("id, name, rating, title, body, verified, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProductReviews failed:", error.message);
    return [];
  }
  return (data as ReviewRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    rating: r.rating,
    title: r.title,
    text: r.body,
    date: r.created_at.slice(0, 10),
    verified: r.verified,
  }));
}
