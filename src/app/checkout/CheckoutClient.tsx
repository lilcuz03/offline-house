"use client";

import CheckoutForm, {
  type CheckoutPayload,
  type PaymentOption,
} from "@/components/CheckoutForm";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

type PaymentResponse = {
  /** PayFast: a form to POST to PayFast */
  payment?: { url: string; fields: Record<string, string> };
  /** Stitch: a page to send the customer to */
  redirectUrl?: string;
  error?: string;
};

async function placeOrder(payload: CheckoutPayload) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: PaymentResponse | null = await res.json().catch(() => null);

  if (!res.ok || !(data?.payment || data?.redirectUrl)) {
    // userFacing tells the form it is safe to show this message to the customer
    throw Object.assign(
      new Error(data?.error ?? "We couldn't place your order."),
      {
        userFacing: true,
      },
    );
  }

  if (data.redirectUrl) {
    // Stitch: just go to its payment page
    window.location.href = data.redirectUrl;
  } else if (data.payment) {
    // PayFast takes a normal form POST, so build one and submit it
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.payment.url;
    for (const [name, value] of Object.entries(data.payment.fields)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  // Stay in the "placing your order" state while the browser leaves the page
  await new Promise<never>(() => {});
}

export default function CheckoutClient({
  paymentOptions,
}: {
  paymentOptions?: PaymentOption[];
}) {
  return (
    <CheckoutForm
      onSubmit={placeOrder}
      shippingOptions={SHIPPING_OPTIONS}
      paymentOptions={paymentOptions}
    />
  );
}
