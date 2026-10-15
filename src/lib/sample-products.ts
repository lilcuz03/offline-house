/*
 * SAMPLE DATA. This stands in for Supabase so every page has something to
 * show. Replace the three functions at the bottom with real queries once the
 * products table is wired up; the pages call only those functions.
 */

export type SampleProduct = {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  /** Rands (not cents). */
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  hoverImage?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  badge?: string | null;
  description?: string;
  /** Collection slugs this product appears in. */
  collections: string[];
};

const PRODUCTS: SampleProduct[] = [
  {
    id: "1",
    slug: "gan-charger-65w",
    name: "65W GaN Charger",
    category: "Tech",
    price: 449,
    compareAtPrice: 599,
    rating: 4.8,
    reviewCount: 212,
    badge: "Best seller",
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "top-sellers", "deals", "chargers-adapters"],
  },
  {
    id: "2",
    slug: "braided-usb-c-cable",
    name: "Braided USB-C Cable, 2 m",
    category: "Tech",
    price: 189,
    rating: 4.7,
    reviewCount: 148,
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "top-sellers", "cables-usb"],
  },
  {
    id: "3",
    slug: "magnetic-phone-case",
    name: "Magnetic Phone Case",
    category: "Tech",
    price: 329,
    rating: 4.6,
    reviewCount: 96,
    badge: "New",
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "phone-cases"],
  },
  {
    id: "4",
    slug: "wireless-earbuds",
    name: "Wireless Earbuds",
    category: "Tech",
    price: 799,
    compareAtPrice: 999,
    rating: 4.5,
    reviewCount: 304,
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "top-sellers", "deals", "earbuds-audio"],
  },
  {
    id: "5",
    slug: "ceramic-diffuser",
    name: "Ceramic Aroma Diffuser",
    category: "Home",
    price: 359,
    rating: 4.9,
    reviewCount: 61,
    description: "Sample product. Replace with your real description.",
    collections: ["home", "top-sellers"],
  },
  {
    id: "6",
    slug: "silk-sleep-mask",
    name: "Silk Sleep Mask",
    category: "Beauty",
    price: 219,
    rating: 4.8,
    reviewCount: 87,
    description: "Sample product. Replace with your real description.",
    collections: ["beauty", "top-sellers"],
  },
  {
    id: "7",
    slug: "desk-organiser",
    name: "Oak Desk Organiser",
    category: "Living",
    price: 499,
    rating: 4.7,
    reviewCount: 42,
    description: "Sample product. Replace with your real description.",
    collections: ["living"],
  },
  {
    id: "8",
    slug: "travel-organiser",
    name: "Cable Travel Organiser",
    category: "Essentials",
    price: 159,
    rating: 4.6,
    reviewCount: 119,
    description: "Sample product. Replace with your real description.",
    collections: ["essentials", "top-sellers"],
  },
  {
    id: "9",
    slug: "wall-charger-duo",
    name: "Dual-Port Wall Charger",
    category: "Tech",
    price: 279,
    compareAtPrice: 349,
    rating: 4.4,
    reviewCount: 73,
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "deals", "chargers-adapters"],
  },
  {
    id: "10",
    slug: "linen-throw",
    name: "Linen Throw Blanket",
    category: "Living",
    price: 649,
    rating: 4.9,
    reviewCount: 38,
    description: "Sample product. Replace with your real description.",
    collections: ["living", "home"],
  },
  {
    id: "11",
    slug: "face-roller",
    name: "Rose Quartz Face Roller",
    category: "Beauty",
    price: 249,
    compareAtPrice: 299,
    rating: 4.3,
    reviewCount: 55,
    description: "Sample product. Replace with your real description.",
    collections: ["beauty", "deals"],
  },
  {
    id: "12",
    slug: "metal-bottle",
    name: "Insulated Steel Bottle",
    category: "Essentials",
    price: 299,
    rating: 4.7,
    reviewCount: 101,
    description: "Sample product. Replace with your real description.",
    collections: ["essentials", "home"],
  },
  {
    id: "13",
    slug: "slim-power-bank-10000",
    name: "Slim Power Bank, 10,000 mAh",
    category: "Tech",
    price: 349,
    compareAtPrice: 429,
    rating: 4.7,
    reviewCount: 187,
    badge: "Best seller",
    description: "Sample product. Replace with your real description.",
    collections: ["tech", "top-sellers", "deals", "power-banks"],
  },
];

/** Products in a collection, by collection slug. Pass extra slugs (such as a parent category) to widen it. */
export function getCollectionProducts(...slugs: string[]): SampleProduct[] {
  return PRODUCTS.filter((p) => p.collections.some((c) => slugs.includes(c)));
}

export function searchProducts(query: string): SampleProduct[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return PRODUCTS.filter((p) =>
    [p.name, p.category ?? "", p.description ?? ""].some((t) =>
      t.toLowerCase().includes(q),
    ),
  );
}

export function getProduct(slug: string): SampleProduct | null {
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export function getProductSlugs(): string[] {
  return PRODUCTS.map((p) => p.slug);
}
