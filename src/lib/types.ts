// Shapes of the rows stored in Supabase (see supabase/schema.sql).

export type DbCategory = {
  id: string;
  slug: string;
  name: string;
  parent_id: string | null;
  tagline: string | null;
  accent: string | null;
  sort_order: number;
};

export type DbProduct = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  brand: string | null;
  sku: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  stock: number;
  category_id: string | null;
  images: string[];
  features: string[];
  specs: Record<string, string>;
  is_best_seller: boolean;
  sales_count: number;
  rating: number;
  review_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Format cents as South African rand, e.g. 17900 -> "R179.00" */
export function formatRand(cents: number): string {
  const rand = (cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `R${rand}`;
}
