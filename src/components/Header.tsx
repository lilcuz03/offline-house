"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ACCENTS,
  ANNOUNCEMENTS,
  CATEGORIES,
  POPULAR_SEARCHES,
} from "../lib/categories";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishListProvider";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const accentVar = (color: string) =>
  ({ "--accent": color }) as React.CSSProperties;

function Icon({
  children,
  size = 20,
}: {
  children: React.ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const SearchIcon = ({ size }: { size?: number }) => (
  <Icon size={size}>
    <circle
      cx="11"
      cy="11"
      r="6.5"
    />
    <path d="m20 20-4.2-4.2" />
  </Icon>
);
const UserIcon = () => (
  <Icon>
    <circle
      cx="12"
      cy="8.5"
      r="3.5"
    />
    <path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" />
  </Icon>
);
const HeartIcon = () => (
  <Icon>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" />
  </Icon>
);
const BagIcon = () => (
  <Icon>
    <path d="M5 8h14l-1.2 11H6.2L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </Icon>
);
const MenuIcon = () => (
  <Icon size={22}>
    <path d="M4 8h16M4 16h10" />
  </Icon>
);
const CloseIcon = () => (
  <Icon size={22}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <span
    className={`block transition-transform duration-300 ${open ? "rotate-180" : ""}`}
  >
    <Icon size={18}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  </span>
);

const iconButton =
  "relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-stone/40";

const badge =
  "animate-pop absolute right-0 top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-medium text-white";

export default function Header() {
  const router = useRouter();

  // Counts and the drawer trigger come straight from the providers.
  // Counts stay at 0 until the saved lists have loaded, so the server
  // and client render the same thing on first paint.
  const { count, openCart, hydrated: cartReady } = useCart();
  const { count: savedTotal, hydrated: savedReady } = useWishlist();
  const cartCount = cartReady ? count : 0;
  const savedCount = savedReady ? savedTotal : 0;

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mega, setMega] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [announce, setAnnounce] = useState(0);
  const [query, setQuery] = useState("");

  const searchInput = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastY = useRef(0);

  const isHidden = hidden && !searchOpen && !menuOpen && mega === null;

  // Hide on scroll down, return on scroll up
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        setScrolled(y > 12);
        if (y < 120) setHidden(false);
        else if (y > lastY.current + 6) setHidden(true);
        else if (y < lastY.current - 6) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Rotating announcement
  useEffect(() => {
    const id = setInterval(
      () => setAnnounce((i) => (i + 1) % ANNOUNCEMENTS.length),
      4500,
    );
    return () => clearInterval(id);
  }, []);

  // Keyboard: Esc closes everything, Ctrl/Cmd+K toggles search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMega(null);
        setSearchOpen(false);
        setMenuOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMenuOpen(false);
        setMega(null);
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Lock page scroll behind the drawer and search
  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen, searchOpen]);

  // Focus the search field when it opens
  useEffect(() => {
    if (!searchOpen) return;
    const t = setTimeout(() => searchInput.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [searchOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const openMega = (slug: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSearchOpen(false);
    setMega(slug);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMega(null), 140);
  };
  const openSearch = () => {
    setHidden(false);
    setMega(null);
    setMenuOpen(false);
    setSearchOpen(true);
  };
  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const term = query.trim();
    if (!term) return;
    setSearchOpen(false);
    setMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const navItems = [
    {
      slug: "top-sellers",
      label: "Top sellers",
      href: "/collections/top-sellers",
      accent: ACCENTS.gold,
      mega: false,
    },
    ...CATEGORIES.map((c) => ({
      slug: c.slug,
      label: c.label,
      href: `/collections/${c.slug}`,
      accent: c.accent,
      mega: true,
    })),
    {
      slug: "deals",
      label: "Deals",
      href: "/collections/deals",
      accent: ACCENTS.sale,
      mega: false,
    },
  ];

  const panelBase = `absolute inset-x-0 top-full border-b border-line bg-ivory transition-[opacity,transform,visibility] duration-300 ${EASE}`;
  const panelState = (open: boolean) =>
    open
      ? "visible translate-y-0 opacity-100"
      : "invisible -translate-y-2 opacity-0";

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <header
        onMouseLeave={scheduleClose}
        onFocusCapture={() => setHidden(false)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null))
            setMega(null);
        }}
        className={`sticky top-0 z-40 w-full transition-transform duration-500 ${EASE} ${
          isHidden ? "-translate-y-full" : "translate-y-0"
        }`}
      >
        {/* Announcement */}
        <div className="bg-ink text-white">
          <div className="mx-auto grid h-9 max-w-7xl grid-cols-1 items-center px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
            <span
              className="hidden md:block"
              aria-hidden="true"
            />
            <p
              key={announce}
              aria-live="off"
              className="animate-announce text-center text-[12px] tracking-[0.08em] text-white sm:text-[13px]"
            >
              {ANNOUNCEMENTS[announce]}
            </p>
            <div className="hidden items-center justify-end gap-5 md:flex">
              <Link
                href="/track-order"
                className="text-xs text-white/70 transition-colors hover:text-gold"
              >
                Track order
              </Link>
              <Link
                href="/help"
                className="text-xs text-white/70 transition-colors hover:text-gold"
              >
                Help
              </Link>
            </div>
          </div>
        </div>

        <div
          className={`relative transition-colors duration-500 ${
            scrolled ? "bg-ivory/90 backdrop-blur-xl" : "bg-ivory"
          }`}
        >
          {/* Main bar */}
          <div
            className={`mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-2 transition-[height] duration-500 sm:px-6 ${EASE} ${
              scrolled ? "h-14 lg:h-16" : "h-16 lg:h-[76px]"
            }`}
          >
            <div className="flex items-center">
              <button
                type="button"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
                className={`${iconButton} lg:hidden`}
              >
                <MenuIcon />
              </button>
              <button
                type="button"
                onClick={openSearch}
                className="hidden h-10 w-60 items-center gap-3 rounded-full border border-line px-4 text-left text-sm text-muted transition-colors duration-300 hover:border-ink lg:flex xl:w-72"
              >
                <SearchIcon size={17} />
                <span className="flex-1 truncate">
                  Search chargers, cables, cases
                </span>
                <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
                  Ctrl K
                </kbd>
              </button>
            </div>

            <Link
              href="/"
              aria-label="Offline House, home"
              className="group flex flex-col items-center"
            >
              <span className="relative block">
                <Image
                  src="/brand/logo-full.png"
                  alt=""
                  width={615}
                  height={350}
                  priority
                  className={`h-8 w-auto transition-opacity duration-500 group-hover:opacity-0 ${
                    scrolled ? "lg:h-8" : "lg:h-10"
                  }`}
                />
                <Image
                  src="/brand/logo-full.png"
                  alt=""
                  width={615}
                  height={350}
                  aria-hidden="true"
                  className={`absolute inset-0 h-8 w-auto opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                    scrolled ? "lg:h-8" : "lg:h-10"
                  }`}
                />
              </span>
              <span
                className={`block overflow-hidden text-[9px] font-light uppercase tracking-[0.5em] text-ink transition-[max-height,opacity,margin] duration-500 ${
                  scrolled ? "max-h-0 opacity-0" : "mt-1 max-h-4 opacity-100"
                }`}
              >
                Offline House
              </span>
            </Link>

            <div className="flex items-center justify-end gap-0.5 sm:gap-1">
              <button
                type="button"
                aria-label="Search"
                onClick={openSearch}
                className={`${iconButton} lg:hidden`}
              >
                <SearchIcon />
              </button>
              <Link
                href="/account"
                aria-label="Account"
                className={`${iconButton} hidden sm:grid`}
              >
                <UserIcon />
              </Link>
              <Link
                href="/wishlist"
                aria-label={`Wishlist, ${savedCount} ${savedCount === 1 ? "item" : "items"} saved`}
                className={`${iconButton} hidden md:grid`}
              >
                <HeartIcon />
                {savedCount > 0 && (
                  <span
                    key={savedCount}
                    className={badge}
                  >
                    {savedCount}
                  </span>
                )}
              </Link>
              <Link
                href="/cart"
                aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                onClick={(e) => {
                  e.preventDefault();
                  openCart();
                }}
                className={iconButton}
              >
                <BagIcon />
                {cartCount > 0 && (
                  <span
                    key={cartCount}
                    className={badge}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Category row (desktop) */}
          <nav
            aria-label="Shop by category"
            className="hidden border-y border-line lg:block"
          >
            <ul className="mx-auto flex h-11 max-w-7xl items-center justify-center gap-1 px-6">
              {navItems.map((item) => (
                <li
                  key={item.slug}
                  style={accentVar(item.accent)}
                  onMouseEnter={() =>
                    item.mega ? openMega(item.slug) : setMega(null)
                  }
                >
                  <Link
                    href={item.href}
                    onFocus={() =>
                      item.mega ? openMega(item.slug) : setMega(null)
                    }
                    className={`relative inline-flex h-11 items-center px-4 text-[12px] font-medium uppercase tracking-[0.22em] transition-colors duration-300 ${
                      item.slug === "deals" ? "text-sale" : "text-ink"
                    }`}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-4 bottom-0 h-[2px] origin-left bg-(--accent) transition-transform duration-500 ${EASE} ${
                        mega === item.slug ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mega panels. Always in the DOM so crawlers see every collection link. */}
          {CATEGORIES.map((c) => {
            const open = mega === c.slug;
            return (
              <div
                key={c.slug}
                id={`mega-${c.slug}`}
                inert={!open}
                aria-hidden={!open}
                style={accentVar(c.accent)}
                className={`${panelBase} hidden lg:block ${panelState(open)}`}
              >
                <div className="mx-auto grid max-w-7xl grid-cols-12 gap-10 px-6 py-10">
                  <div className="col-span-3">
                    <p className="font-serif text-4xl text-ink">{c.label}</p>
                    <p className="mt-3 max-w-[26ch] text-sm leading-relaxed text-muted">
                      {c.tagline}
                    </p>
                    <Link
                      href={`/collections/${c.slug}`}
                      className="mt-6 inline-block border-b-2 border-(--accent) pb-1 text-sm font-medium text-ink"
                    >
                      Shop all {c.label.toLowerCase()}
                    </Link>
                  </div>

                  <ul className="col-span-5 grid grid-cols-2 content-start gap-x-8">
                    {c.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/collections/${child.slug}`}
                          className="group block border-b border-line py-3"
                        >
                          <span
                            className={`block text-[15px] text-ink transition-transform duration-300 ${EASE} group-hover:translate-x-1`}
                          >
                            {child.label}
                          </span>
                          <span className="block text-xs text-muted">
                            {child.hint}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/collections/${c.slug}?sort=best-selling`}
                    className="group relative col-span-4 flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl bg-ink p-6 text-white"
                  >
                    <Image
                      src="/brand/logo-full.png"
                      alt=""
                      width={615}
                      height={350}
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-8 -top-2 w-56 opacity-25 transition-transform duration-700 group-hover:scale-105"
                    />
                    <span className="relative font-serif text-3xl leading-tight text-white">
                      Best sellers in {c.label.toLowerCase()}
                    </span>
                    <span className="relative mt-2 text-sm text-white/70">
                      The {c.label.toLowerCase()} picks people buy most.
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative mt-5 block h-[3px] w-10 bg-(--accent) transition-[width] duration-500 ${EASE} group-hover:w-24`}
                    />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Search panel */}
          <div
            inert={!searchOpen}
            aria-hidden={!searchOpen}
            className={`${panelBase} ${panelState(searchOpen)}`}
          >
            <form
              role="search"
              onSubmit={submitSearch}
              className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12"
            >
              <label
                htmlFor="site-search"
                className="sr-only"
              >
                Search products
              </label>
              <div className="flex items-center gap-4 border-b-2 border-ink pb-3">
                <SearchIcon size={24} />
                <input
                  id="site-search"
                  ref={searchInput}
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chargers, cables, cases"
                  autoComplete="off"
                  className="w-full bg-transparent font-serif text-2xl text-ink placeholder:text-muted/70 focus:outline-none sm:text-4xl"
                />
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                  className={`${iconButton} shrink-0`}
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="mt-6 text-sm text-muted">Popular right now</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <li key={term}>
                    <Link
                      href={`/search?q=${encodeURIComponent(term)}`}
                      onClick={() => setSearchOpen(false)}
                      className="inline-block rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-white"
                    >
                      {term}
                    </Link>
                  </li>
                ))}
              </ul>
            </form>
          </div>

          {/* Dim the page behind open panels */}
          <div
            aria-hidden="true"
            onClick={() => {
              setSearchOpen(false);
              setMega(null);
            }}
            className={`absolute inset-x-0 top-full -z-10 h-screen bg-ink/25 transition-opacity duration-300 ${
              mega || searchOpen
                ? "opacity-100"
                : "pointer-events-none opacity-0"
            }`}
          />
        </div>
      </header>

      {/* Mobile drawer. Outside the header so its fixed position isn't affected by the header's transform. */}
      <div
        className={`fixed inset-0 z-50 transition-[visibility] lg:hidden ${
          menuOpen ? "visible delay-0" : "invisible delay-500"
        }`}
        inert={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
          className={`absolute inset-0 bg-ink/40 transition-opacity duration-500 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          id="mobile-menu"
          aria-label="Menu"
          className={`absolute left-0 top-0 flex h-dvh w-[88%] max-w-sm flex-col bg-ivory transition-transform duration-500 ${EASE} ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line pl-5 pr-2">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="Offline House, home"
              className="flex items-center gap-3"
            >
              <Image
                src="/brand/logo-full.png"
                alt=""
                width={615}
                height={350}
                className="h-7 w-auto"
              />
              <span className="text-[10px] font-light uppercase tracking-[0.4em] text-ink">
                Offline House
              </span>
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className={iconButton}
            >
              <CloseIcon />
            </button>
          </div>

          <div className="shrink-0 px-5 pt-5">
            <button
              type="button"
              onClick={openSearch}
              className="flex h-12 w-full items-center gap-3 rounded-full border border-line px-4 text-left text-sm text-muted"
            >
              <SearchIcon size={18} />
              Search chargers, cables, cases
            </button>
          </div>

          <nav
            aria-label="Mobile"
            className="flex-1 overflow-y-auto px-5 py-3"
          >
            <ul>
              {[
                {
                  slug: "top-sellers",
                  label: "Top sellers",
                  href: "/collections/top-sellers",
                  accent: ACCENTS.gold,
                },
              ].map((item, i) => (
                <li
                  key={item.slug}
                  style={{
                    ...accentVar(item.accent),
                    animationDelay: `${120 + i * 55}ms`,
                  }}
                  className={menuOpen ? "animate-drawer-item" : "opacity-0"}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 border-b border-line py-4 font-serif text-[28px] leading-none text-ink"
                  >
                    <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-(--accent)" />
                    {item.label}
                  </Link>
                </li>
              ))}

              {CATEGORIES.map((c, i) => {
                const open = expanded === c.slug;
                return (
                  <li
                    key={c.slug}
                    style={{
                      ...accentVar(c.accent),
                      animationDelay: `${175 + i * 55}ms`,
                    }}
                    className={menuOpen ? "animate-drawer-item" : "opacity-0"}
                  >
                    <div className="flex items-center border-b border-line">
                      <Link
                        href={`/collections/${c.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex flex-1 items-center gap-3 py-4 font-serif text-[28px] leading-none text-ink"
                      >
                        <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-(--accent)" />
                        {c.label}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={`drawer-${c.slug}`}
                        aria-label={`${open ? "Hide" : "Show"} ${c.label} categories`}
                        onClick={() => setExpanded(open ? null : c.slug)}
                        className="grid h-12 w-12 place-items-center text-ink"
                      >
                        <ChevronIcon open={open} />
                      </button>
                    </div>
                    <div
                      id={`drawer-${c.slug}`}
                      inert={!open}
                      className={`grid transition-[grid-template-rows] duration-500 ${EASE} ${
                        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <ul className="overflow-hidden">
                        {c.children.map((child) => (
                          <li key={child.slug}>
                            <Link
                              href={`/collections/${child.slug}`}
                              onClick={() => setMenuOpen(false)}
                              className="block py-3 pl-[18px] text-[15px] text-ink"
                            >
                              {child.label}
                              <span className="ml-2 text-xs text-muted">
                                {child.hint}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </li>
                );
              })}

              <li
                style={{
                  ...accentVar(ACCENTS.sale),
                  animationDelay: `${175 + CATEGORIES.length * 55}ms`,
                }}
                className={menuOpen ? "animate-drawer-item" : "opacity-0"}
              >
                <Link
                  href="/collections/deals"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 border-b border-line py-4 font-serif text-[28px] leading-none text-sale"
                >
                  <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-(--accent)" />
                  Deals
                </Link>
              </li>
            </ul>
          </nav>

          <div className="shrink-0 border-t border-line px-5 py-5">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMenuOpen(false)}
              >
                Wishlist{savedCount > 0 ? ` (${savedCount})` : ""}
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMenuOpen(false)}
              >
                Track order
              </Link>
              <Link
                href="/help"
                onClick={() => setMenuOpen(false)}
              >
                Help
              </Link>
            </div>
            <p className="mt-4 font-serif text-lg italic text-muted">
              Disconnect to reconnect.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
