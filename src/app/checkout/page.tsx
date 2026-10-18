import CheckoutClient from "./CheckoutClient";
import type { PaymentOption } from "@/components/CheckoutForm";
import { stitchEnabled } from "@/lib/stitch";

export default function CheckoutPage() {
  // The choice only appears when both services are set up
  const paymentOptions: PaymentOption[] = stitchEnabled()
    ? [
        {
          id: "stitch",
          label: "Pay by bank, Capitec Pay or card",
          hint: "Secure payment through Stitch",
        },
        {
          id: "payfast",
          label: "Card or instant EFT",
          hint: "Secure payment through PayFast",
        },
      ]
    : [];

  return (
    <>
      <title>Checkout</title>
      <CheckoutClient paymentOptions={paymentOptions} />
    </>
  );
}
