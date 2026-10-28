"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/components/auth-provider";
import { useSavedCount } from "@/components/favorites";
import {
  ArrowRight,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import type { User as MarketplaceUser } from "@/components/types";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/sell", label: "Sell" },
  { href: "/saved", label: "Saved" },
  { href: "/orders", label: "Orders" },
];

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return initials || "PC";
}

function AccountAvatar({ user, size = 34 }: { user: MarketplaceUser; size?: number }) {
  if (user.image) {
    return (
      <Image
        src={user.image}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="h-full w-full rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-full w-full items-center justify-center rounded-full bg-pine text-[0.68rem] font-bold tracking-wide text-on-pine"
    >
      {getInitials(user.name)}
    </span>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady } = useAuth();
  const savedCount = useSavedCount();
  const [query, setQuery] = useState("");
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [searchOpenPath, setSearchOpenPath] = useState<string | null>(null);
  const menuOpen = menuOpenPath === pathname;
  const mobileSearchOpen = searchOpenPath === pathname;
  const searchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuPanelRef.current?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpenPath(null);
        return;
      }
      if (event.key !== "Tab" || !menuPanelRef.current) return;

      const items = Array.from(
        menuPanelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName ?? "")
      ) {
        return;
      }
      const desktopInput =
        searchRef.current && searchRef.current.offsetParent !== null
          ? searchRef.current
          : null;
      const input = desktopInput ?? mobileSearchRef.current;
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchRef.current?.focus();
  }, [mobileSearchOpen]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : "/products",
      { scroll: false },
    );
    setMenuOpenPath(null);
    setSearchOpenPath(null);
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-xl py-1"
          aria-label="PostCore home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-[0.85rem] border border-line bg-surface shadow-[var(--shadow-sm)] transition-transform duration-300 group-hover:-rotate-6">
            <Image
              src="/brand-mark.svg"
              alt=""
              width={30}
              height={30}
              priority
              className="h-[30px] w-[30px]"
            />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[1.45rem] font-medium tracking-[-0.03em] text-ink">
              PostCore
            </span>
            <span className="mt-1 hidden font-mono text-[0.56rem] font-medium uppercase tracking-[0.2em] text-muted sm:block">
              Orkhon School market
            </span>
          </span>
        </Link>

        <nav
          className="ml-2 hidden items-center gap-0.5 lg:flex"
          aria-label="Main navigation"
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="nav-link"
              data-active={isActive(link.href)}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
              {link.href === "/saved" && savedCount > 0 ? (
                <span className="ml-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold leading-4 text-on-accent">
                  {savedCount}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={submitSearch}
            className="group relative hidden items-center lg:flex"
            role="search"
          >
            <label htmlFor="header-search" className="sr-only">
              Search the marketplace
            </label>
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 text-muted transition-colors group-focus-within:text-accent"
            />
            <input
              ref={searchRef}
              id="header-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the market"
              className="h-10 w-[13.5rem] rounded-full border border-line bg-surface pl-9 pr-10 text-[0.82rem] text-ink outline-none transition-all placeholder:text-muted/80 focus:w-[17rem] focus:border-accent focus:ring-2 focus:ring-accent/15"
            />
            <kbd className="pointer-events-none absolute right-3 rounded border border-line bg-surface-2 px-1.5 font-mono text-[0.62rem] leading-4 text-muted">
              /
            </kbd>
          </form>

          <button
            type="button"
            onClick={() => setSearchOpenPath(mobileSearchOpen ? null : pathname)}
            className="icon-btn lg:hidden"
            aria-label="Search the marketplace"
            aria-expanded={mobileSearchOpen}
          >
            <Search size={18} />
          </button>

          <ThemeToggle className="hidden sm:inline-flex" />

          {!isReady ? (
            <span
              className="skeleton h-10 w-10 rounded-full"
              aria-label="Loading account"
            />
          ) : user ? (
            <Link
              href="/account"
              className="group flex h-10 items-center gap-2 rounded-full border border-line bg-surface pr-3 pl-1 transition-colors hover:border-line-strong hover:bg-surface-2"
              aria-label={`Account for ${user.name}`}
            >
              <span className="h-8 w-8 overflow-hidden rounded-full ring-1 ring-line">
                <AccountAvatar user={user} />
              </span>
              <span className="hidden max-w-24 truncate text-[0.8rem] font-semibold text-ink xl:block">
                {user.name.split(" ")[0]}
              </span>
            </Link>
          ) : (
            <Link href="/signin" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Sign in
              <ArrowRight size={14} className="arrow-slide" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpenPath(pathname)}
            className="icon-btn lg:hidden"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            <Menu size={19} />
          </button>
        </div>
      </div>

      {mobileSearchOpen ? (
        <div className="border-t border-line bg-paper/95 px-4 py-3 backdrop-blur lg:hidden">
          <form onSubmit={submitSearch} role="search" className="relative">
            <label htmlFor="mobile-search" className="sr-only">
              Search the marketplace
            </label>
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              ref={mobileSearchRef}
              id="mobile-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search notebooks, snacks, study tools…"
              className="field h-11 pl-10 pr-11"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-accent text-on-accent"
              aria-label="Search"
            >
              <ArrowRight size={15} />
            </button>
          </form>
        </div>
      ) : null}

      {menuOpen && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuPanelRef}
              id="mobile-menu"
              tabIndex={-1}
              className="fixed inset-0 z-[95] flex flex-col bg-paper outline-none lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
            >
          <div className="flex h-[var(--header-height)] items-center justify-between border-b border-line px-4">
            <span className="font-display text-2xl font-medium tracking-tight">
              PostCore
            </span>
            <button
              type="button"
              onClick={() => setMenuOpenPath(null)}
              className="icon-btn"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <form onSubmit={submitSearch} role="search" className="relative mb-8">
              <label htmlFor="menu-search" className="sr-only">
                Search the marketplace
              </label>
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                id="menu-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the market"
                className="field h-12 pl-11 text-base"
              />
            </form>

            <nav
              aria-label="Mobile navigation"
              className="flex flex-col"
              onClick={() => setMenuOpenPath(null)}
            >
              {navLinks.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between border-b border-line py-4"
                  aria-current={isActive(link.href) ? "page" : undefined}
                >
                  <span className="flex items-baseline gap-3">
                    <span className="font-mono text-[0.65rem] text-muted">
                      0{index + 1}
                    </span>
                    <span className="font-display text-3xl font-medium tracking-tight text-ink">
                      {link.label}
                    </span>
                  </span>
                  <ArrowRight
                    size={20}
                    className="arrow-slide text-muted transition-colors group-hover:text-accent"
                  />
                </Link>
              ))}
            </nav>

            <div
              className="mt-8 grid grid-cols-2 gap-3"
              onClick={() => setMenuOpenPath(null)}
            >
              <Link href="/contacts" className="btn btn-secondary justify-start">
                <ShieldCheck size={17} />
                Help & safety
              </Link>
              <Link href="/saved" className="btn btn-secondary justify-start">
                <Heart size={17} />
                Saved ({savedCount})
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine">
                  <User size={20} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {user ? user.name : "Not signed in"}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {user ? user.email : "Sign in to request items and save receipts."}
                  </p>
                </div>
              </div>
              <div
                className="mt-4 flex items-center gap-2"
                onClick={() => setMenuOpenPath(null)}
              >
                {user ? (
                  <>
                    <Link href="/account" className="btn btn-primary btn-sm flex-1">
                      My account
                    </Link>
                    <Link href="/sell" className="btn btn-secondary btn-sm flex-1">
                      Sell
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/signin" className="btn btn-primary btn-sm flex-1">
                      Sign in
                    </Link>
                    <Link href="/signin?mode=register" className="btn btn-secondary btn-sm flex-1">
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-3">
              <span className="text-sm font-medium text-ink-soft">Appearance</span>
              <ThemeToggle />
            </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </header>
  );
}
