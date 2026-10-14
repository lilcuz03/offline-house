import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = { title: "Contact us" };

export default function ContactPage() {
  // Add email, whatsapp and hours props with your real details.
  return <ContactForm />;
}
