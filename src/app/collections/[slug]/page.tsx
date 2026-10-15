import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CollectionView from "@/components/CollectionView";
import { SITE } from "@/lib/categories";
import { getCollection, getCollectionSlugs } from "@/lib/collections";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCollectionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) return {};
  return {
    title: c.title,
    description: c.tagline,
    alternates: { canonical: `/collections/${c.slug}` },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();

  // Structured data so search engines understand the page and its products
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: c.breadcrumbs.map((crumb, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: crumb.label,
          ...(crumb.href ? { item: `${SITE.url}${crumb.href}` } : {}),
        })),
      },
      {
        "@type": "CollectionPage",
        name: c.title,
        description: c.tagline,
        url: `${SITE.url}/collections/${c.slug}`,
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: c.products.length,
          itemListElement: c.products.slice(0, 24).map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/products/${p.slug}`,
            name: p.name,
          })),
        },
      },
    ],
  };

  return (
    <main
      id="main"
      className="flex-1"
    >
      <script
        type="application/ld+json"
        // "<" is escaped so product text can never close the script tag
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      {c.products.length > 0 ? (
        <CollectionView
          title={c.title}
          tagline={c.tagline}
          products={c.products}
          breadcrumbs={c.breadcrumbs}
          subcollections={c.subcollections}
          accent={c.accent}
        />
      ) : (
        <section
          aria-labelledby="empty-heading"
          className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-6 sm:py-32"
        >
          <h1
            id="empty-heading"
            className="font-serif text-[clamp(2.5rem,7vw,4.5rem)] font-light leading-[1] text-ink"
          >
            {c.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[44ch] text-lg leading-relaxed text-muted">
            Nothing here yet. We only stock what sells, so this shelf fills up
            as products prove themselves.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/collections/top-sellers"
              className="inline-flex h-14 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
            >
              Shop top sellers
            </Link>
            {c.parent && (
              <Link
                href={c.parent.href}
                className="inline-flex h-14 items-center rounded-full border border-line px-8 text-[15px] text-ink transition-colors duration-300 hover:border-ink"
              >
                Back to {c.parent.label.toLowerCase()}
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
