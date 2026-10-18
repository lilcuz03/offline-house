import type { Metadata } from "next";
import AdminMessages from "@/components/AdminMessages";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false, follow: false },
};

export default function AdminMessagesPage() {
  return <AdminMessages />;
}
