"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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

function readStorage(): WishlistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isItem) : [];
  } catch {
    return [];
  }
}

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
  const [items, setItems] = useState<WishlistItem[]>(() =>
    typeof window === "undefined" ? [] : readStorage(),
  );
  const hydrated = typeof window !== "undefined";

  // Save after every change, but only once the browser is available so an
  // empty initial state can't overwrite a saved list.
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* private mode or full storage: the list still works for this visit */
    }
  }, [items, hydrated]);

  // Keep several open tabs in step
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items],
  );

  const toggle = useCallback((item: WishlistItem) => {
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
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

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
