import type { Metadata } from "next";
import AdminProducts from "@/components/AdminProducts";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminProducts />;
}
