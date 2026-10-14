import { Suspense } from "react";
import SearchResults from "@/components/SearchResults";
import { searchProducts } from "@/lib/catalog";

type Props = { searchParams: Promise<{ q?: string | string[] }> };

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

async function Content({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? "";

  return (
    <>
      <title>{query ? `Search: ${query}` : "Search"}</title>
      <SearchResults query={query} products={await searchProducts(query)} />
    </>
  );
}

export default function SearchPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<Loading />}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
