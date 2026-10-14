import { Suspense } from "react";
import { notFound } from "next/navigation";
import CollectionView from "@/components/CollectionView";
import { ACCENTS, CATEGORIES } from "@/lib/categories";
import { getCollectionProducts } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

type Resolved = {
  title: string;
  tagline: string;
  accent: string;
  parentSlug?: string;
  crumbs: { label: string; href?: string }[];
  subs: { label: string; href: string }[];
};

function resolve(slug: string): Resolved | null {
  if (slug === "top-sellers") {
    return {
      title: "Top sellers",
      tagline: "The pieces people come back for.",
      accent: ACCENTS.gold,
      crumbs: [{ label: "Home", href: "/" }, { label: "Top sellers" }],
      subs: [],
    };
  }
  if (slug === "deals") {
    return {
      title: "Deals",
      tagline: "Marked down for a limited time.",
      accent: ACCENTS.sale,
      crumbs: [{ label: "Home", href: "/" }, { label: "Deals" }],
      subs: [],
    };
  }
  for (const c of CATEGORIES) {
    if (c.slug === slug) {
      return {
        title: c.label,
        tagline: c.tagline,
        accent: c.accent,
        crumbs: [{ label: "Home", href: "/" }, { label: c.label }],
        subs: c.children.map((k) => ({
          label: k.label,
          href: `/collections/${k.slug}`,
        })),
      };
    }
    const child = c.children.find((k) => k.slug === slug);
    if (child) {
      return {
        title: child.label,
        tagline: child.hint,
        accent: c.accent,
        parentSlug: c.slug,
        crumbs: [
          { label: "Home", href: "/" },
          { label: c.label, href: `/collections/${c.slug}` },
          { label: child.label },
        ],
        subs: [],
      };
    }
  }
  return null;
}

function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-7xl px-5 py-20 sm:px-6">
      <div className="h-16 w-2/3 max-w-xl animate-pulse rounded-2xl bg-stone/40" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-stone/30" />
        ))}
      </div>
    </div>
  );
}

// The runtime part (reading params, querying the database) sits inside a
// Suspense boundary, which keeps this page valid with Cache Components on.
async function Content({ params }: Props) {
  const { slug } = await params;
  const c = resolve(slug);
  if (!c) notFound();

  // Sub-collections fall back to their parent category until each has products
  const products = await getCollectionProducts(
    ...(c.parentSlug ? [slug, c.parentSlug] : [slug]),
  );

  return (
    <>
      <title>{c.title}</title>
      <CollectionView
        title={c.title}
        tagline={c.tagline}
        products={products}
        breadcrumbs={c.crumbs}
        subcollections={c.subs}
        accent={c.accent}
      />
    </>
  );
}

export default function CollectionPage({ params }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}
