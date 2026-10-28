"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Grid } from "@/components/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCategoryArt, getCategoryBlurb, getCategoryCounts } from "@/lib/catalog";
import type { Product } from "@/components/types";

const fallbackCategories = [
  "School Supplies",
  "Snacks",
  "Study Tools",
  "Tech & Cases",
];

export function CategoryGrid({
  products,
  isLoading,
}: {
  products: Product[];
  isLoading: boolean;
}) {
  const discovered = getCategoryCounts(products).slice(0, 4);
  const categories =
    discovered.length > 0
      ? discovered
      : fallbackCategories.map((name) => ({ name, count: 0 }));

  return (
    <section className="space-y-6" aria-labelledby="category-heading">
      <SectionHeading
        eyebrow="Browse by shelf"
        title={
          <span id="category-heading">
            Find it by <span className="display-italic">category.</span>
          </span>
        }
        description="The market is organised the way a school bag is: notes and paper, snacks, study gear, and the useful extras."
        action={{ href: "/products", label: "All listings" }}
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="skeleton min-h-[13rem] rounded-[1.4rem] border border-line"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/products?category=${encodeURIComponent(category.name)}`}
              className="group relative flex min-h-[13.5rem] flex-col justify-between overflow-hidden rounded-[1.4rem] border border-line bg-surface p-5"
            >
              <Image
                src={getCategoryArt(category.name)}
                alt=""
                fill
                unoptimized
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 31vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1511]/90 via-[#0b1511]/35 to-transparent" />

              <div className="relative flex items-start justify-between gap-2">
                <span className="rounded-full border border-white/20 bg-black/25 px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
                  {category.count > 0
                    ? `${category.count} ${category.count === 1 ? "item" : "items"}`
                    : "Explore"}
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition-all group-hover:border-white/40 group-hover:bg-white/20">
                  <ArrowUpRight size={15} />
                </span>
              </div>

              <div className="relative">
                <h3 className="font-display text-[1.55rem] leading-tight tracking-[-0.02em] text-white">
                  {category.name}
                </h3>
                <p className="mt-1 max-w-[16rem] text-[0.76rem] leading-5 text-white/70">
                  {getCategoryBlurb(category.name)}
                </p>
              </div>
            </Link>
          ))}

          <Link
            href="/products"
            className="group relative flex min-h-[13.5rem] flex-col justify-between overflow-hidden rounded-[1.4rem] border border-[#263a30] bg-[#15241d] p-5 text-[#f6f1e7]"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.16)_0.7px,transparent_0.8px)] [background-size:20px_20px]"
            />
            <div className="relative flex items-start justify-between">
              <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white/80">
                {products.length} {products.length === 1 ? "listing" : "listings"} total
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition-all group-hover:bg-white/20">
                <Grid size={15} />
              </span>
            </div>
            <div className="relative flex items-end justify-between gap-4">
              <div>
                <h3 className="font-display text-[1.55rem] leading-tight tracking-[-0.02em]">
                  All listings
                </h3>
                <p className="mt-1 text-[0.76rem] leading-5 text-white/60">
                  See the whole market in one place.
                </p>
              </div>
              <ArrowUpRight
                size={22}
                className="shrink-0 text-gold transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1"
              />
            </div>
          </Link>
        </div>
      )}
    </section>
  );
}
