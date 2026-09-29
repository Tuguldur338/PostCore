"use client";

import { useEffect, useState, type FormEvent } from "react";
import { formatMntPrice } from "./currency";
import type { DeliveryAddress, Product } from "./types";

const sessionStorageKey = "postcore-current-user";

const emptyDeliveryAddress: DeliveryAddress = {
  recipient: "",
  street: "",
  apartment: "",
  city: "",
  region: "",
  postalCode: "",
  country: "",
  instructions: "",
};

type EmailNotificationResponse = {
  message?: string;
  sent?: boolean;
};

type CheckoutDialogProps = {
  product: Product;
  onClose: () => void;
};

export function CheckoutDialog({ product, onClose }: CheckoutDialogProps) {
  const [deliveryAddress, setDeliveryAddress] =
    useState<DeliveryAddress>(emptyDeliveryAddress);
  const [orderReference, setOrderReference] = useState("");
  const [emailDraftUrl, setEmailDraftUrl] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);

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

  const createEmailDraftUrl = (requestReference: string) => {
    const addressLines = [
      deliveryAddress.recipient,
      deliveryAddress.street,
      deliveryAddress.apartment,
      `${deliveryAddress.city}, ${deliveryAddress.region} ${deliveryAddress.postalCode}`,
      deliveryAddress.country,
      deliveryAddress.instructions,
    ].filter(Boolean);
    const subject = `Purchase request: ${product.name}`;
    const body = [
      `Hello, I would like to buy ${product.name}.`,
      `Price: ${formatMntPrice(product.price)}`,
      `Order reference: ${requestReference}`,
      "",
      "Delivery details:",
      ...addressLines,
    ].join("\n");
    const recipient = product.sellerEmail?.trim();
    if (!recipient) return "";

    return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setEmailDraftUrl("");

    if (!product.sellerEmail?.trim()) {
      setError("This listing does not have seller contact details yet.");
      return;
    }

    setIsSending(true);
    const requestReference = crypto.randomUUID().slice(0, 8).toUpperCase();
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderReference: requestReference,
          productName: product.name,
          price: formatMntPrice(product.price),
          sellerEmail: product.sellerEmail,
          placedAt: new Date().toISOString(),
          deliveryAddress,
        }),
      });
      const result = (await response.json()) as EmailNotificationResponse;
      if (!response.ok || result.sent !== true) {
        setEmailDraftUrl(createEmailDraftUrl(requestReference));
        setError(
          `${result.message ?? "The seller email could not be sent."} You can open a draft below and send it yourself.`,
        );
        return;
      }

      setOrderReference(requestReference);
    } catch {
      setEmailDraftUrl(createEmailDraftUrl(requestReference));
      setError(
        "The email service could not be reached. You can open a draft below and send it yourself.",
      );
    } finally {
      setIsSending(false);
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
              {orderReference ? "Request sent" : "Delivery details"}
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
              Your request to buy {product.name} was emailed to the seller.
            </p>
            <p className="mt-2 text-sm text-emerald-800">
              Order reference: {orderReference}
            </p>
            <p className="mt-3 text-sm text-emerald-800">
              The seller will follow up with you. No payment was collected.
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
                {formatMntPrice(product.price)}
              </p>
            </div>

            {!product.sellerEmail ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                This sample listing has no seller contact, so it cannot accept
                purchase requests yet.
              </div>
            ) : (
              <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
                <input
                  required
                  autoComplete="name"
                  value={deliveryAddress.recipient}
                  onChange={(event) =>
                    handleAddressChange("recipient", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Name on the package"
                  aria-label="Name on the package"
                />
                <input
                  required
                  autoComplete="street-address"
                  value={deliveryAddress.street}
                  onChange={(event) =>
                    handleAddressChange("street", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Street address"
                  aria-label="Street address"
                />
                <input
                  autoComplete="address-line2"
                  value={deliveryAddress.apartment}
                  onChange={(event) =>
                    handleAddressChange("apartment", event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Apartment, suite, etc. (optional)"
                  aria-label="Apartment, suite, or unit"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    autoComplete="address-level2"
                    value={deliveryAddress.city}
                    onChange={(event) =>
                      handleAddressChange("city", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="City"
                    aria-label="City"
                  />
                  <input
                    required
                    autoComplete="address-level1"
                    value={deliveryAddress.region}
                    onChange={(event) =>
                      handleAddressChange("region", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="State / province"
                    aria-label="State or province"
                  />
                  <input
                    required
                    autoComplete="postal-code"
                    value={deliveryAddress.postalCode}
                    onChange={(event) =>
                      handleAddressChange("postalCode", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="Postal code"
                    aria-label="Postal code"
                  />
                  <input
                    required
                    autoComplete="country-name"
                    value={deliveryAddress.country}
                    onChange={(event) =>
                      handleAddressChange("country", event.target.value)
                    }
                    className="min-w-0 rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                    placeholder="Country"
                    aria-label="Country"
                  />
                </div>
                <textarea
                  value={deliveryAddress.instructions}
                  onChange={(event) =>
                    handleAddressChange("instructions", event.target.value)
                  }
                  className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition-colors focus:border-orange-400"
                  placeholder="Delivery instructions (optional)"
                  aria-label="Delivery instructions"
                />
                {error ? (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    <p>{error}</p>
                    {emailDraftUrl ? (
                      <a
                        href={emailDraftUrl}
                        className="mt-2 inline-block font-semibold underline"
                      >
                        Open email draft
                      </a>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-500">
                    A successful request is emailed to the seller. No payment is
                    taken here.
                  </p>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400"
                  >
                    {isSending ? "Sending request..." : "Send purchase request"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
