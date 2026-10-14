import type { Metadata } from "next";
import SearchResults from "@/components/SearchResults";
import { searchProducts } from "@/lib/sample-products";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? "";

  return <SearchResults query={query} products={searchProducts(query)} />;
}
