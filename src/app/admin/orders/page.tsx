import type { Metadata } from "next";
import AdminOrders from "@/components/AdminOrders";

export const metadata: Metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default function AdminOrdersPage() {
  return <AdminOrders />;
}
