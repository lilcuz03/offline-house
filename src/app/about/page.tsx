import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Offline House sells only the top-selling products: tech, home, living, beauty and everyday essentials. Disconnect to reconnect.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <AboutPage
      headline="Only what earns its place on the shelf."
      intro="Offline House is a South African shop built on one rule: we only sell the things people actually keep buying. Tech that keeps up, and home pieces that help you put it down."
      chapters={[
        {
          title: "Why we exist",
          paragraphs: [
            "Most online shops try to sell you everything. We would rather sell you less, and make sure it is the right thing.",
            "The name comes from a simple idea: the best technology is the kind that works quietly in the background, so you can look up, switch off and be present. Disconnect to reconnect.",
          ],
        },
        {
          title: "How we choose",
          paragraphs: [
            "We start with what sells most and what people come back for. If a product is not earning its place, it does not make the shelf, which is why you will not find pages of filler here.",
            "We are starting with tech, the chargers, cables, phone cases and power banks you use every day, and growing into home, living, beauty and everyday essentials.",
          ],
        },
        {
          title: "How we look after you",
          paragraphs: [
            "Prices are in rands, and delivery costs are shown before you pay. Our delivery, returns and privacy pages are written in plain language, so you know where you stand.",
            "If something is not right, tell us and we will sort it out. Our returns page explains exactly how it works.",
          ],
        },
      ]}
      values={[
        {
          title: "Earned, not listed",
          body: "Every product has to prove itself with real customers before it gets a place in the shop.",
        },
        {
          title: "Honest by default",
          body: "Clear prices, clear delivery costs and clear policies, with no small print doing the work.",
        },
        {
          title: "Made for real life",
          body: "Everyday things that work the way you expect, chosen for the way people actually live.",
        },
      ]}
    />
  );
}
