import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Returns and refunds" };

/*
 * SKELETON. Every paragraph below is a prompt, not policy text. Replace each
 * one with what you actually do before launch.
 */
export default function Page() {
  return (
    <PolicyPage
      title="Returns and refunds"
      updated="Add the date"
      intro="Write a short plain-language summary of this page."
      sections={[
        { id: "window", title: "Return window", paragraphs: ["TODO: how many days customers have to return an item."] },
        { id: "condition", title: "Condition of items", paragraphs: ["TODO: what condition returned items must be in."] },
        { id: "how-to-return", title: "How to return something", paragraphs: ["TODO: step-by-step instructions."] },
        { id: "refunds", title: "Refunds", paragraphs: ["TODO: how and when refunds are paid."] },
        { id: "faulty", title: "Faulty items", paragraphs: ["TODO: your warranty and what you do for faulty products."] },
      ]}
    />
  );
}
