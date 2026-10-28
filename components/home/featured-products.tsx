"use client";

import Link from "next/link";
import { ArrowRight, Package } from "@/components/icons";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { SectionHeading } from "@/components/ui/section-heading";
import type { Product } from "@/components/types";

export function FeaturedProducts({
  products,
  isLoading,
  error,
  onRetry,
}: {
  products: Product[];
  isLoading: boolean;
  error: string;
  onRetry: () => void;
}) {
  const featured = products.slice(0, 3);

  return (
    <section className="space-y-6" aria-labelledby="fresh-heading">
      <SectionHeading
        eyebrow="Fresh on campus"
        title={
          <span id="fresh-heading">
            Newly listed, <span className="display-italic">still useful.</span>
          </span>
        }
        description="The latest things students have put on the shelf. When it is gone, it is gone — request the good stuff while it is here."
        action={{ href: "/products", label: "See every listing" }}
      />

      {isLoading ? (
        <ProductGridSkeleton count={4} />
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose/25 bg-rose-soft p-5 text-sm text-rose sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{error}</p>
          <button type="button" onClick={onRetry} className="btn btn-secondary btn-sm shrink-0">
            Try again
          </button>
        </div>
      ) : featured.length === 0 ? (
        <div className="grid items-center gap-6 rounded-2xl border border-dashed border-line-strong bg-surface/70 p-8 text-center sm:grid-cols-[auto_1fr] sm:text-left">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted sm:mx-0">
            <Package size={28} />
          </span>
          <div>
            <p className="font-display text-2xl tracking-tight text-ink">
              The shelves are being stocked.
            </p>
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
              There are no live listings right now. If you have spare stationery,
              snacks, or study gear, the market starts with your first listing.
            </p>
            <Link href="/sell" className="btn btn-primary mt-4">
              List the first item
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : (
        <ProductGrid
          products={featured}
          onStockChanged={onRetry}
          onPurchaseSuccess={onRetry}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4"
          extraCard={featured.length < 3 ? <BrowseAllCard /> : null}
        />
      )}
    </section>
  );
}

function BrowseAllCard() {
  return (
    <Link
      href="/products"
      className="group relative flex min-h-[22rem] flex-col justify-between overflow-hidden rounded-[1.4rem] border border-[#263a30] bg-[#15241d] p-5 text-[#f6f1e7] shadow-[var(--shadow-sm)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.14)_0.7px,transparent_0.8px)] [background-size:20px_20px]"
      />
      <div className="relative flex items-start justify-between">
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white/75">
          The whole market
        </span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-colors group-hover:bg-white/20">
          <ArrowRight size={16} className="-rotate-45" />
        </span>
      </div>
      <div className="relative">
        <p className="font-display text-[2.1rem] leading-[1.05] tracking-[-0.025em]">
          Find your next
          <br />
          <span className="italic text-gold">campus favourite.</span>
        </p>
        <p className="mt-3 max-w-[18rem] text-[0.8rem] leading-6 text-white/60">
          See every listing, filter by category, and check what is still in stock.
        </p>
        <span className="mt-5 inline-flex items-center gap-2 text-[0.78rem] font-semibold text-gold">
          Browse all listings
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
