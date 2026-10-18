"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Frame for every /admin page: checks the visitor is an admin once, then shows
 * a sidebar (a scrollable bar on phones) with the admin sections.
 * The real protection is still the database (Row Level Security).
 */

type Status = "unconfigured" | "loading" | "signedout" | "forbidden" | "ready";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin", label: "Products" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/users", label: "Users" },
];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const sb = useMemo(() => (supabaseConfigured ? getSupabase() : null), []);
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>(
    supabaseConfigured ? "loading" : "unconfigured",
  );

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getUser();
      if (cancelled) return;
      if (!data.user) return setStatus("signedout");
      const { data: profile } = await sb
        .from("profiles")
        .select("is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled) return;
      setStatus(profile?.is_admin ? "ready" : "forbidden");
    })();
    return () => {
      cancelled = true;
    };
  }, [sb]);

  if (status !== "ready") {
    return (
      <section className="mx-auto max-w-xl px-5 py-24 text-center sm:px-6">
        <h1 className="font-serif text-4xl font-light text-ink">Admin</h1>
        <p className="mt-4 text-muted">
          {status === "unconfigured" &&
            "Supabase is not configured. Set the project URL and anon key to use the admin."}
          {status === "loading" && "Checking access..."}
          {status === "signedout" &&
            "Sign in with the owner account to open the admin."}
          {status === "forbidden" && "This account does not have admin access."}
        </p>
        {(status === "signedout" || status === "forbidden") && (
          <Link
            href="/account"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-[15px] text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            Go to sign in
          </Link>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-2 px-0 md:flex-row md:gap-8 md:px-6">
      <nav
        aria-label="Admin"
        className="flex shrink-0 gap-1 overflow-x-auto border-b border-line px-5 py-3 md:sticky md:top-24 md:h-fit md:w-48 md:flex-col md:border-b-0 md:px-0 md:py-16"
      >
        <p className="hidden px-4 pb-3 text-xs uppercase tracking-[0.2em] text-muted md:block">
          Admin
        </p>
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-[15px] transition-colors duration-300 ${
                active ? "bg-ink text-white" : "text-muted hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
