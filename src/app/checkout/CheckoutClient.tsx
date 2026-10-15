"use client";

import CheckoutForm, { type CheckoutPayload } from "@/components/CheckoutForm";
import { SHIPPING_OPTIONS } from "@/lib/shipping";

type PaymentResponse = {
  payment?: { url: string; fields: Record<string, string> };
  error?: string;
};

async function placeOrder(payload: CheckoutPayload) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data: PaymentResponse | null = await res.json().catch(() => null);

  if (!res.ok || !data?.payment) {
    // userFacing tells the form it is safe to show this message to the customer
    throw Object.assign(new Error(data?.error ?? "We couldn't place your order."), {
      userFacing: true,
    });
  }

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

  // Stay in the "placing your order" state while the browser leaves the page
  await new Promise<never>(() => {});
}

export default function CheckoutClient() {
  return <CheckoutForm onSubmit={placeOrder} shippingOptions={SHIPPING_OPTIONS} />;
}
