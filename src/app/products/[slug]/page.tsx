import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductReviews from "@/components/ProductReviews";
import RelatedProducts from "@/components/RelatedProducts";
import ProductDetail, {
  type ProductDetailData,
} from "@/components/ProductDetail";
import { getProduct, getProductSlugs } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProduct(slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();

  const product: ProductDetailData = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    description: p.description,
    images: [p.image, p.hoverImage].filter((src): src is string => !!src),
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: true,
  };

  return (
    <>
      <ProductDetail product={product} />
      <Suspense fallback={null}>
        <ProductReviews productId={p.id} />
      </Suspense>
      <Suspense fallback={null}>
        <RelatedProducts slug={p.slug} />
      </Suspense>
    </>
  );
}
