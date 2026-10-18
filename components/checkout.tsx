"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { formatMntPrice, parseMntAmount } from "./currency";
import { getDeliveryAddressError } from "./delivery-validation";
import { QuantityInput } from "./quantity-input";
import type { DeliveryAddress, Product } from "./types";

const sessionStorageKey = "postcore-current-user";

const emptyDeliveryAddress: DeliveryAddress = {
  recipient: "",
  classNumber: "",
  roomNumber: "",
  building: "",
  instructions: "",
};

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
  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress>(emptyDeliveryAddress);
  const [orderReference, setOrderReference] = useState("");
  const [purchasedAt, setPurchasedAt] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    try {
      const rawSession = window.localStorage.getItem(sessionStorageKey);
      if (!rawSession) return;

      const user = JSON.parse(rawSession) as {
        deliveryAddress?: Partial<DeliveryAddress>;
      };
      if (user.deliveryAddress) {
        queueMicrotask(() => {
          setDeliveryAddress({
            ...emptyDeliveryAddress,
            ...user.deliveryAddress,
          });
        });
      }
    } catch {
      window.localStorage.removeItem(sessionStorageKey);
    }
  }, []);

  const handleAddressChange = (field: keyof DeliveryAddress, value: string) => {
    setDeliveryAddress((previous) => ({ ...previous, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const validationError = getDeliveryAddressError(deliveryAddress);
    if (validationError) {
      setError(validationError);
      return;
    }

    const requestedQuantity = Number(quantity);
    if (product.outOfStock || product.quantity === 0) {
      setError("This item has sold out and is no longer available.");
      onStockChanged?.();
      return;
    }
    if (
      !Number.isSafeInteger(requestedQuantity) ||
      requestedQuantity < 1 ||
      requestedQuantity > 2_147_483_647 ||
      (product.quantity !== undefined && requestedQuantity > product.quantity)
    ) {
      setError(
        product.quantity !== undefined &&
          requestedQuantity > product.quantity
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
          deliveryAddress,
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
        throw new Error(result.message ?? "The order could not be saved.");
      }

      setOrderReference(result.orderReference);
      setPurchasedAt(result.purchasedAt);
      onPurchaseSuccess?.(product.id, requestedQuantity);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The order could not be saved. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center bg-slate-950/70 p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
              Purchase request
            </p>
            <h2
              id="checkout-title"
              className="mt-1 text-2xl font-semibold text-slate-900"
            >
              {orderReference ? "Request sent" : "Classroom delivery"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            aria-label="Close checkout"
          >
            Close
          </button>
        </div>

        {orderReference ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="font-semibold text-emerald-900">
              Your request to buy {product.name} was saved successfully.
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Order reference: {orderReference}
            </p>
            <p className="mt-1 text-sm text-emerald-800">
              Date purchased: {new Date(purchasedAt).toLocaleString()}
            </p>
            <p className="mt-3 text-sm text-emerald-800">
              The marketing admin will review your request. No payment was
              collected.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Continue browsing
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="font-semibold text-slate-900">{product.name}</p>
                <p className="mt-1 text-sm text-slate-500">{product.fitsFor}</p>
              </div>
              <p className="text-lg font-semibold text-orange-600">
                {formatMntPrice(
                  parseMntAmount(product.price) *
                    (Number.isSafeInteger(Number(quantity)) &&
                    Number(quantity) > 0
                      ? Number(quantity)
                      : 0),
                )}
              </p>
            </div>

            <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                <div className="grid gap-2">
                  <label
                    htmlFor="purchase-quantity"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Quantity
                  </label>
                  <QuantityInput
                    id="purchase-quantity"
                    min={1}
                    max={product.quantity}
                    value={quantity}
                    onChange={setQuantity}
                    ariaLabel="Purchase quantity"
                  />
                </div>
                <input
                  required
                  autoComplete="name"
                  value={deliveryAddress.recipient}
                  onChange={(event) =>
                    handleAddressChange("recipient", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Student name"
                  aria-label="Student name"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    value={deliveryAddress.classNumber}
                    onChange={(event) =>
                      handleAddressChange("classNumber", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="Class (e.g. 10B)"
                    aria-label="Class number"
                    pattern="\s*(?:[1-9]|1[0-2])[A-Da-d]\s*"
                    title="Enter a class from 1A to 12D, such as 10B."
                  />
                  <input
                    value={deliveryAddress.roomNumber}
                    onChange={(event) =>
                      handleAddressChange("roomNumber", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="Room number (e.g. 204, optional if floor is entered)"
                    aria-label="Room number (optional if building or floor is entered)"
                  />
                </div>
                <input
                  required={!deliveryAddress.roomNumber.trim()}
                  value={deliveryAddress.building}
                  onChange={(event) =>
                    handleAddressChange("building", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="1-4"
                  aria-label="Floor (required if room number is empty)"
                  pattern="[1-4]"
                  title="Enter a floor number from 1 to 4."
                />
                <textarea
                  value={deliveryAddress.instructions}
                  onChange={(event) =>
                    handleAddressChange("instructions", event.target.value)
                  }
                  className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Notes, e.g. leave with the class teacher (optional)"
                  aria-label="Delivery notes"
                />
                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <p>{error}</p>
                    {error.includes("Sign in before placing an order") ? (
                      <Link
                        href="/#account"
                        className="mt-2 inline-flex font-semibold underline underline-offset-2"
                      >
                        Sign in to your account
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    Your request will be saved for the marketing admin to review.
                    No payment is taken here.
                  </p>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400"
                  >
                    {isSaving ? "Saving request..." : "Place order request"}
                  </button>
                </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
