import type { Product } from "@/components/home/bestseller";
import { ACCENTS, CATEGORIES } from "@/lib/categories";
import { getCollectionProducts } from "@/lib/catalog";

/*
 * Everything a /collections/[slug] page needs, worked out from one slug.
 * Product lookups go through lib/catalog.ts (Supabase).
 */

export type Crumb = { label: string; href?: string };

export type Collection = {
  slug: string;
  kind: "top-sellers" | "deals" | "category" | "subcategory";
  title: string;
  tagline: string;
  accent: string;
  breadcrumbs: Crumb[];
  /** Chips shown under the title: the sub-categories of a category. */
  subcollections: { label: string; href: string }[];
  products: Product[];
  /** Where the empty state sends people: the parent category, if there is one. */
  parent?: { label: string; href: string };
};

const HOME: Crumb = { label: "Home", href: "/" };
const SHOP: Crumb = { label: "Shop", href: "/collections" };

export function getCollectionSlugs(): string[] {
  return [
    "top-sellers",
    "deals",
    ...CATEGORIES.flatMap((c) => [c.slug, ...c.children.map((s) => s.slug)]),
  ];
}

export async function getCollection(slug: string): Promise<Collection | null> {
  if (slug === "top-sellers") {
    return {
      slug,
      kind: "top-sellers",
      title: "Top sellers",
      tagline: "The things people come back for, picked by what sells most.",
      accent: ACCENTS.gold,
      breadcrumbs: [HOME, SHOP, { label: "Top sellers" }],
      subcollections: CATEGORIES.map((c) => ({
        label: c.label,
        href: `/collections/${c.slug}`,
      })),
      products: await getCollectionProducts("top-sellers"),
    };
  }

  if (slug === "deals") {
    return {
      slug,
      kind: "deals",
      title: "Deals",
      tagline:
        "Marked down this week. When the clock runs out, prices go back up.",
      accent: ACCENTS.sale,
      breadcrumbs: [HOME, SHOP, { label: "Deals" }],
      subcollections: CATEGORIES.map((c) => ({
        label: c.label,
        href: `/collections/${c.slug}`,
      })),
      products: await getCollectionProducts("deals"),
    };
  }

  const category = CATEGORIES.find((c) => c.slug === slug);
  if (category) {
    return {
      slug,
      kind: "category",
      title: category.label,
      tagline: category.tagline,
      accent: category.accent,
      breadcrumbs: [HOME, SHOP, { label: category.label }],
      subcollections: category.children.map((s) => ({
        label: s.label,
        href: `/collections/${s.slug}`,
      })),
      products: await getCollectionProducts(category.slug),
    };
  }

  for (const parent of CATEGORIES) {
    const sub = parent.children.find((s) => s.slug === slug);
    if (!sub) continue;
    return {
      slug,
      kind: "subcategory",
      title: sub.label,
      tagline: `${sub.hint}.`,
      accent: parent.accent,
      breadcrumbs: [
        HOME,
        SHOP,
        { label: parent.label, href: `/collections/${parent.slug}` },
        { label: sub.label },
      ],
      // Sibling sub-categories, so people can move sideways
      subcollections: parent.children
        .filter((s) => s.slug !== sub.slug)
        .map((s) => ({ label: s.label, href: `/collections/${s.slug}` })),
      products: await getCollectionProducts(sub.slug),
      parent: { label: parent.label, href: `/collections/${parent.slug}` },
    };
  }

  return null;
}

/** Every product, for the main shop page. */
export { getAllProducts } from "@/lib/catalog";
