import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { ACCENTS, CATEGORIES } from "@/lib/categories";
import { getAllProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop everything",
  description:
    "Every Offline House product in one place: chargers, cables, power banks, phone cases, home, living, beauty and everyday essentials.",
  alternates: { canonical: "/collections" },
};

export default async function CollectionsPage() {
  return (
    <main
      id="main"
      className="flex-1"
    >
      <CollectionView
        title="Shop everything"
        tagline="Only the products people keep buying."
        products={await getAllProducts()}
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
