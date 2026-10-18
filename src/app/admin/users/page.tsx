import type { Metadata } from "next";
import AdminUsers from "@/components/AdminUsers";

export const metadata: Metadata = {
  title: "Users",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <AdminUsers />;
}
