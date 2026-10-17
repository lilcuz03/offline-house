import type { Metadata } from "next";
import Link from "next/link";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Returns and refunds" };

/*
 * DRAFT based on South African consumer law. Read every line, make sure it
 * matches what you actually do, and have it reviewed before launch.
 *
 * The numbers live here so you only change them in one place.
 */
const UPDATED = "17 October 2026";
const CHANGE_OF_MIND_DAYS = 7; // 7 days is the legal minimum for online sales
const REFUND_WITHIN_DAYS = 30; // refunds must be paid within 30 days of cancelling

export default function ReturnsPage() {
  return (
    <PolicyPage
      title="Returns and refunds"
      updated={UPDATED}
      intro="Changed your mind, or something isn't right? Here is exactly how returns and refunds work."
      sections={[
        {
          id: "change-of-mind",
          title: "Changing your mind",
          paragraphs: [
            `You can cancel an online order and return it without giving a reason, within ${CHANGE_OF_MIND_DAYS} days of receiving it. This is your right under South Africa's Electronic Communications and Transactions Act.`,
            "To qualify, the item should be unused, in its original packaging and in the condition you received it.",
            "For a change-of-mind return, you cover the cost of sending the item back to us.",
          ],
        },
        {
          id: "faulty",
          title: "Faulty or damaged items",
          paragraphs: [
            "If an item is faulty, unsafe or not as described, you have the right under the Consumer Protection Act to return it within 6 months of delivery for a repair, a replacement or a refund, at your choice.",
            "We pay the cost of returning a faulty or damaged item. If something arrives damaged, please tell us as soon as you can and include a photo.",
          ],
        },
        {
          id: "how-to-return",
          title: "How to return something",
          list: [
            "Get in touch using the contact page and include your order number.",
            "Tell us which item you are returning and why.",
            "We will reply with the return address and what to do next.",
            "Pack the item securely in its original packaging and send it back.",
          ],
          content: (
            <p>
              <Link
                href="/contact"
                className="text-ink underline underline-offset-4 hover:text-gold-deep"
              >
                Contact us about a return
              </Link>
              . Your order number is in your confirmation email, and you can
              also{" "}
              <Link
                href="/track-order"
                className="text-ink underline underline-offset-4 hover:text-gold-deep"
              >
                track your order
              </Link>
              .
            </p>
          ),
        },
        {
          id: "refunds",
          title: "Refunds",
          paragraphs: [
            `Once we have received and checked your return, we refund the full price of the item to the payment method you used. You will have your money back within ${REFUND_WITHIN_DAYS} days of the date you cancelled.`,
            "We send you an email when your refund has been processed. How quickly it shows in your account depends on your bank.",
          ],
        },
      ]}
    />
  );
}
