import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="rounded-[1.5rem] border border-orange-200 bg-[#0f172a] px-4 py-3 text-white shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:px-5 top-0 z-50 sticky">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-1 shadow-lg">
            <Link href="/">
              <Image
                src="/brand-mark.svg"
                alt="CaseCart logo"
                width={40}
                height={40}
                className="h-10 w-10 hover:scale-115 transition-transform rounded-full hover:cursor-pointer"
              />
            </Link>
          </div>
          <div>
            <p className="text-lg font-semibold">CaseCart</p>
            <p className="text-sm text-slate-300">Stylish resale marketplace</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 lg:min-w-[330px]">
          <span className="text-base">⌕</span>
          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            placeholder="Search cases, brands, sellers"
          />
        </div>

        <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-200">
          <Link
            href="/"
            className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/sell"
            className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
          >
            Sell
          </Link>
          <Link
            href="/contacts"
            className="rounded-full px-3 py-2 transition hover:bg-white/10 hover:text-white"
          >
            Contacts
          </Link>
          <Link
            href="/account"
            className="rounded-full bg-orange-500 px-3 py-2 text-white transition hover:bg-orange-400"
          >
            Account
          </Link>
        </nav>
      </div>
    </header>
  );
}
