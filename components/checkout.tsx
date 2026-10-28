"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import {
  ArrowRight,
  Check,
  CheckCircle,
  Copy,
  Lock,
  Minus,
  Plus,
  ShieldCheck,
  Spinner,
} from "@/components/icons";
import { ProductImage } from "@/components/product-media";
import { Modal } from "@/components/ui/modal";
import type { Product } from "@/components/types";

type OrderSubmissionResponse = {
  code?: string;
  message?: string;
  orderReference?: string;
  purchasedAt?: string;
};

type CheckoutDialogProps = {
  product: Product;
  onClose: () => void;
  onPurchaseSuccess?: (productId: string, quantity: number) => void;
  onStockChanged?: () => void;
};

export function CheckoutDialog({
  product,
  onClose,
  onPurchaseSuccess,
  onStockChanged,
}: CheckoutDialogProps) {
  const { user, isReady, isConfigured } = useAuth();
  const [orderReference, setOrderReference] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const requestedQuantity = Number(quantity);
  const total = useMemo(
    () =>
      parseMntAmount(product.price) *
      (Number.isSafeInteger(requestedQuantity) && requestedQuantity > 0
        ? requestedQuantity
        : 0),
    [product.price, requestedQuantity],
  );
  const maxQuantity = product.quantity;

  const adjustQuantity = (direction: -1 | 1) => {
    const current = Number.isSafeInteger(requestedQuantity)
      ? requestedQuantity
      : 1;
    const next = Math.max(1, current + direction);
    if (maxQuantity !== undefined && next > maxQuantity) return;
    setQuantity(String(next));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (product.outOfStock || product.quantity === 0) {
      setError("This item has sold out and is no longer available.");
      onStockChanged?.();
      return;
    }
    if (!user) {
      setError("Sign in before requesting an item so it can be linked to your account.");
      return;
    }
    if (
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > 2_147_483_647 ||
      (product.quantity !== undefined && requestedQuantity > product.quantity)
    ) {
      setError(
        product.quantity !== undefined && requestedQuantity > product.quantity
          ? `Only ${product.quantity} ${
              product.quantity === 1 ? "item remains" : "items remain"
            } in stock. Lower the quantity and try again.`
          : "Enter a valid quantity that is currently in stock.",
      );
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          quantity: requestedQuantity,
        }),
      });
      const result = (await response.json()) as OrderSubmissionResponse;
      if (!response.ok || !result.orderReference || !result.purchasedAt) {
        if (
          result.code === "INSUFFICIENT_STOCK" ||
          result.code === "PRODUCT_UNAVAILABLE"
        ) {
          onStockChanged?.();
        }
        throw new Error(result.message ?? "The request could not be saved.");
      }

      setOrderReference(result.orderReference);
      setPurchasedAt(result.purchasedAt);
      onPurchaseSuccess?.(product.id, requestedQuantity);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The request could not be saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(orderReference);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const signInHref = `/signin?next=${encodeURIComponent(
    `/products?q=${encodeURIComponent(product.name)}`,
  )}`;

  return (
    <Modal
      open
      onClose={onClose}
      labelledBy="checkout-title"
      closeLabel="Close checkout"
      className="max-w-xl"
    >
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-line bg-surface-2/70 px-5 py-4 pr-14 sm:px-7">
          <p className="eyebrow">
            {orderReference ? "Request received" : "Purchase request"}
          </p>
          <h2
            id="checkout-title"
            className="mt-2 font-display text-[1.75rem] leading-tight tracking-[-0.02em] text-ink"
          >
            {orderReference ? "You're on the list." : "Request this item"}
          </h2>
        </div>

        {orderReference ? (
          <div className="p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-soft text-pine">
                <CheckCircle size={24} />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  Your request for {product.name} is saved.
                </p>
                <p className="mt-1 text-[0.8rem] leading-5 text-muted">
                  A student admin will review it, then you can arrange pickup on
                  campus. No payment was taken.
                </p>
              </div>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface-2/60 p-5">
              <div className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
              <div className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-surface" />
              <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-muted">
                Your order code
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="font-mono text-[2rem] font-bold tracking-[0.18em] text-ink">
                  {orderReference}
                </p>
                <button
                  type="button"
                  onClick={() => void copyReference()}
                  className="icon-btn h-9 w-9 shrink-0"
                  aria-label="Copy order code"
                >
                  {copied ? <Check size={16} className="text-pine" /> : <Copy size={16} />}
                </button>
              </div>
              {copied ? (
                <p role="status" className="mt-1 text-[0.7rem] font-medium text-pine">
                  Copied to clipboard.
                </p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 text-[0.78rem]">
                <div>
                  <p className="text-muted">Quantity</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {quantity} × {formatMntPrice(product.price)}
                  </p>
                </div>
                <div>
                  <p className="text-muted">Requested</p>
                  <p className="mt-0.5 font-semibold text-ink">
                    {new Date(purchasedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              <Link href="/account?tab=receipts" className="btn btn-primary btn-block">
                View my receipts
                <ArrowRight size={15} />
              </Link>
              <button type="button" onClick={onClose} className="btn btn-ghost btn-block">
                Keep browsing
              </button>
            </div>
          </div>
        ) : !isReady ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted">
            <Spinner size={18} />
            Checking your account…
          </div>
        ) : !isConfigured ? (
          <div className="p-5 sm:p-7">
            <div className="rounded-2xl border border-accent/25 bg-accent-soft p-4 text-sm leading-6 text-ink">
              Orders are not connected on this deployment yet. Add the Supabase
              environment variables described in the README, then reload.
            </div>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-block mt-4">
              Close
            </button>
          </div>
        ) : !user ? (
          <div className="p-5 sm:p-7">
            <ProductSummary
              product={product}
              quantity={1}
              total={parseMntAmount(product.price)}
            />
            <div className="mt-5 rounded-2xl border border-line bg-surface-2 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Lock size={16} className="text-pine" />
                Sign in to finish this request
              </div>
              <p className="mt-1.5 text-[0.8rem] leading-5 text-muted">
                Your order is linked to your account so you can find the code and
                pickup details later.
              </p>
              <Link href={signInHref} className="btn btn-primary btn-block mt-4">
                Sign in or register
                <ArrowRight size={15} />
              </Link>
            </div>
            <p className="mt-4 text-center text-[0.72rem] leading-5 text-muted">
              No payment is collected online. Pickup is arranged on campus.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-7">
            <ProductSummary
              product={product}
              quantity={
                Number.isSafeInteger(requestedQuantity) && requestedQuantity > 0
                  ? requestedQuantity
                  : 0
              }
              total={total}
            />

            <div className="mt-5">
              <label className="field-label" htmlFor="purchase-quantity">
                Quantity
              </label>
              <div className="flex items-stretch gap-2">
                <div className="flex h-12 flex-1 items-stretch overflow-hidden rounded-xl border border-line-strong bg-surface">
                  <button
                    type="button"
                    onClick={() => adjustQuantity(-1)}
                    disabled={(requestedQuantity || 1) <= 1}
                    className="flex w-12 items-center justify-center border-r border-line text-ink-soft transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={17} />
                  </button>
                  <input
                    id="purchase-quantity"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={quantity}
                    onChange={(event) =>
                      setQuantity(event.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                    className="min-w-0 flex-1 bg-transparent text-center text-base font-semibold text-ink outline-none"
                    aria-label="Purchase quantity"
                  />
                  <button
                    type="button"
                    onClick={() => adjustQuantity(1)}
                    disabled={
                      maxQuantity !== undefined && (requestedQuantity || 1) >= maxQuantity
                    }
                    className="flex w-12 items-center justify-center border-l border-line text-ink-soft transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Increase quantity"
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <div className="flex min-w-28 flex-col justify-center rounded-xl bg-surface-2 px-4 text-right">
                  <span className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted">
                    Total
                  </span>
                  <span className="price text-lg text-ink">
                    {formatMntPrice(total)}
                  </span>
                </div>
              </div>
              {maxQuantity !== undefined ? (
                <p className="mt-2 text-[0.72rem] text-muted">
                  {maxQuantity} available. You can request up to {maxQuantity}.
                </p>
              ) : null}
            </div>

            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-pine-soft px-3.5 py-3 text-[0.78rem] leading-5 text-pine">
              <ShieldCheck size={16} className="mt-0.5 shrink-0" />
              <p>
                No payment is collected online. A student admin reviews the
                request, then you arrange a campus pickup.
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="mt-4 rounded-xl border border-rose/30 bg-rose-soft p-3 text-[0.8rem] leading-5 text-rose"
              >
                {error}
                {error.includes("Sign in") ? (
                  <Link
                    href={signInHref}
                    className="mt-2 inline-flex font-semibold underline underline-offset-2"
                  >
                    Sign in to your account
                  </Link>
                ) : null}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSaving || total <= 0}
              className="btn btn-primary btn-lg btn-block mt-5"
            >
              {isSaving ? (
                <>
                  <Spinner size={17} />
                  Sending request…
                </>
              ) : (
                <>
                  Place request
                  <ArrowRight size={16} className="arrow-slide" />
                </>
              )}
            </button>
            <p className="mt-3 text-center text-[0.7rem] leading-5 text-muted">
              Signed in as {user.email}
            </p>
          </form>
        )}
      </div>
    </Modal>
  );
}

function ProductSummary({
  product,
  quantity,
  total,
}: {
  product: Product;
  quantity: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface-2/60 p-3">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
        <ProductImage product={product} sizes="80px" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{product.name}</p>
        <p className="mt-0.5 truncate text-[0.72rem] text-muted">{product.category}</p>
        <p className="mt-1 text-[0.72rem] font-medium text-ink-soft">
          {formatMntPrice(product.price)} each
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-muted">
          {quantity > 0 ? `${quantity} ×` : "Total"}
        </p>
        <p className="price mt-0.5 text-lg text-ink">
          {formatMntPrice(total || parseMntAmount(product.price))}
        </p>
      </div>
    </div>
  );
}
