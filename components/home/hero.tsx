"use client";

import Image from "next/image";
import Link from "next/link";
import { formatMntPrice } from "@/components/currency";
import { ArrowRight, Check, MapPin, ShieldCheck } from "@/components/icons";
import { ProductImage } from "@/components/product-media";
import { getCategoryArt, getPickupLabel } from "@/lib/catalog";
import type { Product } from "@/components/types";

export function Hero({
  featured,
  isLoading,
}: {
  featured?: Product;
  isLoading: boolean;
}) {
  const href = featured
    ? `/products?q=${encodeURIComponent(featured.name)}`
    : "/products";

  return (
    <section className="relative overflow-hidden pt-2 sm:pt-6">
      <div
        aria-hidden="true"
        className="bg-dots pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 [mask-image:radial-gradient(circle,black,transparent_70%)]"
      />
      <div className="grid items-center gap-12 lg:grid-cols-[1.03fr_0.97fr] lg:gap-10">
        <div className="hero-enter relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-ink-soft shadow-[var(--shadow-sm)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pine" />
            </span>
            Student-run · Orkhon School
          </span>

          <h1 className="page-title mt-6 text-[clamp(2.85rem,7vw,5rem)]">
            Everything for the school day,{" "}
            <span className="display-italic text-accent-strong">from people you know.</span>
          </h1>

          <p className="lede mt-6 max-w-xl">
            A student-run market for notebooks, snacks, study tools, and the
            small things that make campus easier. Browse what is on the shelf,
            request it in a tap, and pick it up in class.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/products" className="btn btn-primary btn-lg">
              Shop the market
              <ArrowRight size={17} className="arrow-slide" />
            </Link>
            <Link href="/sell" className="btn btn-secondary btn-lg">
              Sell something
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2.5 text-[0.76rem] font-medium text-ink-soft">
            <li className="flex items-center gap-1.5">
              <Check size={14} className="text-pine" />
              No online payment
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin size={14} className="text-pine" />
              Pickup on campus
            </li>
            <li className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-pine" />
              Reviewed by student admins
            </li>
          </ul>
        </div>

        <div className="hero-enter-delay relative mx-auto w-full max-w-[29rem] lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rotate-2 rounded-[2.75rem] border border-line bg-pine-soft/60"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -left-3 h-24 w-24 rounded-full bg-gold/25 blur-2xl"
          />

          <Link
            href={href}
            className="group relative block rounded-[2rem] border border-line bg-surface p-2.5 shadow-[var(--shadow-lg)] transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-[4/4.4] overflow-hidden rounded-[1.55rem] bg-surface-2">
              {isLoading ? (
                <div className="skeleton absolute inset-0" />
              ) : featured ? (
                <ProductImage
                  product={featured}
                  priority
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <Image
                  src={getCategoryArt("School Supplies")}
                  alt=""
                  fill
                  unoptimized
                  sizes="(max-width: 1024px) 90vw, 42vw"
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c1712]/80 via-transparent to-transparent" />

              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-4">
                <span className="rounded-full border border-white/25 bg-black/25 px-3 py-1.5 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                  {featured ? "On the shelf now" : "Fresh shelves"}
                </span>
                <span className="rounded-full bg-gold px-2.5 py-1 font-mono text-[0.6rem] font-bold uppercase tracking-[0.12em] text-[#241a08]">
                  New
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white/70">
                  {featured?.category ?? "Student marketplace"}
                </p>
                <p className="mt-1.5 line-clamp-2 font-display text-[1.8rem] leading-[1.08] tracking-[-0.02em]">
                  {featured?.name ?? "Your next find is on the shelf."}
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="price text-xl text-white">
                    {featured ? formatMntPrice(featured.price) : "Browse the market"}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[0.66rem] font-semibold backdrop-blur">
                    <MapPin size={12} />
                    {featured ? getPickupLabel(featured) : "Campus pickup"}
                  </span>
                </div>
              </div>
            </div>
          </Link>

        </div>
      </div>
    </section>
  );
}
