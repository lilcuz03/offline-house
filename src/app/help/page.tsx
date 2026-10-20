import type { Metadata } from "next";
import HelpCenter, { type FaqItem } from "@/components/HelpCenter";
import { BUSINESS } from "@/lib/business";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_OPTIONS } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Help centre",
  description:
    "Answers about orders, delivery, returns, payment and products at Offline House.",
  alternates: { canonical: "/help" },
};

const rand = (n: number) => `R${n.toLocaleString("en-GB")}`;
const options = SHIPPING_OPTIONS.map(
  (o) => `${o.label.toLowerCase()} is ${rand(o.price)} and takes ${o.eta}`,
).join(", and ");

/*
 * DRAFT answers. Prices and times come from src/lib/shipping.ts so they always
 * match checkout. Check each answer matches how you really work.
 */
const FAQS: FaqItem[] = [
  {
    category: "Orders",
    question: "How do I track my order?",
    answer:
      "Open the Track order page and enter your order number and the email you ordered with. Your order number is in your confirmation email, and you can also use the link in that email.",
  },
  {
    category: "Orders",
    question: "I didn't get a confirmation email.",
    answer:
      "Check your spam or junk folder first. If it isn't there, contact us with the email you ordered with and we will find your order and resend it. You can also look it up on the Track order page.",
  },
  {
    category: "Orders",
    question: "Can I change or cancel my order?",
    answer:
      "Contact us as soon as you can with your order number. If your order has not been packed yet, we will change or cancel it and refund you in full. Once it has been sent, you can still return it. See the returns page for how.",
  },
  {
    category: "Orders",
    question: "Can I change my delivery address after ordering?",
    answer:
      "Contact us straight away with your order number and the correct address. If the parcel has not left yet, we will update it.",
  },
  {
    category: "Payment",
    question: "How can I pay?",
    answer:
      "You pay on a secure payment page run by our payment provider. You can use the methods shown at checkout, such as card or instant EFT. We never see or store your full card details.",
  },
  {
    category: "Payment",
    question:
      "My payment went through but the page says it is still confirming.",
    answer:
      "This usually takes a few seconds. The page checks again by itself. If it is still waiting after a couple of minutes, do not pay again. Contact us with your order number and we will check it.",
  },
  {
    category: "Payment",
    question: "Why was my payment declined?",
    answer:
      "Declines usually come from your bank, for example a card limit, a security check or a typing mistake. Try again, use a different method, or check with your bank. If you were not charged, nothing needs fixing on our side.",
  },
  {
    category: "Delivery",
    question: "Where do you deliver?",
    answer:
      "We deliver anywhere in South Africa. We do not deliver outside South Africa at the moment.",
  },
  {
    category: "Delivery",
    question: "How much is delivery and how long does it take?",
    answer: `Standard ${options.replace(/^standard delivery/i, "delivery")}. Orders of ${rand(FREE_DELIVERY_THRESHOLD)} or more get free standard delivery. Times are in working days and are estimates. Remote areas can take a little longer.`,
  },
  {
    category: "Delivery",
    question: "My parcel is late or damaged.",
    answer:
      "Contact us with your order number. For damaged items, include a photo of the product and the packaging. We will sort it out with the courier and send a replacement or refund you.",
  },
  {
    category: "Returns",
    question: "How do I return something?",
    answer:
      "Contact us with your order number and tell us which item you are returning. We will reply with the return address. Send the item back unused and in its original packaging. The returns page has the full details.",
  },
  {
    category: "Returns",
    question: "When will I get my refund?",
    answer:
      "Once we have received and checked your return, we refund the original payment method and email you. You will have your money back within 30 days of cancelling. How quickly it shows in your account depends on your bank.",
  },
  {
    category: "Returns",
    question: "What if my item is faulty?",
    answer:
      "You have the right to return a faulty, unsafe or not-as-described item within 6 months of delivery for a repair, replacement or refund. We cover the return costs. Contact us with your order number and a photo if you can.",
  },
  {
    category: "Products",
    question: "Which charger or cable is right for my phone?",
    answer:
      "Check the product page for compatibility and charging speeds. If you are not sure, contact us with your phone model and we will point you to the right one.",
  },
  {
    category: "Account",
    question: "Do I need an account to order?",
    answer:
      "No. You can check out as a guest, and your confirmation email has everything you need to track the order. An account lets you save your wishlist.",
  },
  {
    category: "Account",
    question: "How do I unsubscribe from emails, or delete my account?",
    answer:
      "Use the unsubscribe link at the bottom of any newsletter. To delete your account or ask for your information to be removed, contact us and we will do it. We keep only the order records the law requires.",
  },
];

export default function HelpPage() {
  return (
    <HelpCenter
      faqs={FAQS}
      email={BUSINESS.email || undefined}
      whatsapp={BUSINESS.whatsapp || undefined}
    />
  );
}
