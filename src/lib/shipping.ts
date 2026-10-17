/**
 * The delivery options and their prices. The server reads prices from HERE,
 * never from the browser, so a customer cannot change what delivery costs.
 *
 * PLACEHOLDER rates: replace with your real delivery options and prices.
 */
export type ShippingOption = {
  id: string;
  label: string;
  eta: string;
  /** Rands. */
  price: number;
};

export const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: "standard", label: "Standard delivery", eta: "3 to 5 working days", price: 99 },
  { id: "express", label: "Express delivery", eta: "1 to 2 working days", price: 149 },
];

/** Orders at or above this subtotal (in rands) get free standard delivery. */
export const FREE_DELIVERY_THRESHOLD = 600;

/** The delivery option the free-delivery offer applies to. */
const FREE_DELIVERY_OPTION_ID = "standard";

/**
 * What a delivery option really costs for a given subtotal (both in rands).
 * The checkout form uses it to show the price, and the server uses the same
 * function to charge it, so the two can never disagree.
 */
export function shippingPriceFor(
  option: ShippingOption,
  subtotalRands: number,
): number {
  return option.id === FREE_DELIVERY_OPTION_ID &&
    subtotalRands >= FREE_DELIVERY_THRESHOLD
    ? 0
    : option.price;
}
