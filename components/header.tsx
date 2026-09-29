"use client";

import { useEffect, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";

type Theme = "dark" | "light";

const themeStorageKey = "postcore-theme";
const themeChangeEvent = "postcore-theme-change";

function getThemeSnapshot(): Theme {
  return window.localStorage.getItem(themeStorageKey) === "light"
    ? "light"
    : "dark";
}

function getServerThemeSnapshot(): Theme {
  return "dark";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(themeChangeEvent, onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(themeChangeEvent, onChange);
  };
}

export function Header() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem(themeStorageKey, nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  const isDark = theme === "dark";

  return (
    <header
      className={`sticky top-0 z-50 rounded-[1.5rem] border px-4 py-3 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:px-5 ${
        isDark
          ? "border-orange-200 bg-[#0f172a] text-white"
          : "border-orange-300 bg-white text-slate-900"
      }`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:flex xl:flex-row xl:items-center xl:justify-between">
        <Link
          href="/"
          className={`flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 ${
            isDark ? "hover:bg-white/30" : "hover:bg-orange-100"
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-1 shadow-lg">
            <Image
              src="/brand-mark.svg"
              alt="PostCore logo"
              width={40}
              height={40}
              className="smooth-transition h-10 w-10 rounded-full transition-transform duration-300 ease-out hover:scale-110 hover:cursor-pointer"
            />
          </div>
          <div>
            <p className="text-lg font-semibold">PostCore</p>
            <p
              className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}
            >
              Campus resale marketplace
            </p>
          </div>
        </Link>

        <details className="relative justify-self-end xl:hidden">
          <summary
            className={`flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
              isDark
                ? "border-white/10 bg-white/10 text-white hover:bg-white/20"
                : "border-slate-300 bg-slate-100 text-slate-900 hover:bg-slate-200"
            } [&::-webkit-details-marker]:hidden`}
          >
            <span>Menu</span>
            <span
              aria-hidden="true"
              className={isDark ? "text-slate-400" : "text-slate-500"}
            >
              ⌄
            </span>
          </summary>
          <nav
            className={`absolute right-0 top-full z-60 mt-2 grid min-w-48 gap-1 rounded-2xl border p-2 text-sm font-medium shadow-xl ${
              isDark
                ? "border-white/10 bg-slate-950 text-slate-200"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <Link href="/" className="rounded-xl px-3 py-2.5 hover:bg-white/10">
              Home
            </Link>
            <Link
              href="/sell"
              className="rounded-xl px-3 py-2.5 hover:bg-white/10"
            >
              Sell
            </Link>
            <Link
              href="/products"
              className="rounded-xl px-3 py-2.5 hover:bg-white/10"
            >
              Products
            </Link>
            <Link
              href="/saved"
              className="rounded-xl px-3 py-2.5 hover:bg-white/10"
            >
              Saved
            </Link>
            <Link
              href="/contacts"
              className="rounded-xl px-3 py-2.5 hover:bg-white/10"
            >
              Contacts
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-xl border border-orange-400 bg-orange-500 px-3 py-2.5 text-left font-semibold text-white hover:bg-orange-400"
            >
              {isDark ? "Light mode" : "Night mode"}
            </button>
            <Link
              href="/account"
              className="rounded-xl bg-orange-500 px-3 py-2.5 text-white hover:bg-orange-400"
            >
              Account
            </Link>
          </nav>
        </details>

        <div
          className={`group col-span-2 flex min-w-0 items-center gap-2 rounded-full border px-3 py-2 text-center transition-colors duration-200 xl:col-span-1 xl:min-w-60 xl:max-w-80 xl:flex-1 ${
            isDark
              ? "border-white/10 bg-white/10 hover:border-white/20 hover:bg-white/20"
              : "border-slate-300 bg-slate-100 hover:border-orange-300 hover:bg-orange-50"
          }`}
        >
          <span
            className={`flex pb-1 text-2xl transition-transform duration-200 ease-out group-hover:scale-120 ${
              isDark ? "text-slate-400" : "text-slate-600"
            }`}
          >
            ⌕
          </span>

          <input
            className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
            placeholder="Search school supplies, snacks, sellers"
          />
        </div>

        <nav
          className={`hidden flex-wrap items-center gap-2 text-sm font-medium xl:flex ${isDark ? "text-slate-200" : "text-slate-700"}`}
        >
          <Link
            href="/"
            className={`smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out ${
              isDark
                ? "hover:bg-white/10 hover:text-white"
                : "hover:bg-orange-100 hover:text-orange-700"
            }`}
          >
            Home
          </Link>
          <Link
            href="/sell"
            className={`smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out ${
              isDark
                ? "hover:bg-white/10 hover:text-white"
                : "hover:bg-orange-100 hover:text-orange-700"
            }`}
          >
            Sell
          </Link>
          <Link
            href="/products"
            className={`smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out ${
              isDark
                ? "hover:bg-white/10 hover:text-white"
                : "hover:bg-orange-100 hover:text-orange-700"
            }`}
          >
            Products
          </Link>
          <Link
            href="/saved"
            className={`smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out ${
              isDark
                ? "hover:bg-white/10 hover:text-white"
                : "hover:bg-orange-100 hover:text-orange-700"
            }`}
          >
            Saved
          </Link>
          <Link
            href="/contacts"
            className={`smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out ${
              isDark
                ? "hover:bg-white/10 hover:text-white"
                : "hover:bg-orange-100 hover:text-orange-700"
            }`}
          >
            Contacts
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="smooth-transition rounded-full border border-orange-400 bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400"
          >
            {isDark ? "Light mode" : "Night mode"}
          </button>
          <Link
            href="/account"
            className="smooth-transition rounded-full bg-orange-500 px-3 py-2 text-white transition-colors duration-200 ease-out hover:bg-orange-400"
          >
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
