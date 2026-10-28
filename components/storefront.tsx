"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSharedProducts } from "@/components/product-store";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { SellerCta } from "@/components/home/seller-cta";
import { Ticker } from "@/components/home/ticker";
import { TrustStrip } from "@/components/home/trust-strip";
import { isUnavailable } from "@/lib/catalog";
import type { Product } from "@/components/types";

export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProducts = async (showSkeleton = false) => {
    if (showSkeleton) setIsLoading(true);
    try {
      const sharedProducts = await fetchSharedProducts();
      setProducts(sharedProducts);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The marketplace could not be loaded.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchSharedProducts()
      .then((sharedProducts) => {
        if (!active) return;
        setProducts(sharedProducts);
        setError("");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "The marketplace could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const availableProducts = useMemo(
    () => products.filter((product) => !isUnavailable(product)),
    [products],
  );

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      <div className="flex flex-col gap-8">
        <Hero featured={availableProducts[0]} isLoading={isLoading} />
        <Ticker />
      </div>
      <CategoryGrid products={availableProducts} isLoading={isLoading} />
      <FeaturedProducts
        products={availableProducts}
        isLoading={isLoading}
        error={error}
        onRetry={() => void loadProducts()}
      />
      <HowItWorks />
      <SellerCta />
      <TrustStrip />
    </div>
  );
}
