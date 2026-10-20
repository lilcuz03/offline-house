import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { BUSINESS, hoursLines } from "@/lib/business";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Offline House about an order, delivery, a return or anything else.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <ContactForm
      email={BUSINESS.email || undefined}
      whatsapp={BUSINESS.whatsapp || undefined}
      hours={hoursLines()}
    />
  );
}
