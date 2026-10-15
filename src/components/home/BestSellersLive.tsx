import BestSellers from "@/components/home/bestseller";
import { getCollectionProducts } from "@/lib/catalog";

// Loads the real top sellers from Supabase and hands them to the carousel.
// If there are none yet, the section stays hidden rather than showing fake products.
export default async function BestSellersLive() {
  const products = await getCollectionProducts("top-sellers");
  if (products.length === 0) return null;
  return <BestSellers products={products.slice(0, 8)} />;
}
