import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "Offline House sells only the top-selling products: tech, home, living, beauty and everyday essentials. Disconnect to reconnect.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return <AboutPage />;
}
