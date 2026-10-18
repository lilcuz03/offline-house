"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Accounts list with a button to grant or remove admin access. The list and
 * the change both go through /api/admin/users, which checks on the server that
 * the caller is an admin before using the secret key.
 *
 * "Last sign-in" is when someone last logged in, not whether they are on the
 * site right now.
 */

type User = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  orders: number;
};

const field =
  "h-12 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function ago(iso: string | null) {
  if (!iso) return "Never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

export default function AdminUsers() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [onlyAdmins, setOnlyAdmins] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // The browser's sign-in token proves to the server who is asking
  async function authHeader(): Promise<HeadersInit | null> {
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : null;
  }

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const { data } = await sb.auth.getSession();
      const token = data.session?.access_token;
      const res = token
        ? await fetch("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
          })
        : null;
      const json = res ? await res.json().catch(() => ({})) : {};
      if (cancelled) return;
      if (!res || !res.ok) {
        setMessage(json.error ?? "Could not load users.");
      } else {
        setMessage("");
        setUsers(json.users as User[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, tick]);

  async function setAdmin(u: User, isAdmin: boolean) {
    const verb = isAdmin ? "make an admin" : "remove admin access from";
    if (
      !window.confirm(
        `${verb[0].toUpperCase()}${verb.slice(1)} ${u.email ?? "this account"}?`,
      )
    )
      return;
    const headers = await authHeader();
    if (!headers) return setMessage("Sign in again.");
    setBusyId(u.id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, isAdmin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setMessage(json.error ?? "That did not work.");
      else {
        setMessage(
          isAdmin
            ? `${u.email} is now an admin.`
            : `${u.email} is no longer an admin.`,
        );
        setTick((t) => t + 1);
      }
    } finally {
      setBusyId(null);
    }
  }

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(
      (u) =>
        (!q || (u.email ?? "").toLowerCase().includes(q)) &&
        (!onlyAdmins || u.is_admin),
    );
  }, [users, search, onlyAdmins]);

  if (!sb) {
    return (
      <section className="px-5 py-16 text-muted md:px-0">
        Supabase is not configured. Set the project URL and anon key to use this
        page.
      </section>
    );
  }

  const admins = users.filter((u) => u.is_admin).length;

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
        Users
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Everyone with an account. Admins can see this dashboard, orders and
        costs, so only give it to people you trust.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <input
          className={`${field} sm:max-w-sm`}
          type="search"
          placeholder="Search by email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-3 text-[15px] text-ink">
          <input
            type="checkbox"
            checked={onlyAdmins}
            onChange={(e) => setOnlyAdmins(e.target.checked)}
            className="size-5"
          />
          Admins only
        </label>
      </div>

      <p
        className="mt-4 text-sm text-muted"
        role="status"
      >
        {loading
          ? "Loading..."
          : `${users.length} account${users.length === 1 ? "" : "s"}, ${admins} admin${admins === 1 ? "" : "s"}${
              shown.length !== users.length ? `. Showing ${shown.length}.` : "."
            }`}
      </p>
      {message && (
        <p
          role="alert"
          className="mt-2 text-[15px] text-ink"
        >
          {message}
        </p>
      )}

      <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white/50">
        {!loading && shown.length === 0 && (
          <li className="p-6 text-muted">No accounts match.</li>
        )}
        {shown.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 sm:px-6"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-ink">
                {u.email ?? "(no email)"}
                {u.is_admin && (
                  <span className="ml-2 rounded-full bg-ink px-2.5 py-0.5 align-middle text-xs text-white">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-sm text-muted">
                Joined {fmtDate(u.created_at)} · Last sign-in{" "}
                {ago(u.last_sign_in_at)} · {u.orders} paid order
                {u.orders === 1 ? "" : "s"}
              </p>
            </div>
            <button
              onClick={() => setAdmin(u, !u.is_admin)}
              disabled={busyId === u.id}
              className={`h-10 rounded-full border px-4 text-sm transition-colors duration-300 disabled:opacity-50 ${
                u.is_admin
                  ? "border-line text-sale hover:border-sale"
                  : "border-line text-ink hover:border-ink"
              }`}
            >
              {busyId === u.id
                ? "Saving..."
                : u.is_admin
                  ? "Remove admin"
                  : "Make admin"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
