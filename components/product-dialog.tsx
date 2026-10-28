"use client";

import Link from "next/link";
import { useState } from "react";
import { formatMntPrice } from "@/components/currency";
import { toggleFavorite, useFavorites } from "@/components/favorites";
import {
  ArrowRight,
  Check,
  Heart,
  MapPin,
  Package,
  Share,
  ShieldCheck,
} from "@/components/icons";
import { isUnavailable } from "@/lib/catalog";
import { ProductImage } from "@/components/product-media";
import { Modal } from "@/components/ui/modal";
import type { Product } from "@/components/types";

type ProductDialogProps = {
  product: Product | null;
  onClose: () => void;
  onBuy: (product: Product) => void;
};

export function ProductDialog({ product, onClose, onBuy }: ProductDialogProps) {
  const favorites = useFavorites();
  const [shareState, setShareState] = useState<"idle" | "copied" | "error">("idle");

  if (!product) return null;

  const saved = favorites.includes(product.id);
  const unavailable = isUnavailable(product);
  const pickupParts = [product.pickupClass, product.pickupRoom].filter(Boolean);
  const hasPickupDetails = Boolean(product.pickupClass || product.pickupRoom || product.pickupMethod);

  const shareProduct = async () => {
    const shareUrl = `${window.location.origin}/products?q=${encodeURIComponent(product.name)}`;
    const shareData = {
      title: product.name,
      text: `${product.name} — ${formatMntPrice(product.price)} on PostCore`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2200);
    } catch {
      setShareState("error");
      window.setTimeout(() => setShareState("idle"), 2200);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="product-dialog-title"
      showClose
      closeLabel="Close item details"
      className="max-w-4xl"
    >
      <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[1.05fr_1fr] md:overflow-hidden">
        <div className="relative h-[17rem] shrink-0 bg-surface-2 md:h-auto md:min-h-[34rem]">
          <ProductImage
            product={product}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            className={unavailable ? "opacity-80 grayscale-[0.4]" : ""}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/50 to-transparent p-4 pt-16">
            <span className="rounded-full border border-white/25 bg-black/35 px-3 py-1.5 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
              {product.badge || "Campus find"}
            </span>
            {unavailable ? (
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-[0.68rem] font-bold text-ink">
                Sold out
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-surface md:overflow-y-auto">

          <div className="flex-1 p-6 pt-7 sm:p-8">
            <p className="font-mono text-[0.63rem] font-semibold uppercase tracking-[0.18em] text-muted">
              {product.category}
            </p>
            <h2
              id="product-dialog-title"
              className="mt-2 font-display text-[2rem] leading-[1.05] tracking-[-0.025em] text-ink sm:text-[2.4rem]"
            >
              {product.name}
            </h2>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="price text-[1.9rem] leading-none text-ink">
                {formatMntPrice(product.price)}
              </p>
              <span className="text-xs font-medium text-muted">per item</span>
            </div>

            {product.quantity !== undefined ? (
              <p
                className={`mt-2 text-[0.76rem] font-semibold ${
                  unavailable
                    ? "text-rose"
                    : product.quantity <= 3
                      ? "text-accent-strong"
                      : "text-pine"
                }`}
              >
                {unavailable
                  ? "No longer available"
                  : product.quantity <= 3
                    ? `Only ${product.quantity} left — request soon`
                    : `${product.quantity} available`}
              </p>
            ) : null}

            <p className="mt-5 whitespace-pre-line text-[0.9rem] leading-7 text-ink-soft">
              {product.description}
            </p>

            {product.fitsFor ? (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
                <Package size={16} className="mt-0.5 shrink-0 text-pine" />
                <p className="text-[0.82rem] leading-5 text-ink-soft">
                  <span className="font-semibold text-ink">Good for:</span>{" "}
                  {product.fitsFor}
                </p>
              </div>
            ) : null}

            <div className="mt-3 rounded-xl border border-line bg-pine-soft px-3.5 py-3.5 text-pine">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="shrink-0" />
                <p className="text-[0.82rem] font-semibold">
                  {hasPickupDetails
                    ? pickupParts.length > 0
                      ? `Pickup: ${pickupParts.join(" · ")}`
                      : "Campus pickup"
                    : "Arrange pickup with the seller"}
                </p>
              </div>
              {product.pickupMethod ? (
                <p className="mt-1.5 pl-6 text-[0.78rem] leading-5 opacity-90">
                  {product.pickupMethod}
                </p>
              ) : null}
              {!hasPickupDetails ? (
                <p className="mt-1.5 pl-6 text-[0.78rem] leading-5 opacity-90">
                  Send your request, then coordinate a classroom or campus hand-off.
                </p>
              ) : null}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[0.72rem] leading-5 text-muted">
              <ShieldCheck size={15} className="shrink-0 text-pine" />
              Requests are reviewed by a student admin. No payment is taken online.
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-line bg-surface/95 p-4 backdrop-blur sm:p-5">
            {shareState !== "idle" ? (
              <p
                role="status"
                className={`mb-2 flex items-center gap-1.5 text-[0.72rem] font-medium ${
                  shareState === "copied" ? "text-pine" : "text-rose"
                }`}
              >
                {shareState === "copied" ? <Check size={13} /> : null}
                {shareState === "copied"
                  ? "Link copied to clipboard."
                  : "Could not share this item."}
              </p>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onBuy(product)}
                disabled={unavailable}
                className="btn btn-primary flex-1"
              >
                {unavailable ? "Sold out" : "Request to buy"}
                {!unavailable ? <ArrowRight size={16} className="arrow-slide" /> : null}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(product.id)}
                aria-pressed={saved}
                className={`icon-btn h-11 w-11 ${
                  saved ? "border-accent bg-accent text-on-accent" : ""
                }`}
                aria-label={saved ? "Remove from saved" : "Save this item"}
              >
                <Heart size={18} filled={saved} />
              </button>
              <button
                type="button"
                onClick={() => void shareProduct()}
                className="icon-btn h-11 w-11"
                aria-label="Share this item"
              >
                <Share size={17} />
              </button>
            </div>
            {unavailable ? (
              <Link
                href="/products"
                className="mt-2 block text-center text-[0.72rem] font-semibold text-accent-strong hover:underline"
              >
                Browse other items
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}
