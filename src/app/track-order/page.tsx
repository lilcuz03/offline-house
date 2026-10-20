import { Suspense } from "react";
import TrackClient from "./TrackClient";

type Props = { searchParams: Promise<{ order?: string | string[] }> };

async function Content({ searchParams }: Props) {
  const { order } = await searchParams;
  const number = (Array.isArray(order) ? order[0] : order) ?? "";

  return (
    <>
      <title>Track your order</title>
      <TrackClient defaultOrderNumber={number} />
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
