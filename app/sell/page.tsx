"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
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

const productsStorageKey = "postcore-cases";
const sessionKey = "postcore-current-user";
const usersStorageKey = "postcore-users";

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

function readProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    return raw ? (JSON.parse(raw) as Product[]) : [];
  } catch {
    return [];
  }
}

function writeProducts(products: Product[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
}

function readUsers(): User[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(usersStorageKey);
    return raw ? (JSON.parse(raw) as User[]) : [];
  } catch {
    return [];
  }
}

export default function SellPage() {
  const [productForm, setProductForm] =
    useState<ProductFormState>(emptyProductForm);
  const [status, setStatus] = useState("Add a phone case to start selling.");
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSession = window.localStorage.getItem(sessionKey);
    if (savedSession) {
      try {
        const parsedUser = JSON.parse(savedSession) as User;
        const users = readUsers();
        const matchedUser = users.find((user) => user.id === parsedUser.id);
        setCurrentUser(matchedUser ?? parsedUser);
      } catch {
        window.localStorage.removeItem(sessionKey);
      }
    }
  }, []);

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setProductForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProductForm((previous) => ({ ...previous, image: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageData = reader.result as string;
      setProductForm((previous) => ({ ...previous, image: imageData }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser) {
      setStatus("Please create an account or sign in before adding a product.");
      return;
    }

    if (!productForm.name.trim() || !productForm.price.trim()) {
      setStatus("Please add a product name and price.");
      return;
    }

    if (!productForm.image) {
      setStatus("Please upload a product image before adding the listing.");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productForm.name.trim(),
      price: productForm.price.trim(),
      badge: "New",
      description:
        productForm.description.trim() || "A fresh design ready to ship.",
      image: productForm.image,
      category: productForm.category.trim() || "Phone case",
      fitsFor: productForm.fitsFor.trim() || "Most phones",
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

    const nextProducts = [productWithDelivery, ...readProducts()];
    writeProducts(nextProducts);
    setProductForm(emptyProductForm);
    setStatus(`${newProduct.name} was added to your sell list.`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_30%),linear-gradient(135deg,#f7f9fc_0%,#eef2f7_100%)] p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex max-w-6xl flex-col gap-6">
        <Header />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
              Sell a product
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">
              Add a new phone case listing
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Signed-in sellers can add a new listing here. Guests can browse
              and buy, but they cannot publish products.
            </p>
          </div>

          {!currentUser ? (
            <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-700">
              Create an account or sign in from the Account page to add a
              product for sale.
            </div>
          ) : null}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={productForm.name}
                onChange={(event) =>
                  handleInputChange("name", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                placeholder="Case name"
              />
              <input
                value={productForm.price}
                onChange={(event) =>
                  handleInputChange("price", event.target.value)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                placeholder="Price"
              />
            </div>

            <textarea
              value={productForm.description}
              onChange={(event) =>
                handleInputChange("description", event.target.value)
              }
              className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
              placeholder="Describe the case"
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
              />
              <p className="mt-2 text-xs text-slate-500">
                A photo is required for every listing.
              </p>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Delivery details
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Help buyers know where to pick up or where the item can be sent.
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
                disabled={!currentUser}
                className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {currentUser ? "Add product" : "Sign in to sell"}
              </button>
            </div>
          </form>
        </section>

        <Footer />
      </main>
    </div>
  );
}
