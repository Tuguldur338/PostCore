"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { parseMntAmount } from "@/components/currency";
import { maxProductImageDataUrlLength } from "@/components/product-image";
import { QuantityInput } from "@/components/quantity-input";
import type { Product } from "@/components/types";

type ProductFormState = {
  name: string;
  price: string;
  quantity: string;
  description: string;
  category: string;
  fitsFor: string;
  image: string;
  pickupClass: string;
  pickupRoom: string;
  pickupMethod: string;
};

const maxImageDimension = 1600;

const emptyProductForm: ProductFormState = {
  name: "",
  price: "",
  quantity: "1",
  description: "",
  category: "",
  fitsFor: "",
  image: "",
  pickupClass: "",
  pickupRoom: "",
  pickupMethod: "",
};

function compressImage(source: Blob | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const shouldRevokeUrl = typeof source !== "string";
    const imageSource =
      typeof source === "string" ? source : URL.createObjectURL(source);
    const image = new window.Image();

    const releaseSource = () => {
      if (shouldRevokeUrl) URL.revokeObjectURL(imageSource);
    };

    image.onload = () => {
      try {
        const largestDimension = Math.max(
          image.naturalWidth,
          image.naturalHeight,
        );
        let scale = Math.min(1, maxImageDimension / largestDimension);
        let compressedImage = "";

        for (let resizeAttempt = 0; resizeAttempt < 4; resizeAttempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image compression is unavailable.");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54]) {
            compressedImage = canvas.toDataURL("image/webp", quality);
            if (compressedImage.length <= maxProductImageDataUrlLength) {
              resolve(compressedImage);
              return;
            }
          }

          scale *= 0.85;
        }

        throw new Error("Image is too large to store.");
      } catch (error) {
        reject(error);
      } finally {
        releaseSource();
      }
    };

    image.onerror = () => {
      releaseSource();
      reject(new Error("This image could not be processed."));
    };
    image.src = imageSource;
  });
}

export default function SellPage() {
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [status, setStatus] = useState("Add an item to start selling.");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isSubmitting = useRef(false);
  const pendingProductId = useRef<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const verifyAdmin = async () => {
      try {
        const response = await fetch("/api/admin/products", {
          cache: "no-store",
        });
        const result = (await response.json()) as {
          message?: string;
          authorized?: boolean;
        };
        if (!response.ok || result.authorized !== true) {
          if (isActive && response.status !== 401 && response.status !== 403) {
            setStatus(result.message ?? "Admin access could not be checked.");
          }
          return;
        }

        if (!isActive) return;
        setIsAdmin(true);
      } catch (error) {
        if (isActive) {
          setStatus(
            error instanceof Error
              ? error.message
              : "The product catalog could not be prepared.",
          );
        }
      } finally {
        if (isActive) setIsSessionReady(true);
      }
    };

    void verifyAdmin();
    return () => {
      isActive = false;
    };
  }, []);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    if (!isSubmitting.current) pendingProductId.current = null;
    setProductForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!isSubmitting.current) pendingProductId.current = null;
    const file = event.target.files?.[0];
    if (!file) {
      setProductForm((previous) => ({ ...previous, image: "" }));
      return;
    }

    setIsCompressingImage(true);
    setStatus("Optimizing photo for storage...");
    try {
      const imageData = await compressImage(file);
      setProductForm((previous) => ({ ...previous, image: imageData }));
      setStatus("Photo ready to add.");
    } catch {
      setProductForm((previous) => ({ ...previous, image: "" }));
      setStatus("This photo could not be optimized. Try another image.");
    } finally {
      setIsCompressingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting.current) return;

    if (!isAdmin) {
      setStatus(
        "Sign in with the marketing admin account before adding listings.",
      );
      return;
    }

    const priceAmount = parseMntAmount(productForm.price);
    if (
      !productForm.name.trim() ||
      !Number.isSafeInteger(priceAmount) ||
      priceAmount <= 0
    ) {
      setStatus("Please add a product name and a valid whole price in MNT.");
      return;
    }

    const quantity = Number(productForm.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setStatus("Please enter how many items you have to sell (1 or more).");
      return;
    }

    if (!productForm.image) {
      setStatus("Please upload a product image before adding the listing.");
      return;
    }

    isSubmitting.current = true;
    setIsSaving(true);
    if (pendingProductId.current === null) {
      pendingProductId.current = crypto.randomUUID();
    }

    const newProduct: Product = {
      id: pendingProductId.current,
      name: productForm.name.trim(),
      price: String(priceAmount),
      badge: "New",
      description:
        productForm.description.trim() || "A fresh design ready to ship.",
      image: productForm.image,
      category: productForm.category.trim() || "School Supplies",
      fitsFor: productForm.fitsFor.trim() || "Campus life",
      pickupClass: productForm.pickupClass.trim(),
      pickupRoom: productForm.pickupRoom.trim(),
      pickupMethod: productForm.pickupMethod.trim(),
      quantity,
    };

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "The listing could not be saved.");
      }
      pendingProductId.current = null;
      setProductForm(emptyProductForm);
      setStatus(`${newProduct.name} was added to your sell list.`);
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : "The listing could not be saved. Try a smaller photo.",
      );
    } finally {
      isSubmitting.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="site-shell min-h-screen p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <Header />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              Sell a product
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Add a new student item listing
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The marketplace admin can add listings here. Other students can
              browse and buy, but cannot publish items.
            </p>
          </div>

          {!isSessionReady ? (
            <p className="mt-6 text-sm text-slate-600">Checking account...</p>
          ) : !isAdmin ? (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              Sign in with the Supabase marketing admin account to manage shared
              listings.{" "}
              <Link className="font-semibold underline" href="/orders">
                Open admin sign-in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <fieldset disabled={isSaving} className="mt-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    value={productForm.name}
                    onChange={(event) =>
                      handleInputChange("name", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                    placeholder="Item name"
                  />

                  <div className="grid gap-2">
                    <label
                      htmlFor="listing-price"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Price (MNT)
                    </label>

                    <QuantityInput
                      id="listing-price"
                      min={1}
                      value={productForm.price}
                      onChange={(value) => handleInputChange("price", value)}
                      disabled={isSaving}
                      ariaLabel="Price in MNT"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label
                      htmlFor="listing-quantity"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Quantity
                    </label>

                    <QuantityInput
                      id="listing-quantity"
                      min={1}
                      value={productForm.quantity}
                      onChange={(value) => handleInputChange("quantity", value)}
                      disabled={isSaving}
                      ariaLabel="Listing quantity"
                    />
                  </div>
                </div>

                <textarea
                  value={productForm.description}
                  onChange={(event) =>
                    handleInputChange("description", event.target.value)
                  }
                  className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                  placeholder="Describe the item"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    value={productForm.category}
                    onChange={(event) =>
                      handleInputChange("category", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                    placeholder="Category"
                  />
                  <input
                    value={productForm.fitsFor}
                    onChange={(event) =>
                      handleInputChange("fitsFor", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                    placeholder="Fits for"
                  />
                </div>

                <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  <span className="mb-2 block font-semibold text-slate-700">
                    Upload product image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full text-sm"
                    disabled={isCompressingImage || isSaving}
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    A photo is required. Large photos are optimized before
                    saving.
                  </p>
                </label>

                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    Pickup details
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    Buyers use these details to arrange collection with you.
                    Don&apos;t enter a home address or other private location.
                  </p>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <input
                      value={productForm.pickupClass}
                      onChange={(event) =>
                        handleInputChange("pickupClass", event.target.value)
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                      placeholder="Pickup class (e.g. 10B)"
                      pattern="\s*(?:[1-9]|1[0-2])[A-Da-d]\s*"
                      title="Enter a class from 1A to 12D, such as 10B."
                    />
                    <input
                      value={productForm.pickupRoom}
                      onChange={(event) =>
                        handleInputChange("pickupRoom", event.target.value)
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                      placeholder="Pickup room (optional)"
                    />
                    <input
                      value={productForm.pickupMethod}
                      onChange={(event) =>
                        handleInputChange("pickupMethod", event.target.value)
                      }
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                      placeholder="Where/how to meet (optional)"
                      maxLength={160}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">{status}</p>
                  <button
                    type="submit"
                    disabled={!isAdmin || isCompressingImage || isSaving}
                    className="smooth-transition rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isCompressingImage
                      ? "Optimizing photo..."
                      : isSaving
                        ? "Saving..."
                        : "Add product"}
                  </button>
                </div>
              </fieldset>
            </form>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
}
