"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthForm, { type SignUpInput } from "@/components/AuthForm";
import MyOrders from "@/components/MyOrders";
import { getSupabase } from "@/lib/supabase";

/*
 * Signed out: the sign-in form (talks to Supabase Auth; AuthForm shows any
 * Error message thrown here under the form).
 * Signed in: the customer's order list.
 */
export default function AccountAuth() {
  const router = useRouter();
  const [state, setState] = useState<
    { status: "loading" } | { status: "out" } | { status: "in"; name: string }
  >({ status: "loading" });

  useEffect(() => {
    const sb = getSupabase();
    const apply = (
      user: { email?: string; user_metadata?: Record<string, unknown> } | null,
    ) => {
      if (!user) return setState({ status: "out" });
      const full = String(user.user_metadata?.full_name ?? "").trim();
      setState({ status: "in", name: full.split(" ")[0] ?? "" });
    };
    sb.auth.getSession().then(({ data }) => apply(data.session?.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, session) =>
      apply(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  async function onSignIn(email: string, password: string) {
    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw new Error(error.message);
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
    router.refresh();
  }

  async function onForgotPassword(email: string) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account`,
    });
    if (error) throw new Error(error.message);
  }

  if (state.status === "loading") return <div className="min-h-[60vh]" />;
  if (state.status === "in") return <MyOrders name={state.name} />;

  return (
    <AuthForm
      onSignIn={onSignIn}
      onSignUp={onSignUp}
      onForgotPassword={onForgotPassword}
    />
  );
}
