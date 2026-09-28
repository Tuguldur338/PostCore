"use client";

import { useEffect, useState } from "react";
import { Catalog } from "@/components/catalog";
import { readProducts, seedProducts } from "@/components/product-store";
import type { Product } from "@/components/types";

export function SavedCases() {
  const [products, setProducts] = useState<Product[]>(seedProducts);

  useEffect(() => {
    queueMicrotask(() => {
      const savedProducts = readProducts();
      if (savedProducts.length > 0) setProducts(savedProducts);
    });
  }, []);

  return (
    <Catalog products={products} initialView="saved" showViewSwitch={false} />
  );
}
