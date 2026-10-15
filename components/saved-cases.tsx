"use client";

import { useEffect, useState } from "react";
import { Catalog } from "@/components/catalog";
import { fetchSharedProducts } from "@/components/product-store";
import type { Product } from "@/components/types";

export function SavedItems() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;
    void fetchSharedProducts()
      .then((sharedProducts) => {
        if (!isActive) return;
        setProducts(sharedProducts);
      })
      .catch((loadError: unknown) => {
        if (isActive) {
          setError(
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

  return (
    <>
      {error ? (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Catalog
        products={products}
        initialView="saved"
        showViewSwitch={false}
        onPurchaseSuccess={() => {
          void fetchSharedProducts()
            .then(setProducts)
            .catch((loadError: unknown) => {
              setError(
                loadError instanceof Error
                  ? loadError.message
                  : "The product catalog could not be refreshed.",
              );
            });
        }}
      />
    </>
  );
}
