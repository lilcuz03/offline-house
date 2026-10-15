import ProductCard from "@/components/ProductCard";
import { getRelatedProducts } from "@/lib/catalog";

// Shows up to 4 other popular products from the same category.
// Hidden when there is nothing else to suggest.
export default async function RelatedProducts({ slug }: { slug: string }) {
  const products = await getRelatedProducts(slug, 4);
  if (products.length === 0) return null;

  return (
    <section
      aria-labelledby="related-heading"
      className="mx-auto max-w-7xl px-5 pb-20 pt-4 sm:px-6 sm:pb-28"
    >
      <h2
        id="related-heading"
        className="font-serif text-3xl font-light text-ink sm:text-4xl"
      >
        You may also like
      </h2>
      <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 lg:grid-cols-4">
        {products.map((p) => (
          <li key={p.id}>
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
