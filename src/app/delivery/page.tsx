import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS } from "@/lib/business";
import { FREE_DELIVERY_THRESHOLD, SHIPPING_OPTIONS } from "@/lib/shipping";

export const metadata: Metadata = {
  title: "Delivery",
  description:
    "Where Offline House delivers, what delivery costs and how long it takes.",
  alternates: { canonical: "/delivery" },
};

/*
 * DRAFT. The prices and times below come from src/lib/shipping.ts, so they
 * always match checkout. Check the "where we deliver" and "packing" lines
 * match how you really work.
 */
const UPDATED = "20 October 2026";

const rand = (n: number) => `R${n.toLocaleString("en-GB")}`;
const link = "text-ink underline underline-offset-4 hover:text-gold-deep";

export default function DeliveryPage() {
  return (
    <PolicyPage
      title="Delivery"
      updated={UPDATED}
      intro="Where we deliver, what it costs and how long it takes. The delivery price is always shown before you pay."
      sections={[
        {
          id: "where",
          title: "Where we deliver",
          paragraphs: [
            "We deliver anywhere in South Africa. Deliveries to remote or rural areas can take a little longer than the estimates below.",
            "We do not deliver outside South Africa at the moment.",
          ],
        },
        {
          id: "options",
          title: "Delivery options and prices",
          paragraphs: ["Choose the option you want at checkout."],
          list: [
            ...SHIPPING_OPTIONS.map(
              (o) => `${o.label}: ${rand(o.price)}, ${o.eta}.`,
            ),
            `Free standard delivery on orders of ${rand(FREE_DELIVERY_THRESHOLD)} or more.`,
          ],
        },
        {
          id: "timing",
          title: "How long it takes",
          paragraphs: [
            "Delivery times are in working days (Monday to Friday, not counting public holidays) and are estimates, not guarantees.",
            "We pack and send your order after your payment is confirmed. Orders paid for on a weekend or public holiday are processed on the next working day.",
          ],
        },
        {
          id: "tracking",
          title: "Tracking your order",
          paragraphs: [
            "Your confirmation email has your order number and a link to follow your order. You can also check it at any time on the track order page.",
          ],
          content: (
            <p>
              <Link
                href="/track-order"
                className={link}
              >
                Track your order
              </Link>
            </p>
          ),
        },
        {
          id: "address",
          title: "Your delivery address",
          paragraphs: [
            "Please check your address carefully before you pay. If you notice a mistake, contact us straight away, and we will try to fix it before the parcel leaves.",
            "Someone needs to be available to receive the parcel. If a delivery fails because the address was wrong or nobody could accept it, we may need to charge for sending it again.",
          ],
        },
        {
          id: "problems",
          title: "If something goes wrong",
          paragraphs: [
            "If your order is late, missing or arrives damaged, please tell us as soon as you can with your order number. For damaged items, include a photo of the product and the packaging.",
            "We will sort it out with the courier and either send a replacement or refund you. Our returns page explains your rights if a product is faulty or not as described.",
          ],
          content: (
            <p>
              <Link
                href="/contact"
                className={link}
              >
                Contact us
              </Link>
              {BUSINESS.email ? (
                <>
                  {" "}
                  or email{" "}
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className={link}
                  >
                    {BUSINESS.email}
                  </a>
                </>
              ) : null}
              .
            </p>
          ),
        },
      ]}
    />
  );
}
