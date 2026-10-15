import type { Metadata } from "next";
import AccountAuth from "@/components/AccountAuth";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return <AccountAuth />;
}
