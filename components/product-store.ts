import type { Product } from "./types";

const productsStorageKey = "postcore-cases";

export const seedProducts: Product[] = [
  {
    id: "seed-1",
    name: "Arctic Frost",
    price: "$24.99",
    badge: "New",
    description: "A frosted finish that stays slim and feels premium in hand.",
    image: "/images/cases/arctic-frost.svg",
    category: "Slim",
    fitsFor: "iPhone 15 / Galaxy S24",
  },
  {
    id: "seed-2",
    name: "Carbon Edge",
    price: "$29.99",
    badge: "Best seller",
    description:
      "Shock-resistant protection with a sleek matte carbon texture.",
    image: "/images/cases/carbon-edge.svg",
    category: "Protective",
    fitsFor: "iPhone 14 Pro / Pixel 8",
  },
];

export function readProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    if (!raw) return [];

    const products = JSON.parse(raw) as unknown;
    return Array.isArray(products) ? (products as Product[]) : [];
  } catch {
    return [];
  }
}

export function writeProducts(products: Product[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(productsStorageKey, JSON.stringify(products));
    return true;
  } catch {
    return false;
  }
}
