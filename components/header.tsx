import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="rounded-[1.5rem] border border-orange-200 bg-[#0f172a] px-4 py-3 text-white shadow-[0_18px_45px_-20px_rgba(15,23,42,0.75)] sm:px-5 top-0 z-50 sticky">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 xl:flex xl:flex-row xl:items-center xl:justify-between">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 hover:bg-white/30"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 p-1 shadow-lg">
            <Image
              src="/brand-mark.svg"
              alt="CaseCart logo"
              width={40}
              height={40}
              className="smooth-transition h-10 w-10 rounded-full transition-transform duration-300 ease-out hover:scale-110 hover:cursor-pointer"
            />
          </div>
          <div>
            <p className="text-lg font-semibold">CaseCart</p>
            <p className="text-sm text-slate-300">Stylish resale marketplace</p>
          </div>
        </Link>

        <details className="relative justify-self-end xl:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 [&::-webkit-details-marker]:hidden">
            <span>Menu</span>
            <span aria-hidden="true" className="text-slate-400">
              ⌄
            </span>
          </summary>
          <nav className="absolute right-0 top-full z-60 mt-2 grid min-w-48 gap-1 rounded-2xl border border-white/10 bg-slate-950 p-2 text-sm font-medium text-slate-200 shadow-xl">
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
            <Link
              href="/account"
              className="rounded-xl bg-orange-500 px-3 py-2.5 text-white hover:bg-orange-400"
            >
              Account
            </Link>
          </nav>
        </details>

        <div className="group col-span-2 flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-center transition-colors duration-200 hover:border-white/20 hover:bg-white/20 xl:col-span-1 xl:min-w-60 xl:max-w-80 xl:flex-1">
          <span className="flex pb-1 text-2xl text-slate-400 transition-transform duration-200 ease-out group-hover:scale-120">
            ⌕
          </span>

          <input
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
            placeholder="Search cases, brands, sellers"
          />
        </div>

        <nav className="hidden flex-wrap items-center gap-2 text-sm font-medium text-slate-200 xl:flex">
          <Link
            href="/"
            className="smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/sell"
            className="smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
          >
            Sell
          </Link>
          <Link
            href="/products"
            className="smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
          >
            Products
          </Link>
          <Link
            href="/saved"
            className="smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
          >
            Saved
          </Link>
          <Link
            href="/contacts"
            className="smooth-transition rounded-full px-3 py-2 transition-colors duration-200 ease-out hover:bg-white/10 hover:text-white"
          >
            Contacts
          </Link>
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
