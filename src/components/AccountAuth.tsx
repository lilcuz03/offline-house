"use client";

import { useRouter } from "next/navigation";
import AuthForm, { type SignUpInput } from "@/components/AuthForm";
import { getSupabase } from "@/lib/supabase";

/*
 * Connects the sign-in form to Supabase Auth.
 * AuthForm shows any Error message thrown here under the form.
 */
export default function AccountAuth() {
  const router = useRouter();

  async function onSignIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
    router.push("/");
    router.refresh();
  }

  async function onSignUp({ name, email, password }: SignUpInput) {
    const { data, error } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        // The database trigger copies full_name into the profiles table
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/account`,
      },
    });
    if (error) throw new Error(error.message);
    // No session yet means Supabase is waiting for the email to be confirmed
    if (!data.session) return { needsConfirmation: true };
    router.push("/");
    router.refresh();
  }

  async function onForgotPassword(email: string) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    });
    if (error) throw new Error(error.message);
  }

  return (
    <AuthForm
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
    />
  );
}
