"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

/* ---------- types ---------- */

/** A snapshot saved with each wishlisted product, so the wishlist page
 *  can render without fetching anything. */
export type WishlistItem = {
  id: string;
  slug: string;
  name: string;
  /** Rands (not cents). */
  price: number;
  compareAtPrice?: number | null;
  image?: string | null;
  category?: string | null;
};

type WishlistContextValue = {
  items: WishlistItem[];
  count: number;
  /** False until the saved list has been read from the browser. */
  hydrated: boolean;
  has: (id: string) => boolean;
  /** Adds the product if it isn't saved, removes it if it is. Extra fields are ignored. */
  toggle: (item: WishlistItem) => void;
  remove: (id: string) => void;
  clear: () => void;
};

/* ---------- storage ---------- */

const STORAGE_KEY = "offline-house-wishlist-v1";

function isItem(x: unknown): x is WishlistItem {
  if (!x || typeof x !== "object") return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.id === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.price === "number"
  );
}

function parseItems(raw: string | null): WishlistItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

/* The saved list is external state, so it is read through
   useSyncExternalStore rather than copied into React state from an effect.
   The snapshot is the raw JSON string (a primitive), which keeps it stable
   between reads. On the server, and during hydration, the snapshot is null,
   so markup always matches and the saved list appears right after hydration. */

const listeners = new Set<() => void>();

// Holds the latest value for this visit when localStorage is blocked
// (private mode, full storage), so the list still works until the tab closes.
let memory: string | null | undefined;

function readRaw(): string | null {
  if (memory !== undefined) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRaw(next: string) {
  memory = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* kept in memory for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  // Another tab changed the list: drop our cached copy and re-read storage
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      memory = undefined;
      notify();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

const getServerRaw = () => null;

// "Hydrated" is false on the server and during hydration, true afterwards.
const subscribeNever = () => () => {};
const clientTrue = () => true;
const serverFalse = () => false;

/* ---------- context ---------- */

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx)
    throw new Error("useWishlist must be used inside <WishlistProvider>.");
  return ctx;
}

export default function WishlistProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerRaw);
  const items = useMemo(() => parseItems(raw), [raw]);
  const hydrated = useSyncExternalStore(
    subscribeNever,
    clientTrue,
    serverFalse,
  );

  // Every change reads the current saved list, applies the update and saves
  // it, in the event that causes the change. No effect is needed.
  const setItems = useCallback(
    (update: (prev: WishlistItem[]) => WishlistItem[]) => {
      writeRaw(JSON.stringify(update(parseItems(readRaw()))));
    },
    [],
  );

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      setItems((prev) =>
        prev.some((i) => i.id === item.id)
          ? prev.filter((i) => i.id !== item.id)
          : [
              {
                id: item.id,
                slug: item.slug,
                name: item.name,
                price: item.price,
                compareAtPrice: item.compareAtPrice ?? null,
                image: item.image ?? null,
                category: item.category ?? null,
              },
              ...prev, // newest first
            ],
      );
    },
    [setItems],
  );

  const remove = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems],
  );

  const clear = useCallback(() => setItems(() => []), [setItems]);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      hydrated,
      has,
      toggle,
      remove,
      clear,
    }),
    [items, hydrated, has, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
