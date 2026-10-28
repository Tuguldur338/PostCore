"use client";

import type { ReactNode } from "react";
import { formatMntPrice } from "@/components/currency";
import { getBadgeTone, getPickupLabel, getStockLabel, isUnavailable } from "@/lib/catalog";
import { useFavorites, toggleFavorite } from "@/components/favorites";
import { ArrowRight, Heart, MapPin } from "@/components/icons";
import { ProductImage } from "@/components/product-media";
import type { Product } from "@/components/types";

type ProductCardProps = {
  product: Product;
  onOpen: (product: Product) => void;
  priority?: boolean;
  footer?: ReactNode;
}

export function ProductCard({
  product,
  onOpen,
  priority = false,
  footer,
}: ProductCardProps) {
  const favorites = useFavorites();
  const saved = favorites.includes(product.id);
  const unavailable = isUnavailable(product);
  const stock = getStockLabel(product);

  return (
    <article className="product-card group relative flex min-w-0 flex-col overflow-hidden rounded-[1.4rem] border border-line bg-surface shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[var(--shadow-md)]">
      <div className="product-media">
        <ProductImage
          product={product}
          priority={priority}
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          className={unavailable ? "opacity-80 grayscale-[0.55]" : ""}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex flex-wrap gap-1.5">
            {product.badge ? (
              <span className={`chip ${getBadgeTone(product.badge)} pointer-events-none border-transparent`}>
                {product.badge}
              </span>
            ) : null}
            {stock.tone === "low" ? (
              <span className="chip chip-accent pointer-events-none border-transparent">
                {stock.label}
              </span>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpen(product)}
          className="absolute inset-0 z-10 cursor-pointer rounded-none focus-visible:outline-offset-[-3px]"
          aria-label={`View ${product.name}`}
        />

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
          className={`absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur transition-all ${
            saved
              ? "border-accent bg-accent text-on-accent"
              : "border-line bg-surface/90 text-ink hover:border-accent hover:text-accent-strong"
          }`}
        >
          <Heart size={16} filled={saved} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-2 bg-gradient-to-t from-black/45 via-black/10 to-transparent p-3 pt-10">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/35 px-2.5 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur ${
              stock.tone === "out" ? "bg-black/55" : ""
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                stock.tone === "out"
                  ? "bg-white/50"
                  : stock.tone === "low"
                    ? "bg-gold"
                    : "bg-emerald-300"
              }`}
            />
            {stock.label}
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[0.66rem] font-semibold text-white/90 backdrop-blur sm:inline-flex">
            Quick view
            <ArrowRight size={12} />
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 pt-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted">
            {product.category}
          </span>
          {product.fitsFor ? (
            <span className="hidden max-w-[45%] truncate text-[0.66rem] text-muted sm:block">
              {product.fitsFor}
            </span>
          ) : null}
        </div>

        <h3 className="product-title mt-2 line-clamp-2 text-[1.15rem] text-ink">
          <button
            type="button"
            onClick={() => onOpen(product)}
            className="text-left transition-colors hover:text-accent-strong"
          >
            {product.name}
          </button>
        </h3>

        <p className="mt-1.5 line-clamp-2 text-[0.82rem] leading-6 text-muted">
          {product.description}
        </p>

        <div className="mt-3 flex items-center gap-1.5 text-[0.7rem] font-medium text-muted">
          <MapPin size={13} className="shrink-0 text-pine" />
          <span className="truncate">{getPickupLabel(product)}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="min-w-0">
            <p className="price text-[1.4rem] leading-none text-ink">
              {formatMntPrice(product.price)}
            </p>
            <p className="mt-1.5 text-[0.66rem] font-medium text-muted">
              {unavailable ? "Currently unavailable" : "Request to buy"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpen(product)}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all ${
              unavailable
                ? "cursor-not-allowed border-line bg-surface-2 text-muted"
                : "border-ink bg-ink text-paper hover:-translate-y-0.5 hover:border-accent hover:bg-accent hover:text-on-accent"
            }`}
            aria-label={unavailable ? `${product.name} is sold out` : `Request ${product.name}`}
            disabled={unavailable}
          >
            <ArrowRight size={17} />
          </button>
        </div>

        {footer ? <div className="mt-4 border-t border-line pt-3">{footer}</div> : null}
      </div>
    </article>
  );
}
