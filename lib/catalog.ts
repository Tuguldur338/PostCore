import { parseMntAmount } from "@/components/currency";
import type { Product } from "@/components/types";

export type SortKey = "featured" | "price" | "price-desc" | "name";

export const categorySuggestions = [
  "School Supplies",
  "Snacks",
  "Study Tools",
  "Tech & Cases",
  "Art & Design",
  "Everyday Essentials",
];

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A to Z" },
];

type CategoryArt = {
  art: string;
  blurb: string;
  keywords: string[];
};

const categoryArtworks: CategoryArt[] = [
  {
    art: "/images/categories/snacks.svg",
    blurb: "Fuel for long study days.",
    keywords: ["snack", "food", "drink", "candy", "lunch", "dorm"],
  },
  {
    art: "/images/categories/tech.svg",
    blurb: "Cases, cables, and campus tech.",
    keywords: ["tech", "phone", "case", "audio", "charger", "cable", "device"],
  },
  {
    art: "/images/categories/art.svg",
    blurb: "Supplies for making things.",
    keywords: ["art", "design", "craft", "paint", "draw", "sketch"],
  },
  {
    art: "/images/categories/study.svg",
    blurb: "Tools that make revision click.",
    keywords: ["study", "tool", "flashcard", "revision", "calculator"],
  },
  {
    art: "/images/categories/stationery.svg",
    blurb: "Notes, pens, and paper things.",
    keywords: [
      "school",
      "supply",
      "supplies",
      "stationery",
      "stationary",
      "notebook",
      "note",
      "pen",
      "paper",
      "binder",
    ],
  },
  {
    art: "/images/categories/everyday.svg",
    blurb: "The little things you keep reaching for.",
    keywords: ["everyday", "daily", "bag", "bottle", "life", "accessory"],
  },
];

export function getCategoryArt(category: string): string {
  const normalized = category.toLowerCase();
  const match = categoryArtworks.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.art ?? "/images/categories/everyday.svg";
}

export function getCategoryBlurb(category: string): string {
  const normalized = category.toLowerCase();
  const match = categoryArtworks.find((entry) =>
    entry.keywords.some((keyword) => normalized.includes(keyword)),
  );
  return match?.blurb ?? "Campus finds for everyday student life.";
}

export function isUnavailable(product: Product): boolean {
  return Boolean(product.outOfStock) || product.quantity === 0;
}

export function getStockLabel(product: Product): {
  label: string;
  tone: "in" | "low" | "out" | "unlimited";
} {
  if (isUnavailable(product)) return { label: "Sold out", tone: "out" };
  if (product.quantity === undefined) {
    return { label: "Available", tone: "unlimited" };
  }
  if (product.quantity <= 3) {
    return {
      label: product.quantity === 1 ? "Last one" : `Only ${product.quantity} left`,
      tone: "low",
    };
  }
  return { label: `${product.quantity} in stock`, tone: "in" };
}

export function getPickupLabel(product: Product): string {
  const parts = [product.pickupClass, product.pickupRoom].filter(
    (part): part is string => Boolean(part?.trim()),
  );
  if (parts.length > 0) return `Pickup ${parts.join(" · ")}`;
  if (product.pickupMethod?.trim()) return product.pickupMethod.trim();
  return "Arrange pickup in class";
}

export function getCategoryCounts(products: Product[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    const category = product.category.trim() || "Everyday";
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name));
}

export function filterProducts(
  products: Product[],
  options: {
    query?: string;
    category?: string;
    savedIds?: string[];
    availableOnly?: boolean;
  },
): Product[] {
  const normalizedQuery = options.query?.trim().toLowerCase() ?? "";
  const category = options.category?.trim() ?? "";
  const savedIds = options.savedIds ? new Set(options.savedIds) : null;

  return products.filter((product) => {
    if (options.availableOnly && isUnavailable(product)) return false;
    if (category && product.category !== category) return false;
    if (savedIds && !savedIds.has(product.id)) return false;
    if (!normalizedQuery) return true;
    const searchable = [
      product.name,
      product.description,
      product.fitsFor,
      product.category,
      product.badge,
    ]
      .join(" ")
      .toLowerCase();
    return searchable.includes(normalizedQuery);
  });
}

export function sortProducts(products: Product[], sort: SortKey): Product[] {
  const copy = [...products];
  if (sort === "name") {
    return copy.sort((first, second) =>
      first.name.localeCompare(second.name, undefined, { sensitivity: "base" }),
    );
  }
  if (sort === "price" || sort === "price-desc") {
    const direction = sort === "price" ? 1 : -1;
    return copy.sort(
      (first, second) =>
        (parseMntAmount(first.price) - parseMntAmount(second.price)) * direction,
    );
  }
  return copy;
}

export function getBadgeTone(badge: string): string {
  const normalized = badge.toLowerCase();
  if (normalized.includes("best") || normalized.includes("popular")) {
    return "chip-gold";
  }
  if (normalized.includes("new") || normalized.includes("fresh")) {
    return "chip-accent";
  }
  return "chip-pine";
}

