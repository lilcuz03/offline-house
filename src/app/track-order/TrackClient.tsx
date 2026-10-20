"use client";

import TrackOrder, { type TrackedOrder } from "@/components/TrackerOrder";

async function lookup(
  orderNumber: string,
  email: string,
): Promise<TrackedOrder | null> {
  const res = await fetch("/api/track-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, email }),
  });
  // A thrown error shows the form's "something went wrong" message
  if (!res.ok) throw new Error("lookup failed");
  const data: { order: TrackedOrder | null } = await res.json();
  return data.order;
}

export default function TrackClient({
  defaultOrderNumber,
}: {
  defaultOrderNumber: string;
}) {
  return <TrackOrder onLookup={lookup} defaultOrderNumber={defaultOrderNumber} />;
}
