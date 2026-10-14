import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail, { type ProductDetailData } from "@/components/ProductDetail";
import { getProduct, getProductSlugs } from "@/lib/sample-products";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = getProduct(slug);
  return p ? { title: p.name, description: p.description } : {};
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = getProduct(slug);
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

  return <ProductDetail product={product} />;
}
