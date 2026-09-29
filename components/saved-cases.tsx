"use client";

import { useEffect, useState } from "react";
import { Catalog } from "@/components/catalog";
import { readProducts, seedProducts } from "@/components/product-store";
import type { Product } from "@/components/types";

export function SavedItems() {
  const [products, setProducts] = useState<Product[]>(seedProducts);

  useEffect(() => {
    queueMicrotask(() => {
      setProducts(readProducts());
    });
  }, []);

  return (
    <Catalog products={products} initialView="saved" showViewSwitch={false} />
  );
}
