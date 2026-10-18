import type { Metadata } from "next";
import AdminImport from "@/components/AdminImport";

export const metadata: Metadata = {
  title: "Import products",
  robots: { index: false, follow: false },
};

export default function AdminImportPage() {
  return <AdminImport />;
}
