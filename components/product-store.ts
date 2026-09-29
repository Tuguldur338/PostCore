import type { Product } from "./types";

const productsStorageKey = "postcore-student-items";

export const seedProducts: Product[] = [
  {
    id: "seed-1",
    name: "Campus Notes Pack",
    price: "12990",
    badge: "New",
    description:
      "A ready-to-go study set with notebook pages, tabs, and extras.",
    image: "/images/student/campus-notes.svg",
    category: "School Supplies",
    fitsFor: "Class notes / study sessions",
  },
  {
    id: "seed-2",
    name: "Snack Box Bundle",
    price: "18500",
    badge: "Best seller",
    description:
      "A mix of student-friendly snacks for late nights and long study days.",
    image: "/images/student/snack-box.svg",
    category: "Snacks",
    fitsFor: "Dorms / study breaks / campus life",
  },
];

export function readProducts(): Product[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(productsStorageKey);
    if (raw === null) return seedProducts;

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
