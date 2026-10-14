import { Suspense } from "react";
import TrackOrder from "@/components/TrackerOrder";

type Props = { searchParams: Promise<{ order?: string | string[] }> };

async function Content({ searchParams }: Props) {
  const { order } = await searchParams;
  const number = (Array.isArray(order) ? order[0] : order) ?? "";

  // Pass onLookup once orders are saved in Supabase.
  return (
    <>
      <title>Track your order</title>
      <TrackOrder defaultOrderNumber={number} />
    </>
  );
}

export default function TrackOrderPage({ searchParams }: Props) {
  return (
    <Suspense fallback={null}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}
