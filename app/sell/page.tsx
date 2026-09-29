"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { restoreUserSession } from "@/components/auth-store";
import { parseMntAmount } from "@/components/currency";
import { readProducts, writeProducts } from "@/components/product-store";
import type { Product, User } from "@/components/types";

type ProductFormState = {
  name: string;
  price: string;
  description: string;
  category: string;
  fitsFor: string;
  image: string;
  deliveryLocation: string;
  deliveryCountry: string;
  deliveryMethod: string;
};

const maxImageDimension = 1280;
const maxImageDataUrlLength = 220_000;

const emptyProductForm: ProductFormState = {
  name: "",
  price: "",
  description: "",
  category: "",
  fitsFor: "",
  image: "",
  deliveryLocation: "",
  deliveryCountry: "",
  deliveryMethod: "",
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

        for (let resizeAttempt = 0; resizeAttempt < 6; resizeAttempt += 1) {
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

          const context = canvas.getContext("2d");
          if (!context) throw new Error("Image compression is unavailable.");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          for (const quality of [0.8, 0.68, 0.55]) {
            compressedImage = canvas.toDataURL("image/webp", quality);
            if (compressedImage.length <= maxImageDataUrlLength) {
              resolve(compressedImage);
              return;
            }
          }

          scale *= 0.75;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const session = restoreUserSession();
    queueMicrotask(() => {
      setCurrentUser(session?.user ?? null);
      setIsSessionReady(true);
    });
  }, []);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setProductForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageSelect = async (event: ChangeEvent<HTMLInputElement>) => {
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

    if (currentUser?.role !== "admin") {
      setStatus("Only the marketplace admin can add product listings.");
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

    if (!productForm.image) {
      setStatus("Please upload a product image before adding the listing.");
      return;
    }

    setIsSaving(true);

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productForm.name.trim(),
      price: String(priceAmount),
      badge: "New",
      description:
        productForm.description.trim() || "A fresh design ready to ship.",
      image: productForm.image,
      category: productForm.category.trim() || "School Supplies",
      fitsFor: productForm.fitsFor.trim() || "Campus life",
      sellerEmail: currentUser.email.trim().toLowerCase(),
    };

    const deliveryNote = [
      productForm.deliveryLocation.trim() &&
        `Drop-off: ${productForm.deliveryLocation.trim()}`,
      productForm.deliveryCountry.trim() &&
        `Delivery country: ${productForm.deliveryCountry.trim()}`,
      productForm.deliveryMethod.trim() &&
        `Method: ${productForm.deliveryMethod.trim()}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const productWithDelivery = {
      ...newProduct,
      description: deliveryNote
        ? `${newProduct.description}\n\nDelivery details: ${deliveryNote}`
        : newProduct.description,
    };

    try {
      const existingProducts = await Promise.all(
        readProducts().map(async (product) => ({
          ...product,
          image: product.image.startsWith("data:")
            ? await compressImage(product.image)
            : product.image,
        })),
      );
      const nextProducts = [productWithDelivery, ...existingProducts];

      if (!writeProducts(nextProducts)) {
        setStatus(
          "Browser storage is full. Try a smaller photo or remove older listings.",
        );
        return;
      }

      setProductForm(emptyProductForm);
      setStatus(`${newProduct.name} was added to your sell list.`);
    } catch {
      setStatus("The listing could not be saved. Try a smaller photo.");
    } finally {
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
          ) : !currentUser ? (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              Create an account or sign in from the Account page. The first
              account to sign in becomes the marketplace admin.
            </div>
          ) : currentUser.role !== "admin" ? (
            <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
              Your account is a student account. Only the first account to sign
              in as the marketplace admin can create listings.
            </div>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  value={productForm.name}
                  onChange={(event) =>
                    handleInputChange("name", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                  placeholder="Item name"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={productForm.price}
                  onChange={(event) =>
                    handleInputChange("price", event.target.value)
                  }
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                  placeholder="Price in MNT (₮)"
                />
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
                  A photo is required. Large photos are optimized before saving.
                </p>
              </label>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700">
                  Delivery details
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Help buyers know where to pick up or where the item can be
                  sent.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <input
                    value={productForm.deliveryLocation}
                    onChange={(event) =>
                      handleInputChange("deliveryLocation", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    placeholder="Drop-off location"
                  />
                  <input
                    value={productForm.deliveryCountry}
                    onChange={(event) =>
                      handleInputChange("deliveryCountry", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    placeholder="Country"
                  />
                  <input
                    value={productForm.deliveryMethod}
                    onChange={(event) =>
                      handleInputChange("deliveryMethod", event.target.value)
                    }
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none"
                    placeholder="Mailbox / courier / pickup"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">{status}</p>
                <button
                  type="submit"
                  disabled={!currentUser || isCompressingImage || isSaving}
                  className="smooth-transition rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {!currentUser
                    ? "Sign in to sell"
                    : isCompressingImage
                      ? "Optimizing photo..."
                      : isSaving
                        ? "Saving..."
                        : "Add product"}
                </button>
              </div>
            </form>
          )}
        </section>

        <Footer />
      </main>
    </div>
  );
}
