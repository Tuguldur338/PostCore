import type { Product } from "./types";

const productsStorageKey = "postcore-student-items";

export function readProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    if (raw === null) return [];

    const products = JSON.parse(raw) as unknown;
    return Array.isArray(products) ? (products as Product[]) : [];
  } catch {
    return [];
  }
}

export async function fetchSharedProducts(): Promise<Product[]> {
  const response = await fetch("/api/products", { cache: "no-store" });
  const result = (await response.json()) as {
    message?: string;
    products?: Product[];
  };

  if (!response.ok) {
    throw new Error(result.message ?? "Products could not be loaded.");
  }
  if (!Array.isArray(result.products)) {
    throw new Error("The product catalog response was invalid.");
  }

  return result.products;
}
