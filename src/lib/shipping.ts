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
