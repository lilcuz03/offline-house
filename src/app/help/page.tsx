import type { Metadata } from "next";
import HelpCenter from "@/components/HelpCenter";

export const metadata: Metadata = { title: "Help centre" };

export default function HelpPage() {
  // Add email and whatsapp to show the "Still stuck?" contact buttons.
  return <HelpCenter />;
}
