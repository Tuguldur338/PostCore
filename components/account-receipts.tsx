"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import { ArrowRight, CheckCircle, Clock, Package, Receipt } from "@/components/icons";

type PurchaseReceipt = {
  id: string;
  order_reference: string;
  purchaser_name: string;
  product_name: string;
  price: string;
  quantity: number;
  seller_email: string | null;
  status: "new" | "completed";
  created_at: string;
};

type ReceiptsResponse = {
  message?: string;
  receipts?: PurchaseReceipt[];
};

export function AccountReceipts() {
  const { user, isReady } = useAuth();
  const userId = user?.id;
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (!isReady || !userId) return;

    const loadReceipts = async () => {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const result = (await response.json()) as ReceiptsResponse;
        if (!response.ok) {
          throw new Error(result.message ?? "Your purchase receipts could not be loaded.");
        }
        if (active) setReceipts(result.receipts ?? []);
      } catch (loadError) {
        if (active) {
          setMessage(
            loadError instanceof Error
              ? loadError.message
              : "Your purchase receipts could not be loaded.",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadReceipts();
    return () => {
      active = false;
    };
  }, [isReady, userId]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Receipt size={17} className="text-pine" />
          Sign in to see your receipts
        </div>
        <p className="mt-2 text-sm leading-6 text-muted">
          Every request you send while signed in appears here with its order code
          and pickup details.
        </p>
        <Link href="/signin?next=/account%3Ftab%3Dreceipts" className="btn btn-primary mt-4">
          Sign in
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((index) => (
          <div key={index} className="skeleton h-40 rounded-2xl border border-line" />
        ))}
      </div>
    );
  }

  if (message) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose/25 bg-rose-soft p-5 text-sm text-rose"
      >
        <p>{message}</p>
        {message.includes("Sign in") ? (
          <Link href="/signin" className="mt-3 inline-flex font-semibold underline">
            Sign in to your account
          </Link>
        ) : null}
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Receipt size={25} />
        </span>
        <p className="mt-4 font-display text-2xl tracking-tight text-ink">
          No receipts yet.
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Request an item from the market and its order code will show up here.
        </p>
        <Link href="/products" className="btn btn-primary mt-5">
          Browse the market
          <ArrowRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">
          {receipts.length} {receipts.length === 1 ? "request" : "requests"} on record
        </p>
        <Link href="/contacts#faq" className="text-[0.76rem] font-semibold text-accent-strong hover:underline">
          Need help with a receipt?
        </Link>
      </div>

      {receipts.map((receipt) => {
        const total = parseMntAmount(receipt.price) * receipt.quantity;
        const completed = receipt.status === "completed";
        return (
          <article
            key={receipt.id}
            className="relative overflow-hidden rounded-2xl border border-line bg-surface"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-surface-2/50 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    completed ? "bg-pine-soft text-pine" : "bg-gold-soft text-[#7a5412]"
                  }`}
                >
                  {completed ? <CheckCircle size={17} /> : <Clock size={17} />}
                </span>
                <div>
                  <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.16em] text-muted">
                    Order code
                  </p>
                  <p className="font-mono text-base font-bold tracking-[0.14em] text-ink">
                    {receipt.order_reference}
                  </p>
                </div>
              </div>
              <span
                className={`chip border-transparent ${
                  completed ? "chip-pine" : "chip-gold"
                }`}
              >
                {completed ? "Completed" : "Awaiting review"}
              </span>
            </div>

            <div className="grid gap-5 p-4 sm:grid-cols-[1fr_auto] sm:p-5">
              <div>
                <p className="font-display text-xl tracking-tight text-ink">
                  {receipt.product_name}
                </p>
                <p className="mt-1 text-[0.76rem] text-muted">
                  Requested {new Date(receipt.created_at).toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  · {receipt.quantity} × {formatMntPrice(receipt.price)}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.72rem] text-muted">
                  <span className="chip">
                    <Package size={12} />
                    {receipt.quantity} {receipt.quantity === 1 ? "item" : "items"}
                  </span>
                  <span className="chip">For {receipt.purchaser_name}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-line pt-4 sm:min-w-32 sm:flex-col sm:items-end sm:border-none sm:pt-0">
                <div className="text-right">
                  <p className="font-mono text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-muted">
                    Total
                  </p>
                  <p className="price mt-0.5 text-xl text-ink">{formatMntPrice(total)}</p>
                </div>
                <p className="max-w-40 text-right text-[0.66rem] leading-4 text-muted">
                  No payment was taken online.
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
