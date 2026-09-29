"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckoutDialog } from "./checkout";
import { formatMntPrice, parseMntAmount } from "./currency";
import type { Product } from "./types";

const favoritesStorageKey = "postcore-favorites";

function isUnavailable(product: Product): boolean {
  return Boolean(product.outOfStock) || product.quantity === 0;
}

type FilterMenuProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

function FilterMenu({ label, value, options, onChange }: FilterMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = (option: string) => {
    if (option === "featured") return "Featured";
    if (option === "price") return "Price: low to high";
    return option;
  };

  return (
    <div className="filter-menu">
      <button
        type="button"
        className="filter-trigger"
        onClick={() => setIsOpen((open) => !open)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span>{displayValue(value)}</span>
        <span
          className={`filter-chevron ${isOpen ? "is-open" : ""}`}
          aria-hidden="true"
        >
          ↓
        </span>
      </button>
      {isOpen ? (
        <div className="filter-popover" role="listbox" aria-label={label}>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value}
              className={`filter-option ${option === value ? "is-selected" : ""}`}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              <span>{displayValue(option)}</span>
              {option === value ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type CatalogProps = {
  products: Product[];
  initialView?: "all" | "saved";
  showViewSwitch?: boolean;
  showProductCards?: boolean;
  canManageListings?: boolean;
  onAvailabilityChange?: (productId: string, outOfStock: boolean) => void;
  onQuantityChange?: (productId: string, quantity: number) => void;
  onRemoveProduct?: (productId: string) => void;
};

export function Catalog({
  products,
  initialView = "all",
  showViewSwitch = true,
  showProductCards = true,
  canManageListings = false,
  onAvailabilityChange,
  onQuantityChange,
  onRemoveProduct,
}: CatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(initialView === "saved");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);

  useEffect(() => {
    const savedFavorites = window.localStorage.getItem(favoritesStorageKey);
    if (!savedFavorites) return;

    try {
      queueMicrotask(() => {
        setFavorites(JSON.parse(savedFavorites) as string[]);
      });
    } catch {
      window.localStorage.removeItem(favoritesStorageKey);
    }
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = products.filter((product) => {
      const matchesCategory =
        category === "All" || product.category === category;
      const matchesSavedView = !showSavedOnly || favorites.includes(product.id);
      const searchableText =
        `${product.name} ${product.description} ${product.fitsFor} ${product.category}`.toLowerCase();
      return (
        matchesCategory &&
        matchesSavedView &&
        searchableText.includes(normalizedQuery)
      );
    });

    return [...filtered].sort((first, second) => {
      if (sort === "name") return first.name.localeCompare(second.name);
      if (sort === "price") {
        return parseMntAmount(first.price) - parseMntAmount(second.price);
      }
      return 0;
    });
  }, [category, favorites, products, query, showSavedOnly, sort]);

  const toggleFavorite = (productId: string) => {
    const nextFavorites = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(nextFavorites);
    window.localStorage.setItem(
      favoritesStorageKey,
      JSON.stringify(nextFavorites),
    );
  };

  const savedProductsCount = products.filter((product) =>
    favorites.includes(product.id),
  ).length;

  const shareProduct = async (product: Product) => {
    const shareText = `${product.name} - ${formatMntPrice(product.price)}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, text: shareText });
      return;
    }
    await navigator.clipboard.writeText(shareText);
  };

  const startCheckout = (product: Product) => {
    if (isUnavailable(product)) return;
    setSelectedProduct(null);
    setCheckoutProduct(product);
  };

  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            {showSavedOnly ? "Your saved items" : "Your catalog"}
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {showSavedOnly
              ? "Student finds you want to come back to"
              : "School supplies and snacks you're ready to sell"}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
            {visibleProducts.length} of {products.length} items
          </span>
          {showViewSwitch ? (
            <div
              className="flex rounded-full bg-slate-100 p-1"
              role="group"
              aria-label="Student essentials collection"
            >
              <button
                type="button"
                aria-pressed={!showSavedOnly}
                onClick={() => setShowSavedOnly(false)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${!showSavedOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                All items
              </button>
              <button
                type="button"
                aria-pressed={showSavedOnly}
                onClick={() => setShowSavedOnly(true)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${showSavedOnly ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
              >
                Saved {savedProductsCount}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(120px,140px)_minmax(170px,180px)]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-colors duration-200 ease-out focus:border-orange-400"
          placeholder="Search supplies, snacks, or essentials"
          aria-label="Search catalog"
        />
        <FilterMenu
          label="Filter by category"
          value={category}
          options={categories}
          onChange={setCategory}
        />
        <FilterMenu
          label="Sort catalog"
          value={sort}
          options={["featured", "name", "price"]}
          onChange={setSort}
        />
      </div>

      {!showProductCards ? (
        <div className="mt-6 flex min-h-56 items-center justify-center px-6 text-center">
          <p className="text-lg font-semibold text-slate-600">
            There are no student items yet...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No items yet. Add one above to start building your storefront.
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          {showSavedOnly && savedProductsCount === 0 ? (
            <>
              <p>You haven&apos;t saved any items yet.</p>
              {showViewSwitch ? (
                <button
                  type="button"
                  onClick={() => setShowSavedOnly(false)}
                  className="mt-3 font-semibold text-orange-600 hover:text-orange-700"
                >
                  Browse all items
                </button>
              ) : (
                <Link
                  href="/products"
                  className="mt-3 inline-block font-semibold text-orange-600 hover:text-orange-700"
                >
                  Browse items
                </Link>
              )}
            </>
          ) : (
            <p>
              No items match that search. Try another supply, snack, or
              essential.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm"
            >
              <div className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {isUnavailable(product) ? (
                      <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                        Out of stock
                      </span>
                    ) : (
                      <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {formatMntPrice(product.price)}
                      </span>
                    )}
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {product.category}
                    </span>
                    {product.quantity !== undefined && !isUnavailable(product) ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        {product.quantity} available
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.id)}
                    className="smooth-transition rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 ease-out hover:border-orange-400 hover:text-orange-600"
                    aria-label={`${favorites.includes(product.id) ? "Remove" : "Save"} ${product.name}`}
                  >
                    {favorites.includes(product.id) ? "Saved" : "Save"}
                  </button>
                </div>

                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {product.description}
                </p>

                <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">Fits:</span>{" "}
                  {product.fitsFor}
                </div>
                <button
                  type="button"
                  onClick={() => startCheckout(product)}
                  disabled={isUnavailable(product)}
                  className="mt-4 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isUnavailable(product) ? "Unavailable" : "Buy now"}
                </button>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(product)}
                    className="smooth-transition flex-1 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 ease-out hover:bg-orange-500"
                  >
                    View details
                  </button>
                  <button
                    type="button"
                    onClick={() => void shareProduct(product)}
                    className="smooth-transition rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 ease-out hover:border-orange-400 hover:text-orange-600"
                  >
                    Share
                  </button>
                </div>
                {canManageListings ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-3">
                    <label className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm font-semibold text-slate-700">
                      Qty
                      <input
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={product.quantity ?? ""}
                        placeholder="—"
                        onChange={(event) => {
                          const quantity = Number(event.target.value);
                          if (
                            event.target.value !== "" &&
                            Number.isSafeInteger(quantity) &&
                            quantity >= 0
                          ) {
                            onQuantityChange?.(product.id, quantity);
                          }
                        }}
                        className="w-16 bg-transparent py-1 outline-none"
                        aria-label={`Quantity of ${product.name}`}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        onAvailabilityChange?.(product.id, !product.outOfStock)
                      }
                      className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-orange-400 hover:text-orange-700"
                    >
                      {product.outOfStock
                        ? "Mark in stock"
                        : "Mark out of stock"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveProduct?.(product.id)}
                      className="rounded-full border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
                    >
                      Remove listing
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedProduct ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedProduct.name}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">
                  Listing details
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-900">
                  {selectedProduct.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="smooth-transition rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                aria-label="Close details"
              >
                Close
              </button>
            </div>
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="mt-5 aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <p className="mt-5 text-lg font-semibold text-orange-600">
              {formatMntPrice(selectedProduct.price)}
            </p>
            {selectedProduct.quantity !== undefined ? (
              <p className="mt-1 text-sm font-semibold text-slate-600">
                {isUnavailable(selectedProduct)
                  ? "Out of stock"
                  : `${selectedProduct.quantity} available`}
              </p>
            ) : null}
            <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
              {selectedProduct.description}
            </p>
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Fits:</span>{" "}
              {selectedProduct.fitsFor}
            </p>
            <button
              type="button"
              onClick={() => startCheckout(selectedProduct)}
              disabled={isUnavailable(selectedProduct)}
              className="mt-4 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUnavailable(selectedProduct) ? "Unavailable" : "Buy now"}
            </button>
          </div>
        </div>
      ) : null}
      {checkoutProduct ? (
        <CheckoutDialog
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
        />
      ) : null}
    </div>
  );
}
