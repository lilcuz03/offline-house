import type { Metadata } from "next";
import AdminReviews from "@/components/AdminReviews";

export const metadata: Metadata = {
  title: "Review approvals",
  robots: { index: false, follow: false },
};

export default function AdminReviewsPage() {
  return <AdminReviews />;
}
