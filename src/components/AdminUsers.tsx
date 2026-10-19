"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Accounts and admin access, in two tabs:
 *   - All accounts: everyone who has signed up, newest sign-in first
 *   - Admins: only the people with admin access, plus a box to add more
 *
 * The list and every change go through /api/admin/users, which checks on the
 * server that the caller is an admin before using the secret key.
 *
 * "Last sign-in" is when someone last logged in. The green dot marks people
 * who signed in during the last 24 hours. It does not mean they are on the
 * site this second.
 */

type User = {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  orders: number;
};

type Tab = "all" | "admins";

const field =
  "h-12 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

const DAY = 24 * 60 * 60 * 1000;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function ago(iso: string | null) {
  if (!iso) return "never";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return fmtDate(iso);
}

const wasRecent = (iso: string | null) =>
  !!iso && Date.now() - new Date(iso).getTime() < DAY;

export default function AdminUsers() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [users, setUsers] = useState<User[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
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
      setMe(data.session?.user.id ?? null);
      if (!res || !res.ok) {
        setIsError(true);
        setMessage(json.error ?? "Could not load users.");
      } else {
        setUsers(json.users as User[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, tick]);

  async function setAdmin(u: User, makeAdmin: boolean) {
    const name = u.email ?? "this account";
    const ok = window.confirm(
      makeAdmin
        ? `Make ${name} an admin? They will be able to see and change products, orders, costs, messages and users.`
        : `Remove admin access from ${name}?`,
    );
    if (!ok) return;

    const headers = await authHeader();
    if (!headers) {
      setIsError(true);
      return setMessage("Sign in again.");
    }
    setBusyId(u.id);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id, isAdmin: makeAdmin }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setIsError(true);
        setMessage(json.error ?? "That did not work.");
      } else {
        setIsError(false);
        setMessage(
          makeAdmin
            ? `${name} is now an admin.`
            : `${name} is no longer an admin.`,
        );
        setAddSearch("");
        setTick((t) => t + 1);
      }
    } finally {
      setBusyId(null);
    }
  }

  const admins = useMemo(() => users.filter((u) => u.is_admin), [users]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = tab === "admins" ? admins : users;
    return q
      ? base.filter((u) => (u.email ?? "").toLowerCase().includes(q))
      : base;
  }, [users, admins, tab, search]);

  // Accounts you could promote, found by typing in the Admins tab
  const candidates = useMemo(() => {
    const q = addSearch.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) => !u.is_admin && (u.email ?? "").toLowerCase().includes(q))
      .slice(0, 5);
  }, [users, addSearch]);

  if (!sb) {
    return (
      <section className="px-5 py-16 text-muted md:px-0">
        Supabase is not configured. Set the project URL and anon key to use this
        page.
      </section>
    );
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All accounts", count: users.length },
    { id: "admins", label: "Admins", count: admins.length },
  ];

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
        Users
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Admins can see this dashboard, orders, costs and messages, so only give
        it to people you trust.
      </p>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Account lists"
        className="mt-8 inline-flex rounded-full border border-line bg-white/60 p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => {
              setTab(t.id);
              setSearch("");
            }}
            className={`h-11 rounded-full px-5 text-[15px] transition-colors duration-300 ${
              tab === t.id ? "bg-ink text-white" : "text-ink hover:bg-stone/40"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 text-sm ${
                tab === t.id ? "text-white/70" : "text-muted"
              }`}
            >
              {loading ? "" : t.count}
            </span>
          </button>
        ))}
      </div>

      {message && (
        <p
          role={isError ? "alert" : "status"}
          className={`mt-5 rounded-2xl px-5 py-3 text-[15px] ${
            isError ? "bg-sale/10 text-sale" : "bg-sage/30 text-ink"
          }`}
        >
          {message}
        </p>
      )}

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="mt-6"
      >
        {/* Admins tab: add someone */}
        {tab === "admins" && (
          <div className="mb-8 rounded-3xl border border-line bg-white/50 p-5 sm:p-6">
            <h2 className="text-lg text-ink">Add an admin</h2>
            <p className="mt-1 text-sm text-muted">
              Type the email of someone who already has an account.
            </p>
            <input
              className={`${field} mt-4 sm:max-w-sm`}
              type="search"
              placeholder="Search accounts by email"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              aria-label="Find an account to make admin"
            />
            {addSearch.trim() && (
              <ul className="mt-3 divide-y divide-line rounded-2xl border border-line bg-white/70">
                {candidates.length === 0 && (
                  <li className="p-4 text-sm text-muted">
                    No matching account. They need to sign up on the site first.
                  </li>
                )}
                {candidates.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
                  >
                    <span className="min-w-0 break-all text-[15px] text-ink sm:truncate sm:break-normal">
                      {u.email ?? "(no email)"}
                    </span>
                    <button
                      onClick={() => setAdmin(u, true)}
                      disabled={busyId === u.id}
                      className="h-11 w-full rounded-full bg-ink px-5 text-sm text-white sm:h-10 sm:w-auto transition-colors duration-300 hover:bg-gold hover:text-ink disabled:opacity-50"
                    >
                      {busyId === u.id ? "Saving..." : "Make admin"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <input
          className={`${field} sm:max-w-sm`}
          type="search"
          placeholder={
            tab === "admins" ? "Search admins by email" : "Search all accounts"
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search the list below"
        />

        <p
          className="mt-4 text-sm text-muted"
          role="status"
        >
          {loading
            ? "Loading..."
            : tab === "all"
              ? `${shown.length} of ${users.length} account${users.length === 1 ? "" : "s"}, newest sign-in first. Green dot: signed in during the last 24 hours.`
              : `${shown.length} of ${admins.length} admin${admins.length === 1 ? "" : "s"}.`}
        </p>

        <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white/50">
          {!loading && shown.length === 0 && (
            <li className="p-6 text-muted">
              {tab === "admins" ? "No admins match." : "No accounts match."}
            </li>
          )}
          {shown.map((u) => {
            const isMe = u.id === me;
            return (
              <li
                key={u.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink">
                    {wasRecent(u.last_sign_in_at) && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-sage"
                        title="Signed in during the last 24 hours"
                        aria-label="Signed in during the last 24 hours"
                      />
                    )}
                    <span className="min-w-0 break-all sm:truncate sm:break-normal">
                      {u.email ?? "(no email)"}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-white">
                        Admin
                      </span>
                    )}
                    {isMe && (
                      <span className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted">
                        You
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex flex-col gap-0.5 text-sm text-muted sm:mt-0 sm:block">
                    <span>Joined {fmtDate(u.created_at)}</span>
                    <span className="hidden sm:inline"> · </span>
                    <span>Last sign-in {ago(u.last_sign_in_at)}</span>
                    <span className="hidden sm:inline"> · </span>
                    <span>
                      {u.orders} paid order{u.orders === 1 ? "" : "s"}
                    </span>
                  </p>
                </div>
                {isMe && u.is_admin ? (
                  <span className="text-sm text-muted sm:text-right">
                    Another admin must remove you
                  </span>
                ) : (
                  <button
                    onClick={() => setAdmin(u, !u.is_admin)}
                    disabled={busyId === u.id}
                    className={`h-11 w-full rounded-full border px-4 text-sm transition-colors duration-300 disabled:opacity-50 sm:h-10 sm:w-auto ${
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
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
