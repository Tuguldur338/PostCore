"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckoutDialog } from "./checkout";
import { formatMntPrice, parseMntAmount } from "./currency";
import { QuantityInput } from "./quantity-input";
import type { Product } from "./types";

const favoritesStorageKey = "postcore-favorites";

function QuantityEditor({
  product,
  onSave,
}: {
  product: Product;
  onSave: (quantity: number) => void;
}) {
  const [value, setValue] = useState(product.quantity?.toString() ?? "");

  return (
    <div className="grid w-40 gap-1">
      <span className="text-xs font-semibold text-slate-600">Inventory</span>
      <QuantityInput
        min={0}
        value={value}
        onChange={setValue}
        onBlur={() => {
          const quantity = Number(value);
          if (value !== "" && Number.isSafeInteger(quantity) && quantity >= 0) {
            onSave(quantity);
          } else {
            setValue(product.quantity?.toString() ?? "");
          }
        }}
        onStep={onSave}
        ariaLabel={`Quantity of ${product.name}`}
      />
    </div>
  );
}

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
  onProductRemoved?: (productId: string) => void;
  onPurchaseSuccess?: (productId: string, quantity: number) => void;
  onStockChanged?: () => void;
};

export function Catalog({
  products,
  initialView = "all",
  showViewSwitch = true,
  showProductCards = true,
  canManageListings = false,
  onAvailabilityChange,
  onQuantityChange,
  onProductRemoved,
  onPurchaseSuccess,
  onStockChanged,
}: CatalogProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showSavedOnly, setShowSavedOnly] = useState(initialView === "saved");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [productToRemove, setProductToRemove] = useState<Product | null>(null);
  const [isMarketplaceAdmin, setIsMarketplaceAdmin] = useState(false);
  const [removingProductId, setRemovingProductId] = useState("");
  const [managementError, setManagementError] = useState("");
  const [removedProductIds, setRemovedProductIds] = useState<string[]>([]);

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

  useEffect(() => {
    let active = true;

    const verifyMarketplaceAdmin = async () => {
      try {
        const response = await fetch("/api/admin/products", {
          cache: "no-store",
        });
        if (!response.ok) {
          if (response.status !== 401 && response.status !== 403) {
            const result = (await response.json()) as { message?: string };
            throw new Error(
              result.message ?? "Marketplace admin access could not be checked.",
            );
          }
          return;
        }

        const result = (await response.json()) as { authorized?: boolean };
        if (active) setIsMarketplaceAdmin(result.authorized === true);
      } catch (error) {
        if (active) {
          setManagementError(
            error instanceof Error
              ? error.message
              : "Marketplace admin access could not be checked.",
          );
        }
      }
    };

    void verifyMarketplaceAdmin();
    return () => {
      active = false;
    };
  }, []);

  const removeProduct = async (product: Product) => {
    setManagementError("");
    setRemovingProductId(product.id);
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "The product could not be removed.");
      }

      setRemovedProductIds((current) => [...current, product.id]);
      onProductRemoved?.(product.id);
      setProductToRemove(null);
    } catch (error) {
      setManagementError(
        error instanceof Error
          ? error.message
          : "The product could not be removed.",
      );
    } finally {
      setRemovingProductId("");
    }
  };

  const canRemoveProducts = canManageListings || isMarketplaceAdmin;
  const catalogProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          !removedProductIds.includes(product.id) &&
          (canManageListings || !isUnavailable(product)),
      ),
    [canManageListings, products, removedProductIds],
  );
  const categories = useMemo(
    () => ["All", ...new Set(catalogProducts.map((product) => product.category))],
    [catalogProducts],
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = catalogProducts.filter((product) => {
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
  }, [category, catalogProducts, favorites, query, showSavedOnly, sort]);

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

  const savedProductsCount = catalogProducts.filter((product) =>
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
            {visibleProducts.length} of {catalogProducts.length} items
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
      {managementError ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {managementError}
        </p>
      ) : null}

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
      ) : catalogProducts.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Nothing is currently in stock. Check back later for more items.
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
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                {product.quantity !== undefined && !isUnavailable(product) ? (
                  <span className="absolute bottom-3 left-3 rounded-full border border-white/70 bg-slate-950/75 px-3 py-1.5 text-xs font-semibold text-white shadow">
                    {product.quantity} available
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  className="absolute right-3 top-3 rounded-full border border-white/70 bg-white/95 px-3 py-2 text-sm font-semibold text-slate-700 shadow transition-colors hover:border-orange-400 hover:text-orange-600"
                  aria-label={`${favorites.includes(product.id) ? "Remove" : "Save"} ${product.name}`}
                >
                  {favorites.includes(product.id) ? "Saved" : "Save"}
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 text-lg font-semibold text-slate-900">
                    {product.name}
                  </h3>
                  <span className="shrink-0 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800">
                    {formatMntPrice(product.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(product)}
                  disabled={isUnavailable(product)}
                  className="mt-4 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isUnavailable(product) ? "Unavailable" : "Buy now"}
                </button>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void shareProduct(product)}
                    className="smooth-transition rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors duration-200 ease-out hover:border-orange-400 hover:text-orange-600"
                  >
                    Share
                  </button>
                </div>
                {canManageListings ? (
                  <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-200 pt-3">
                    <QuantityEditor
                      key={`${product.id}:${product.quantity ?? "unlimited"}`}
                      product={product}
                      onSave={(quantity) =>
                        onQuantityChange?.(product.id, quantity)
                      }
                    />
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
                  </div>
                ) : null}
                {canRemoveProducts ? (
                  <div className="mt-4 border-t border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setManagementError("");
                        setProductToRemove(product);
                      }}
                      className="rounded-full border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50 disabled:cursor-wait disabled:opacity-60"
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
            <Image
              src={selectedProduct.image}
              alt={selectedProduct.name}
              width={960}
              height={720}
              unoptimized
              className="mt-5 aspect-[4/3] w-full rounded-2xl object-cover"
            />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              {selectedProduct.category}
            </p>
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
            {selectedProduct.pickupClass ||
            selectedProduct.pickupRoom ||
            selectedProduct.pickupMethod ? (
              <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Pickup details</p>
                {selectedProduct.pickupClass ? (
                  <p className="mt-1">
                    Class: {selectedProduct.pickupClass}
                  </p>
                ) : null}
                {selectedProduct.pickupRoom ? (
                  <p className="mt-1">Room: {selectedProduct.pickupRoom}</p>
                ) : null}
                {selectedProduct.pickupMethod ? (
                  <p className="mt-1">{selectedProduct.pickupMethod}</p>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              onClick={() => startCheckout(selectedProduct)}
              disabled={isUnavailable(selectedProduct)}
              className="mt-4 w-full rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isUnavailable(selectedProduct)
                ? "Unavailable"
                : "Continue to checkout"}
            </button>
          </div>
        </div>
      ) : null}
      {checkoutProduct ? (
        <CheckoutDialog
          product={checkoutProduct}
          onClose={() => setCheckoutProduct(null)}
          onPurchaseSuccess={onPurchaseSuccess}
          onStockChanged={onStockChanged}
        />
      ) : null}
      {productToRemove ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              removingProductId !== productToRemove.id
            ) {
              setProductToRemove(null);
            }
          }}
        >
          <section
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-100 bg-white shadow-[0_30px_100px_-25px_rgba(15,23,42,0.75)]"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="remove-listing-title"
            aria-describedby="remove-listing-description"
          >
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-700 via-rose-600 to-orange-500 px-6 pb-7 pt-6 text-white">
              <div
                aria-hidden="true"
                className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[24px] border-white/10"
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/25 bg-white/15 text-3xl font-bold shadow-inner">
                  !
                </div>
                <span className="rounded-full border border-white/25 bg-black/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em]">
                  Permanent action
                </span>
              </div>
              <h2
                id="remove-listing-title"
                className="relative mt-5 text-2xl font-bold tracking-tight"
              >
                Remove this listing?
              </h2>
              <p
                id="remove-listing-description"
                className="relative mt-2 text-sm leading-6 text-white/90"
              >
                The item will disappear from the marketplace and can&apos;t be
                restored from this screen.
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-gradient-to-br from-orange-100 to-rose-100 text-2xl font-bold uppercase text-rose-700"
                >
                  {productToRemove.name.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">
                    {productToRemove.name}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {formatMntPrice(productToRemove.price)}
                    {productToRemove.quantity !== undefined
                      ? ` · ${productToRemove.quantity} in stock`
                      : ""}
                  </p>
                </div>
              </div>

              {managementError ? (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {managementError}
                </p>
              ) : null}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={removingProductId === productToRemove.id}
                  onClick={() => setProductToRemove(null)}
                  className="rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Keep listing
                </button>
                <button
                  type="button"
                  disabled={removingProductId === productToRemove.id}
                  onClick={() => void removeProduct(productToRemove)}
                  className="rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-rose-900/20 transition-all hover:-translate-y-0.5 hover:from-rose-800 hover:to-rose-700 hover:shadow-xl disabled:cursor-wait disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {removingProductId === productToRemove.id
                    ? "Removing listing..."
                    : "Yes, remove listing"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
