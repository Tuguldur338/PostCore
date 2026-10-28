import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Mail, MapPin } from "@/components/icons";

const footerColumns = [
  {
    title: "Market",
    links: [
      { href: "/products", label: "All listings" },
      { href: "/saved", label: "Saved items" },
      { href: "/sell", label: "Sell an item" },
      { href: "/products?sort=featured", label: "New arrivals" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contacts", label: "Help centre" },
      { href: "/contacts#how-it-works", label: "How it works" },
      { href: "/contacts#safety", label: "Safety & pickup" },
      { href: "/contacts#faq", label: "FAQ" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/signin", label: "Sign in" },
      { href: "/signin?mode=register", label: "Create account" },
      { href: "/account", label: "Receipts" },
      { href: "/orders", label: "Order desk" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1.6fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-paper/95 p-1">
                <Image
                  src="/brand-mark.svg"
                  alt=""
                  width={34}
                  height={34}
                  className="h-[34px] w-[34px]"
                />
              </span>
              <span className="font-display text-3xl font-medium tracking-[-0.03em] text-on-pine">
                PostCore
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-6 text-on-pine/70">
              A student-run marketplace for the things school actually requires:
              notes, snacks, study tools, and the little essentials in between.
            </p>

            <div className="mt-6 space-y-2.5 text-sm text-on-pine/70">
              <p className="flex items-center gap-2">
                <MapPin size={16} className="text-gold" />
                Orkhon School campus
              </p>
              <a
                href="mailto:hello@postcore.student"
                className="flex items-center gap-2 transition-colors hover:text-on-pine"
              >
                <Mail size={16} className="text-gold" />
                hello@postcore.student
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-on-pine/70 transition-colors hover:text-on-pine"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-on-pine/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} PostCore. Made by students, for students.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span>No online payments. Pickup on campus.</span>
            <Link
              href="/contacts#safety"
              className="inline-flex items-center gap-1 font-semibold text-on-pine/80 transition-colors hover:text-on-pine"
            >
              Safety guide
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
