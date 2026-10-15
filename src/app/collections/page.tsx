import type { Metadata } from "next";
import { Suspense } from "react";
import CollectionView from "@/components/CollectionView";
import { ACCENTS, CATEGORIES } from "@/lib/categories";
import { getAllProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop everything",
  description:
    "Every Offline House product in one place: chargers, cables, power banks, phone cases, home, living, beauty and everyday essentials.",
  alternates: { canonical: "/collections" },
};

async function CollectionsContent() {
  const products = await getAllProducts();

  return (
    <main
      id="main"
      className="flex-1"
    >
      <CollectionView
        title="Shop everything"
        tagline="Only the products people keep buying."
        products={products}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        subcollections={[
          { label: "Top sellers", href: "/collections/top-sellers" },
          { label: "Deals", href: "/collections/deals" },
          ...CATEGORIES.map((c) => ({
            label: c.label,
            href: `/collections/${c.slug}`,
          })),
        ]}
        accent={ACCENTS.gold}
      />
    </main>
  );
}

export default function CollectionsPage() {
  return (
    <Suspense
      fallback={
        <main id="main" className="flex-1" aria-busy="true">
          <div className="mx-auto max-w-7xl px-5 py-20 text-muted sm:px-6">
            Loading products...
          </div>
        </main>
      }
    >
      <CollectionsContent />
    </Suspense>
  );
}
