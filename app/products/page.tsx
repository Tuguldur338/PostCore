"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Catalog } from "@/components/catalog";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { fetchSharedProducts } from "@/components/product-store";
import type { Product } from "@/components/types";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [canManageListings, setCanManageListings] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let isActive = true;
    void Promise.all([
      fetchSharedProducts(),
      fetch("/api/admin/products", { cache: "no-store" }),
    ])
      .then(async ([sharedProducts, adminResponse]) => {
        const adminResult = (await adminResponse.json()) as {
          message?: string;
          authorized?: boolean;
        };
        if (!isActive) return;
        setProducts(sharedProducts);
        setCanManageListings(adminResponse.ok && adminResult.authorized === true);
        if (!adminResponse.ok && adminResponse.status !== 401 && adminResponse.status !== 403) {
          setStatus(adminResult.message ?? "Admin access could not be checked.");
        }
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setStatus(
            loadError instanceof Error
              ? loadError.message
              : "The product catalog could not be loaded.",
          );
        }
      });
    return () => {
      isActive = false;
    };
  }, []);

  const reloadProducts = async () => {
    setProducts(await fetchSharedProducts());
  };

  const updateInventory = async (change: {
    id: string;
    quantity?: number;
    outOfStock?: boolean;
  }) => {
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "Inventory could not be updated.");
      }
      await reloadProducts();
      setStatus("Inventory updated.");
    } catch (updateError) {
      setStatus(
        updateError instanceof Error
          ? updateError.message
          : "Inventory could not be updated.",
      );
    }
  };

  const handleAvailabilityChange = (productId: string, outOfStock: boolean) =>
    void updateInventory({ id: productId, outOfStock });

  const handleQuantityChange = (productId: string, quantity: number) =>
    void updateInventory({ id: productId, quantity });

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
          onQuantityChange={handleQuantityChange}
          onProductRemoved={() => {
            void reloadProducts().catch((loadError: unknown) => {
              setStatus(
                loadError instanceof Error
                  ? loadError.message
                  : "The catalog could not be refreshed.",
              );
            });
            setStatus("Product removed.");
          }}
          onPurchaseSuccess={() => {
            void reloadProducts().catch((loadError: unknown) => {
              setStatus(
                loadError instanceof Error
                  ? loadError.message
                  : "The catalog could not be refreshed.",
              );
            });
          }}
          onStockChanged={() => {
            void reloadProducts().catch((loadError: unknown) => {
              setStatus(
                loadError instanceof Error
                  ? loadError.message
                  : "The catalog could not be refreshed.",
              );
            });
          }}
        />
        <Footer />
      </main>
    </div>
  );
}
