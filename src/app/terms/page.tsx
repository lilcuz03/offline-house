import type { Metadata } from "next";
import PolicyPage from "@/components/PolicyPage";

export const metadata: Metadata = { title: "Terms of service" };

/*
 * SKELETON. Every paragraph below is a prompt, not policy text. Replace each
 * one with what you actually do before launch.
 */
export default function Page() {
  return (
    <PolicyPage
      title="Terms of service"
      updated="Add the date"
      intro="Write a short plain-language summary of this page."
      sections={[
        { id: "using-the-site", title: "Using the site", paragraphs: ["TODO: the basic rules for using the website."] },
        { id: "orders-and-prices", title: "Orders and prices", paragraphs: ["TODO: how orders are accepted, how prices are shown, and what happens if a price is wrong."] },
        { id: "payment", title: "Payment", paragraphs: ["TODO: accepted payment methods and when you are charged."] },
        { id: "delivery-and-returns", title: "Delivery and returns", paragraphs: ["TODO: point to your delivery and returns pages."] },
        { id: "liability", title: "Liability", paragraphs: ["TODO: have a professional review this section."] },
        { id: "contact", title: "Contact", paragraphs: ["TODO: how people can reach you about these terms."] },
      ]}
    />
  );
}
