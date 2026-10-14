import type { Metadata } from "next";
import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

// Payment is not connected yet: until you pass onSubmit (PayFast / Stitch),
// the button shows "Payment isn't connected yet." instead of pretending.
export default function CheckoutPage() {
  return <CheckoutForm />;
}
