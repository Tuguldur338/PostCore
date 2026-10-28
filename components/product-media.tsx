"use client";

import Image from "next/image";
import { useState } from "react";
import { getCategoryArt } from "@/lib/catalog";
import type { Product } from "@/components/types";

type ProductImageProps = {
  product: Product;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export function ProductImage({
  product,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority = false,
  className = "",
}: ProductImageProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const failed = !product.image || failedImage === product.image;

  return (
    <Image
      src={failed ? getCategoryArt(product.category) : product.image}
      alt={product.name}
      fill
      unoptimized
      priority={priority}
      sizes={sizes}
      onError={() => setFailedImage(product.image)}
      className={`object-cover ${className}`}
    />
  );
}
