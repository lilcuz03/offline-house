import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Delivery" };

/*
 * SKELETON. Every paragraph below is a prompt, not policy text. Replace each
 * one with what you actually do before launch.
 */
export default function Page() {
  return (
    <PolicyPage
      title="Delivery"
      updated="Add the date"
      intro="Write a short plain-language summary of this page."
      sections={[
        { id: "where", title: "Where we deliver", paragraphs: ["TODO: the areas you deliver to."] },
        { id: "options", title: "Delivery options and prices", paragraphs: ["TODO: each method, its price and its estimated time."] },
        { id: "tracking", title: "Tracking your order", paragraphs: ["TODO: how customers get tracking details."] },
        { id: "problems", title: "If something goes wrong", paragraphs: ["TODO: late, damaged or missing parcels, and who to contact."] },
      ]}
    />
  );
}
