import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "Account" };

// Pass onSignIn / onSignUp / onForgotPassword once Supabase auth is wired up.
export default function AccountPage() {
  return <AuthForm />;
}
