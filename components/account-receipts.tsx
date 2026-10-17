"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMntPrice, parseMntAmount } from "@/components/currency";
import type { DeliveryAddress } from "@/components/types";

type PurchaseReceipt = {
  id: string;
  order_reference: string;
  product_name: string;
  price: string;
  quantity: number;
  seller_email: string | null;
  delivery_address: DeliveryAddress;
  status: "new" | "completed";
  created_at: string;
};

type ReceiptsResponse = {
  message?: string;
  receipts?: PurchaseReceipt[];
};

export function AccountReceipts() {
  const [receipts, setReceipts] = useState<PurchaseReceipt[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadReceipts = async () => {
      try {
        const response = await fetch("/api/orders", { cache: "no-store" });
        const result = (await response.json()) as ReceiptsResponse;
        if (!response.ok) {
          throw new Error(
            result.message ?? "Your purchase receipts could not be loaded.",
          );
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
  }, []);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
          Account
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          Purchase receipts
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Your saved purchase requests and their dates appear here. Sign in
          before placing an order so it can be linked to your account.
        </p>
      </div>

      {isLoading ? (
        <p className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-600">
          Loading your receipts...
        </p>
      ) : message ? (
        <div
          className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950"
          role="alert"
        >
          <p>{message}</p>
          {message.includes("Sign in") ? (
            <Link
              href="/#account"
              className="mt-3 inline-flex rounded-full bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            >
              Sign in to your account
            </Link>
          ) : null}
        </div>
      ) : receipts.length ? (
        <div className="mt-8 grid gap-4">
          {receipts.map((receipt) => (
            <article
              key={receipt.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Receipt
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">
                    {receipt.product_name}
                  </h2>
                  <p className="mt-1 break-all text-sm text-slate-600">
                    Order reference: {receipt.order_reference}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    receipt.status === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {receipt.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-slate-200 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Date purchased</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {new Date(receipt.created_at).toLocaleString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Quantity</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {receipt.quantity}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Price per item</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {formatMntPrice(receipt.price)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Total</dt>
                  <dd className="mt-1 font-semibold text-slate-900">
                    {formatMntPrice(
                      parseMntAmount(receipt.price) * receipt.quantity,
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Delivery</dt>
                  <dd className="mt-1 font-medium text-slate-900">
                    {receipt.delivery_address.recipient}
                    {receipt.delivery_address.classNumber
                      ? ` · Class ${receipt.delivery_address.classNumber}`
                      : ""}
                    {receipt.delivery_address.roomNumber
                      ? ` · Room ${receipt.delivery_address.roomNumber}`
                      : ""}
                    {receipt.delivery_address.building
                      ? ` · Floor ${receipt.delivery_address.building}`
                      : ""}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          No purchase receipts yet. Your orders will appear here after you
          submit them while signed in.
        </div>
      )}
    </section>
  );
}
