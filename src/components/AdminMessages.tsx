"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";

/*
 * Contact messages and newsletter subscribers. Shown inside AdminShell, which
 * already checked the visitor is an admin; Row Level Security is the real
 * protection (only an admin can read or change these tables).
 */

type Message = {
  id: string;
  name: string | null;
  email: string | null;
  topic: string | null;
  order_number: string | null;
  message: string | null;
  created_at: string;
  handled: boolean;
};

type Subscriber = {
  id: string;
  email: string;
  created_at: string;
  source: string | null;
};

type Tab = "messages" | "subscribers";
type Filter = "open" | "handled" | "all";

const field =
  "h-12 w-full rounded-2xl border border-line bg-white/70 px-4 text-[15px] text-ink placeholder:text-muted/60 transition-colors duration-300 hover:border-ink/40 focus:border-ink focus:outline-none";

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminMessages() {
  const [sb] = useState(() =>
    typeof window === "undefined" || !supabaseConfigured ? null : getSupabase(),
  );
  const [tab, setTab] = useState<Tab>("messages");
  const [filter, setFilter] = useState<Filter>("open");
  const [messages, setMessages] = useState<Message[]>([]);
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!sb) return;
    let cancelled = false;
    (async () => {
      const [m, s] = await Promise.all([
        sb
          .from("contact_messages")
          .select(
            "id, name, email, topic, order_number, message, created_at, handled",
          )
          .order("created_at", { ascending: false })
          .limit(500),
        sb
          .from("subscribers")
          .select("id, email, created_at, source")
          .order("created_at", { ascending: false })
          .limit(5000),
      ]);
      if (cancelled) return;
      const problem = m.error?.message ?? s.error?.message ?? "";
      setNote(
        problem
          ? `Could not load everything: ${problem}. Run the messages SQL script in Supabase if you haven't.`
          : "",
      );
      setMessages((m.data ?? []) as Message[]);
      setSubs((s.data ?? []) as Subscriber[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sb, tick]);

  async function setHandled(msg: Message, handled: boolean) {
    if (!sb) return;
    const { error } = await sb
      .from("contact_messages")
      .update({ handled })
      .eq("id", msg.id);
    if (error) return setNote(error.message);
    setTick((t) => t + 1);
  }

  async function removeMessage(msg: Message) {
    if (
      !sb ||
      !window.confirm(
        `Delete the message from ${msg.name ?? "this person"}? This cannot be undone.`,
      )
    )
      return;
    const { error } = await sb
      .from("contact_messages")
      .delete()
      .eq("id", msg.id);
    if (error) return setNote(error.message);
    setTick((t) => t + 1);
  }

  async function removeSub(sub: Subscriber) {
    if (!sb || !window.confirm(`Remove ${sub.email} from the list?`)) return;
    const { error } = await sb.from("subscribers").delete().eq("id", sub.id);
    if (error) return setNote(error.message);
    setTick((t) => t + 1);
  }

  const openCount = messages.filter((m) => !m.handled).length;

  const shownMessages = useMemo(
    () =>
      messages.filter((m) =>
        filter === "all" ? true : filter === "open" ? !m.handled : m.handled,
      ),
    [messages, filter],
  );

  const shownSubs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? subs.filter((s) => s.email.toLowerCase().includes(q)) : subs;
  }, [subs, search]);

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(
        shownSubs.map((s) => s.email).join(", "),
      );
      setNote(
        `Copied ${shownSubs.length} email address${shownSubs.length === 1 ? "" : "es"}.`,
      );
    } catch {
      setNote("Copying isn't allowed here. Use Download CSV instead.");
    }
  }

  function downloadCsv() {
    const rows = [
      "email,signed_up,source",
      ...shownSubs.map((s) =>
        [s.email, s.created_at, s.source ?? ""]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(","),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.join("\r\n")], { type: "text/csv" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "offline-house-subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!sb) {
    return (
      <section className="px-5 py-16 text-muted md:px-0">
        Supabase is not configured. Set the project URL and anon key to use this
        page.
      </section>
    );
  }

  const pill = (on: boolean) =>
    `h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-sm transition-colors duration-300 ${
      on ? "bg-ink text-white" : "text-muted hover:text-ink"
    }`;

  return (
    <section className="px-5 py-10 sm:py-16 md:px-0">
      <h1 className="font-serif text-4xl font-light text-ink sm:text-5xl">
        Messages
      </h1>

      <div
        role="group"
        aria-label="Section"
        className="mt-8 flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line p-1"
      >
        <button
          className={pill(tab === "messages")}
          aria-pressed={tab === "messages"}
          onClick={() => setTab("messages")}
        >
          Contact messages{openCount > 0 ? ` (${openCount})` : ""}
        </button>
        <button
          className={pill(tab === "subscribers")}
          aria-pressed={tab === "subscribers"}
          onClick={() => setTab("subscribers")}
        >
          Subscribers ({subs.length})
        </button>
      </div>

      {note && (
        <p
          role="status"
          className="mt-4 text-[15px] text-ink"
        >
          {note}
        </p>
      )}
      {loading && <p className="mt-6 text-muted">Loading...</p>}

      {tab === "messages" && !loading && (
        <div className="mt-6">
          <div
            role="group"
            aria-label="Filter"
            className="flex w-fit gap-1 rounded-full border border-line p-1"
          >
            {(["open", "handled", "all"] as const).map((f) => (
              <button
                key={f}
                className={`${pill(filter === f)} capitalize`}
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <ul className="mt-4 space-y-4">
            {shownMessages.length === 0 && (
              <li className="rounded-3xl border border-line bg-white/50 p-6 text-muted">
                {filter === "open"
                  ? "No open messages. Nice."
                  : "Nothing here."}
              </li>
            )}
            {shownMessages.map((m) => (
              <li
                key={m.id}
                className="rounded-3xl border border-line bg-white/50 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink">
                      {m.name ?? "(no name)"}
                    </p>
                    <p className="break-all text-sm text-muted">{m.email}</p>
                  </div>
                  <p className="text-sm text-muted">{fmt(m.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {m.topic}
                  {m.order_number ? ` · Order ${m.order_number}` : ""}
                  {m.handled ? " · handled" : ""}
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words text-[15px] text-ink">
                  {m.message}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.email && (
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic ?? "Your message to Offline House"}`)}`}
                      className="inline-flex h-10 items-center rounded-full bg-ink px-5 text-sm text-white transition-colors duration-300 hover:bg-gold hover:text-ink"
                    >
                      Reply
                    </a>
                  )}
                  <button
                    onClick={() => setHandled(m, !m.handled)}
                    className="h-10 rounded-full border border-line px-4 text-sm text-ink transition-colors duration-300 hover:border-ink"
                  >
                    {m.handled ? "Reopen" : "Mark handled"}
                  </button>
                  <button
                    onClick={() => removeMessage(m)}
                    className="h-10 rounded-full border border-line px-4 text-sm text-sale transition-colors duration-300 hover:border-sale"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "subscribers" && !loading && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <input
              className={`${field} sm:max-w-sm`}
              type="search"
              placeholder="Search by email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={copyEmails}
              className="h-12 rounded-full border border-line px-6 text-[15px] text-ink transition-colors duration-300 hover:border-ink"
            >
              Copy emails
            </button>
            <button
              onClick={downloadCsv}
              className="h-12 rounded-full border border-line px-6 text-[15px] text-ink transition-colors duration-300 hover:border-ink"
            >
              Download CSV
            </button>
          </div>
          <p className="mt-4 text-sm text-muted">
            {shownSubs.length} subscriber{shownSubs.length === 1 ? "" : "s"}
            {search ? " match" : ""}.
          </p>
          <ul className="mt-3 divide-y divide-line rounded-3xl border border-line bg-white/50">
            {shownSubs.length === 0 && (
              <li className="p-6 text-muted">No subscribers yet.</li>
            )}
            {shownSubs.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-ink">{s.email}</p>
                  <p className="text-sm text-muted">
                    {fmt(s.created_at)}
                    {s.source ? ` · ${s.source}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => removeSub(s)}
                  className="h-10 rounded-full border border-line px-4 text-sm text-sale transition-colors duration-300 hover:border-sale"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
