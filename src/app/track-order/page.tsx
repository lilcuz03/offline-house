import type { Metadata } from "next";
import TrackOrder from "@/components/TrackerOrder";

type Props = { searchParams: Promise<{ order?: string | string[] }> };

export const metadata: Metadata = { title: "Track your order" };

export default async function TrackOrderPage({ searchParams }: Props) {
  const { order } = await searchParams;
  const number = (Array.isArray(order) ? order[0] : order) ?? "";

  // Pass onLookup once orders are in Supabase.
  return <TrackOrder defaultOrderNumber={number} />;
}
