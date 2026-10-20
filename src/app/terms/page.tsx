import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";
import { BUSINESS, businessLines } from "@/lib/business";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "The terms that apply when you use Offline House and buy from us.",
  alternates: { canonical: "/terms" },
};

/*
 * DRAFT written for South African law (the Consumer Protection Act and the
 * Electronic Communications and Transactions Act). Read it, make sure it
 * matches how you actually trade, and have it reviewed by a lawyer before
 * launch. Business details come from src/lib/business.ts.
 */
const UPDATED = "20 October 2026";
const name = BUSINESS.tradingName;

const link = "text-ink underline underline-offset-4 hover:text-gold-deep";

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms of service"
      updated={UPDATED}
      intro={`These terms explain how ${name} works: using the website, placing an order, paying, and what happens if something goes wrong. By using the site or placing an order, you agree to them.`}
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          paragraphs: [
            `${name} is an online shop that sells products to customers in South Africa. In these terms, "we", "us" and "our" mean ${name}, and "you" means the person using the site or placing an order.`,
            "These are our business details, as the Electronic Communications and Transactions Act asks us to show:",
          ],
          list: businessLines(),
        },
        {
          id: "using-the-site",
          title: "Using the site",
          paragraphs: [
            "You may use the site to browse and to buy products for your own personal use. You must be 18 or older, or have a parent or guardian's permission, to place an order.",
            "Please give us accurate details when you check out or create an account, and keep your password private. You are responsible for what happens under your account.",
          ],
          list: [
            "Do not use the site for anything unlawful or to harm it or other users.",
            "Do not try to break into the site, overload it, or collect its content with automated tools.",
            "We may suspend an account that is used to cheat, abuse or defraud the shop.",
          ],
        },
        {
          id: "products-and-prices",
          title: "Products and prices",
          paragraphs: [
            "All prices are in South African rand (ZAR). The price you see at checkout, with delivery added, is the full price you pay. There are no hidden fees.",
            "We try to describe and photograph every product accurately, but screens differ, so colours may look slightly different in real life.",
            "If we find that a price or product detail on the site was wrong, we will tell you before we accept your order. You can then confirm the order at the correct price or cancel it for a full refund.",
          ],
        },
        {
          id: "orders",
          title: "Placing an order",
          paragraphs: [
            "When you place an order, you are making an offer to buy. We accept it when we confirm that your payment has gone through, and we send you a confirmation email with your order number.",
            "We may refuse or cancel an order if a product is out of stock, a price was shown wrongly, we cannot deliver to your address, or we suspect fraud. If you have already paid, we will refund you in full.",
          ],
        },
        {
          id: "payment",
          title: "Payment",
          paragraphs: [
            "Payments are handled by secure payment providers, PayFast and, where it is shown at checkout, Stitch. You can pay with the methods shown at checkout, such as card or instant EFT.",
            "We never see or store your full card details. Your order is only confirmed once the payment provider tells us your payment is complete. If a payment fails or is cancelled, you are not charged for the order.",
          ],
        },
        {
          id: "delivery",
          title: "Delivery",
          paragraphs: [
            "Delivery options, prices and estimated times are on our delivery page and are shown again at checkout. Estimated times are a guide, not a guarantee.",
            "The products become yours when you have paid for them. The risk of loss or damage passes to you when the order is delivered to the address you gave us.",
          ],
          content: (
            <p>
              Read the{" "}
              <Link
                href="/delivery"
                className={link}
              >
                delivery page
              </Link>{" "}
              for the details.
            </p>
          ),
        },
        {
          id: "returns",
          title: "Returns, refunds and your rights",
          paragraphs: [
            "You can cancel and return an online order within the period set out on our returns page, and you have additional rights if a product is faulty or not as described. These rights come from the Consumer Protection Act and the Electronic Communications and Transactions Act.",
            "Nothing in these terms limits any right you have under those laws.",
          ],
          content: (
            <p>
              Read the{" "}
              <Link
                href="/returns"
                className={link}
              >
                returns and refunds page
              </Link>{" "}
              to see how to return something.
            </p>
          ),
        },
        {
          id: "reviews-and-messages",
          title: "Reviews and messages",
          paragraphs: [
            "If you post a review, you confirm it is your honest opinion, based on your own experience, and that it does not break the law. You allow us to show it on the site.",
            "We may remove reviews that are abusive, false, unlawful or not about the product. We do not pay for, edit the rating of, or invent reviews.",
          ],
        },
        {
          id: "our-content",
          title: "Our content",
          paragraphs: [
            `The ${name} name, logo, design, text and images belong to us or are used with permission. You may not copy, reuse or sell them without our written permission.`,
          ],
        },
        {
          id: "liability",
          title: "Our responsibility",
          paragraphs: [
            "We take reasonable care to keep the site accurate and available, but we cannot promise it will always be free of errors or interruptions.",
            "To the extent the law allows, we are not responsible for indirect or consequential losses, such as lost profit or lost data, that result from using the site or a product. This does not limit our responsibility for anything the law does not allow us to limit, including our responsibility for faulty goods under the Consumer Protection Act, and for loss caused by our gross negligence or intentional misconduct.",
            "Links on the site to other websites are for your convenience. We are not responsible for what those sites contain.",
          ],
        },
        {
          id: "privacy",
          title: "Your personal information",
          paragraphs: [
            "How we collect, use and protect your personal information is explained in our privacy policy.",
          ],
          content: (
            <p>
              Read the{" "}
              <Link
                href="/privacy"
                className={link}
              >
                privacy policy
              </Link>
              .
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          paragraphs: [
            "We may update these terms from time to time. The date at the top of this page shows when they last changed. The terms that apply to an order are the ones in force when you placed it.",
          ],
        },
        {
          id: "law-and-disputes",
          title: "Governing law and complaints",
          paragraphs: [
            "These terms are governed by the laws of South Africa.",
            "If you have a complaint, please contact us first. We will try to put things right quickly. If we cannot agree, you may approach the National Consumer Commission, the Consumer Goods and Services Ombud, or a court that has jurisdiction.",
          ],
        },
        {
          id: "contact",
          title: "Contact",
          paragraphs: [
            "If you have a question about these terms, get in touch.",
          ],
          content: (
            <p>
              Use the{" "}
              <Link
                href="/contact"
                className={link}
              >
                contact page
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
