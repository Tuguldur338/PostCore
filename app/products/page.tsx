"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { restoreUserSession } from "@/components/auth-store";
import { Catalog } from "@/components/catalog";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { readProducts, writeProducts } from "@/components/product-store";
import type { Product } from "@/components/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [canManageListings, setCanManageListings] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    queueMicrotask(() => {
      const session = restoreUserSession();
      setCanManageListings(session?.user.role === "admin");
      setProducts(readProducts());
    });
  }, []);

  const saveProducts = (nextProducts: Product[]) => {
    if (!writeProducts(nextProducts)) {
      setStatus(
        "Could not save the inventory change. Browser storage may be full.",
      );
      return;
    }

    setProducts(nextProducts);
    setStatus("Inventory updated.");
  };

  const handleAvailabilityChange = (productId: string, outOfStock: boolean) => {
    saveProducts(
      products.map((product) =>
        product.id === productId ? { ...product, outOfStock } : product,
      ),
    );
  };

  const handleRemoveProduct = (productId: string) => {
    const product = products.find((item) => item.id === productId);
    if (
      !product ||
      !window.confirm(`Remove ${product.name} from the catalog?`)
    ) {
      return;
    }

    saveProducts(products.filter((item) => item.id !== productId));
  };

  return (
    <div className="site-shell min-h-screen p-4 text-slate-800 sm:p-6 lg:p-8">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <Header />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-500">
                Products
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Your student essentials listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                Browse, search, save, and share the school supplies and snacks
                currently in your PostCore catalog.
              </p>
            </div>
            <Link
              href="/sell"
              className="smooth-transition inline-flex w-fit rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-400"
            >
              Add a product
            </Link>
          </div>
          {status ? (
            <p role="status" className="mt-4 text-sm text-slate-600">
              {status}
            </p>
          ) : null}
        </section>

        <Catalog
          products={products}
          canManageListings={canManageListings}
          onAvailabilityChange={handleAvailabilityChange}
          onRemoveProduct={handleRemoveProduct}
        />
        <Footer />
      </main>
    </div>
  );
}
