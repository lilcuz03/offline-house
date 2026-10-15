import DealsCountdown from "@/components/home/dealscountdown";
import { getCollectionProducts } from "@/lib/catalog";

// The "Up to X% off" number comes from your real deals: the biggest gap
// between a product's compare-at price and its price. With no deals on, the
// whole banner is hidden so it never promises a sale that isn't there.
export default async function DealsLive() {
  const deals = await getCollectionProducts("deals");

  const best = deals.reduce((max, p) => {
    if (!p.compareAtPrice || p.compareAtPrice <= p.price) return max;
    return Math.max(max, Math.round((1 - p.price / p.compareAtPrice) * 100));
  }, 0);

  if (best < 1) return null;
  return <DealsCountdown discountLabel={`${best}%`} />;
}
