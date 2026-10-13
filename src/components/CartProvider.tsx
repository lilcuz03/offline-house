"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import CartDrawer, { type CartItem } from "./CartDrawer";

/* ---------- types ---------- */

/** What you pass to addItem. Extra fields on a Product are ignored. */
export type AddToCartInput = {
  id: string;
  slug: string;
  name: string;
  /** Unit price in rands (not cents). */
  price: number;
  image?: string | null;
  variant?: string | null;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  /** Total number of units in the bag. */
  count: number;
  /** In rands. Display only; always recalculate prices on the server at checkout. */
  subtotal: number;
  isOpen: boolean;
  /** False until the saved bag has been read from the browser. */
  hydrated: boolean;
  addItem: (item: AddToCartInput, options?: { openDrawer?: boolean }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

type CartProviderProps = {
  children: React.ReactNode;
  checkoutHref?: string;
  /** Rand amount that unlocks free delivery. Leave out to hide the bar. */
  freeShippingThreshold?: number;
};

/* ---------- storage ---------- */

const STORAGE_KEY = "offline-house-cart-v1";
const MAX_QTY = 99;

const clampQty = (n: number) => Math.min(MAX_QTY, Math.max(1, Math.floor(n)));

function isCartItem(x: unknown): x is CartItem {
  if (!x || typeof x !== "object") return false;
  const i = x as Record<string, unknown>;
  return (
    typeof i.id === "string" &&
    typeof i.slug === "string" &&
    typeof i.name === "string" &&
    typeof i.price === "number" &&
    typeof i.quantity === "number"
  );
}

function parseItems(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isCartItem)
      .map((i) => ({ ...i, quantity: clampQty(i.quantity) }));
  } catch {
    return [];
  }
}

/* The saved bag is external state, so it is read through
   useSyncExternalStore rather than copied into React state from an effect.
   The snapshot is the raw JSON string (a primitive), which keeps it stable
   between reads. On the server, and during hydration, the snapshot is null,
   so markup always matches and the saved bag appears right after hydration. */

const listeners = new Set<() => void>();

// Holds the latest value for this visit when localStorage is blocked
// (private mode, full storage), so the bag still works until the tab closes.
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
  // Another tab changed the bag: drop our cached copy and re-read storage
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

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>.");
  return ctx;
}

export default function CartProvider({
  children,
  checkoutHref = "/checkout",
  freeShippingThreshold,
}: CartProviderProps) {
  const raw = useSyncExternalStore(subscribe, readRaw, getServerRaw);
  const items = useMemo(() => parseItems(raw), [raw]);
  const hydrated = useSyncExternalStore(
    subscribeNever,
    clientTrue,
    serverFalse,
  );
  const [isOpen, setIsOpen] = useState(false);

  // Every change reads the current saved bag, applies the update and saves
  // it. Doing it in the event that causes the change keeps rapid updates
  // consistent and needs no effect.
  const setItems = useCallback((update: (prev: CartItem[]) => CartItem[]) => {
    writeRaw(JSON.stringify(update(parseItems(readRaw()))));
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback<CartContextValue["addItem"]>(
    (input, options) => {
      const qty = clampQty(input.quantity ?? 1);
      setItems((prev) => {
        const existing = prev.find((i) => i.id === input.id);
        if (existing) {
          return prev.map((i) =>
            i.id === input.id
              ? {
                  ...i,
                  price: input.price, // take the latest price
                  quantity: clampQty(i.quantity + qty),
                }
              : i,
          );
        }
        return [
          ...prev,
          {
            id: input.id,
            slug: input.slug,
            name: input.name,
            price: input.price,
            image: input.image ?? null,
            variant: input.variant ?? null,
            quantity: qty,
          },
        ];
      });
      if (options?.openDrawer !== false) setIsOpen(true);
    },
    [setItems],
  );

  const updateQuantity = useCallback(
    (id: string, quantity: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.id === id ? { ...i, quantity: clampQty(quantity) } : i,
        ),
      );
    },
    [setItems],
  );

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [setItems],
  );

  const clearCart = useCallback(() => setItems(() => []), [setItems]);

  const count = useMemo(
    () => items.reduce((n, i) => n + i.quantity, 0),
    [items],
  );
  const subtotal = useMemo(
    () => items.reduce((n, i) => n + i.price * i.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      isOpen,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    }),
    [
      items,
      count,
      subtotal,
      isOpen,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer
        open={isOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemove={removeItem}
        checkoutHref={checkoutHref}
        freeShippingThreshold={freeShippingThreshold}
      />
    </CartContext.Provider>
  );
}
