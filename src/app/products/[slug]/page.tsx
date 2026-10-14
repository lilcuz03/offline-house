import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductDetail, { type ProductDetailData } from "@/components/ProductDetail";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import {
  getProduct,
  getProductReviews,
  getRelatedProducts,
} from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

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

async function Content({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const [reviews, related] = await Promise.all([
    getProductReviews(p.id),
    getRelatedProducts({ id: p.id, category: p.category }),
  ]);

  const product: ProductDetailData = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    description: p.description,
    images: p.images,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock,
    variants: p.variants,
    details: p.details.length > 0 ? p.details : undefined,
  };

  return (
    <>
      <title>{p.name}</title>
      <ProductDetail product={product} />
      {/* Pass onSubmit once review saving is built; until then the form says so */}
      <ProductReviews productName={p.name} reviews={reviews} />
      <RelatedProducts products={related} href="/collections/top-sellers" />
    </>
  );
}

export default function ProductPage({ params }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content params={params} />
    </Suspense>
  );
}
