"use client";

import { useState, type ReactNode } from "react";
import { CheckoutDialog } from "@/components/checkout";
import { ProductCard } from "@/components/product-card";
import { ProductDialog } from "@/components/product-dialog";
import type { Product } from "@/components/types";

type ProductGridProps = {
  products: Product[];
  onStockChanged?: () => void;
  onPurchaseSuccess?: (productId: string, quantity: number) => void;
  renderFooter?: (product: Product) => ReactNode;
  emptyState?: ReactNode;
  extraCard?: ReactNode;
  className?: string;
};

export function ProductGrid({
  products,
  onStockChanged,
  onPurchaseSuccess,
  renderFooter,
  emptyState,
  extraCard,
  className = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4",
}: ProductGridProps) {
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  return (
    <>
      {products.length === 0 ? (
        emptyState
      ) : (
        <div className={className}>
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={setInspectedProduct}
              priority={index < 3}
              footer={renderFooter?.(product)}
            />
          ))}
          {extraCard}
        </div>
      )}

      <ProductDialog
        product={inspectedProduct}
        onClose={() => setInspectedProduct(null)}
        onBuy={(product) => {
          setInspectedProduct(null);
          setCheckoutProduct(product);
        }}
      />

      {checkoutProduct ? (
        <CheckoutDialog
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onStockChanged={onStockChanged}
          onPurchaseSuccess={(productId, quantity) => {
            onPurchaseSuccess?.(productId, quantity);
          }}
        />
      ) : null}
    </>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.4rem] border border-line bg-surface"
        >
          <div className="skeleton aspect-[4/3]" />
          <div className="space-y-2.5 p-4">
            <div className="skeleton h-2.5 w-1/3 rounded-full" />
            <div className="skeleton h-4 w-3/4 rounded-full" />
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-2/3 rounded-full" />
            <div className="flex items-center justify-between pt-3">
              <div className="skeleton h-6 w-24 rounded-full" />
              <div className="skeleton h-9 w-9 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
