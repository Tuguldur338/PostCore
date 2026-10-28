"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatMntPrice } from "@/components/currency";
import { useFavorites } from "@/components/favorites";
import {
  ArrowRight,
  Check,
  Package,
  Plus,
  Spinner,
  Trash,
  X,
} from "@/components/icons";
import { ProductGrid, ProductGridSkeleton } from "@/components/product-grid";
import { fetchSharedProducts } from "@/components/product-store";
import { Modal } from "@/components/ui/modal";
import type { Product } from "@/components/types";
import {
  filterProducts,
  getCategoryCounts,
  isUnavailable,
  sortOptions,
  sortProducts,
  type SortKey,
} from "@/lib/catalog";

type ProductsBrowserProps = {
  initialQuery?: string;
  initialCategory?: string;
  initialSort?: SortKey;
  mode?: "all" | "saved";
};

type CatalogError = string;

export function ProductsBrowser({
  initialQuery = "",
  initialCategory = "",
  initialSort = "featured",
  mode = "all",
}: ProductsBrowserProps) {
  const pathname = usePathname();
  const favorites = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<CatalogError>("");
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortKey>(initialSort);
  const [canManage, setCanManage] = useState(false);
  const [managementError, setManagementError] = useState("");
  const [notice, setNotice] = useState("");
  const isFirstRender = useRef(true);

  const loadProducts = async () => {
    try {
      const sharedProducts = await fetchSharedProducts();
      setProducts(sharedProducts);
      setCatalogError("");
    } catch (loadError) {
      setCatalogError(
        loadError instanceof Error
          ? loadError.message
          : "The product catalog could not be loaded.",
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
        setCatalogError("");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setCatalogError(
          loadError instanceof Error
            ? loadError.message
            : "The product catalog could not be loaded.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const checkAccess = async () => {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        if (!response.ok) return;
        const result = (await response.json()) as { authorized?: boolean };
        if (active) setCanManage(result.authorized === true);
      } catch {
        // Seller tools simply stay hidden when the access check fails.
      }
    };
    void checkAccess();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (mode === "saved") return;

    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (category) params.set("category", category);
    if (sort !== "featured") params.set("sort", sort);
    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${pathname}${search ? `?${search}` : ""}`,
    );
  }, [category, mode, pathname, query, sort]);

  const baseProducts = useMemo(
    () =>
      products.filter((product) =>
        mode === "saved"
          ? favorites.includes(product.id)
          : canManage || !isUnavailable(product),
      ),
    [canManage, favorites, mode, products],
  );

  const categories = useMemo(() => {
    const counts = getCategoryCounts(baseProducts);
    return [{ name: "All", count: baseProducts.length }, ...counts];
  }, [baseProducts]);

  const visibleProducts = useMemo(() => {
    const filtered = filterProducts(baseProducts, {
      query,
      category: category || undefined,
    });
    return sortProducts(filtered, sort);
  }, [baseProducts, category, query, sort]);

  const hasActiveFilters = Boolean(query.trim() || category);

  const reload = async () => {
    setManagementError("");
    await loadProducts();
  };

  const updateInventory = async (
    productId: string,
    change: { quantity?: number; outOfStock?: boolean },
  ) => {
    setManagementError("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, ...change }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "Inventory could not be updated.");
      await reload();
      setNotice("Inventory updated.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (error) {
      setManagementError(
        error instanceof Error ? error.message : "Inventory could not be updated.",
      );
    }
  };

  const removeProduct = async (product: Product) => {
    setManagementError("");
    try {
      const response = await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message ?? "The listing could not be removed.");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice("Listing removed.");
      window.setTimeout(() => setNotice(""), 2400);
    } catch (error) {
      setManagementError(
        error instanceof Error ? error.message : "The listing could not be removed.",
      );
    }
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("");
  };

  return (
    <div className="flex flex-col gap-5">
      {mode === "all" ? (
        <div className="sticky top-[calc(var(--header-height)+0.5rem)] z-30 rounded-2xl border border-line bg-paper/90 p-3 shadow-[var(--shadow-sm)] backdrop-blur-xl">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <label htmlFor="catalog-search" className="sr-only">
                Search listings
              </label>
              <input
                id="catalog-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search supplies, snacks, or study tools…"
                className="field h-11 pr-10"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="catalog-sort" className="sr-only">
                Sort listings
              </label>
              <select
                id="catalog-sort"
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="field h-11 w-full min-w-44 lg:w-auto"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm h-11 shrink-0"
                >
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          <div className="no-scrollbar mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {categories.map((entry) => (
              <button
                key={entry.name}
                type="button"
                onClick={() => setCategory(entry.name === "All" ? "" : entry.name)}
                aria-pressed={
                  entry.name === "All" ? category === "" : category === entry.name
                }
                className="pill-button"
              >
                {entry.name}
                <span className="text-[0.65rem] opacity-60">{entry.count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[0.8rem] font-medium text-muted" role="status">
          {isLoading
            ? "Loading the shelves…"
            : `${visibleProducts.length} ${
                visibleProducts.length === 1 ? "item" : "items"
              }${hasActiveFilters ? " match your filters" : mode === "saved" ? " saved" : " on the shelves"}`}
        </p>
        {canManage ? (
          <div className="flex items-center gap-2">
            <span className="chip chip-pine">
              <Check size={12} />
              Managing listings
            </span>
            <Link href="/sell" className="btn btn-secondary btn-sm">
              <Plus size={14} />
              Add item
            </Link>
          </div>
        ) : null}
      </div>

      {notice ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-xl border border-pine/20 bg-pine-soft px-3.5 py-2.5 text-sm font-medium text-pine"
        >
          <Check size={15} />
          {notice}
        </p>
      ) : null}

      {catalogError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-rose/25 bg-rose-soft p-4 text-sm text-rose sm:flex-row sm:items-center sm:justify-between"
        >
          <p>{catalogError}</p>
          <button type="button" onClick={() => void loadProducts()} className="btn btn-secondary btn-sm shrink-0">
            Try again
          </button>
        </div>
      ) : null}

      {managementError ? (
        <p
          role="alert"
          className="rounded-xl border border-rose/25 bg-rose-soft px-3.5 py-2.5 text-sm text-rose"
        >
          {managementError}
        </p>
      ) : null}

      {isLoading ? (
        <ProductGridSkeleton count={6} />
      ) : products.length === 0 ? (
        <EmptyShelves mode={mode} />
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
            <Package size={26} />
          </span>
          <p className="mt-4 font-display text-2xl tracking-tight text-ink">
            {hasActiveFilters ? "Nothing matches that yet." : "Nothing here yet."}
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {hasActiveFilters
              ? "Try a different word or clear the category filter to see everything on the shelves."
              : mode === "saved"
                ? "Save items while you browse and they will show up here."
                : "The shelves are being restocked. Check back soon."}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="btn btn-secondary mt-5">
              Clear filters
            </button>
          ) : mode === "saved" ? (
            <Link href="/products" className="btn btn-primary mt-5">
              Browse the market
              <ArrowRight size={15} />
            </Link>
          ) : null}
        </div>
      ) : (
        <ProductGrid
          products={visibleProducts}
          onStockChanged={() => void reload()}
          onPurchaseSuccess={() => void reload()}
          renderFooter={(product) =>
            canManage ? (
              <AdminProductControls
                key={`${product.id}:${product.quantity ?? "unlimited"}:${product.outOfStock ? "out" : "in"}`}
                product={product}
                onQuantityChange={(quantity) =>
                  void updateInventory(product.id, { quantity })
                }
                onAvailabilityChange={(outOfStock) =>
                  void updateInventory(product.id, { outOfStock })
                }
                onRemove={() => void removeProduct(product)}
              />
            ) : null
          }
        />
      )}

    </div>
  );
}

function EmptyShelves({ mode }: { mode: "all" | "saved" }) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-muted">
        <Package size={26} />
      </span>
      <p className="mt-4 font-display text-2xl tracking-tight text-ink">
        {mode === "saved" ? "No saved items yet." : "The shelves are empty."}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {mode === "saved"
          ? "Tap the heart on any item to keep it here for later."
          : "A marketplace admin can add the first listing from the sell page."}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link href="/products" className="btn btn-primary">
          Browse the market
          <ArrowRight size={15} />
        </Link>
        <Link href="/sell" className="btn btn-secondary">
          Sell an item
        </Link>
      </div>
    </div>
  );
}

function AdminProductControls({
  product,
  onQuantityChange,
  onAvailabilityChange,
  onRemove,
}: {
  product: Product;
  onQuantityChange: (quantity: number) => void;
  onAvailabilityChange: (outOfStock: boolean) => void;
  onRemove: () => void;
}) {
  const [quantity, setQuantity] = useState(
    product.quantity === undefined ? "" : String(product.quantity),
  );
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [isSavingQuantity, setIsSavingQuantity] = useState(false);

  const commitQuantity = (nextValue: string) => {
    const parsed = Number(nextValue);
    if (nextValue !== "" && Number.isSafeInteger(parsed) && parsed >= 0) {
      setIsSavingQuantity(true);
      onQuantityChange(parsed);
      window.setTimeout(() => setIsSavingQuantity(false), 600);
    } else {
      setQuantity(product.quantity === undefined ? "" : String(product.quantity));
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[0.7rem] font-medium text-muted">
          Stock
          <input
            value={quantity}
            onChange={(event) => setQuantity(event.target.value.replace(/\D/g, ""))}
            onBlur={() => commitQuantity(quantity)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            inputMode="numeric"
            placeholder="∞"
            aria-label={`Stock quantity for ${product.name}`}
            className="w-12 bg-transparent text-center text-[0.78rem] font-semibold text-ink outline-none"
          />
          {isSavingQuantity ? (
            <Spinner size={12} className="text-pine" />
          ) : (
            <Check size={12} className="text-pine" />
          )}
        </label>
        <button
          type="button"
          onClick={() => onAvailabilityChange(!product.outOfStock)}
          className="rounded-full border border-line bg-surface px-2.5 py-1.5 text-[0.7rem] font-semibold text-ink-soft transition-colors hover:border-line-strong hover:bg-surface-2"
        >
          {product.outOfStock ? "Mark in stock" : "Mark out of stock"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmingRemove(true)}
          className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-rose-soft hover:text-rose"
          aria-label={`Remove ${product.name}`}
        >
          <Trash size={14} />
        </button>
      </div>

      <Modal
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        labelledBy="remove-listing-title"
        className="max-w-md"
      >
        <div className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-soft text-rose">
            <Trash size={20} />
          </span>
          <h2
            id="remove-listing-title"
            className="mt-4 font-display text-2xl tracking-tight text-ink"
          >
            Remove this listing?
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            <span className="font-semibold text-ink">{product.name}</span> will
            disappear from the marketplace. This cannot be undone from here.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
            <span className="price text-ink">{formatMntPrice(product.price)}</span>
            <span className="text-muted">·</span>
            <span className="text-muted">
              {product.quantity === undefined ? "Unlimited stock" : `${product.quantity} in stock`}
            </span>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              className="btn btn-secondary"
            >
              Keep listing
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmingRemove(false);
                onRemove();
              }}
              className="btn"
              style={{
                background: "var(--rose)",
                color: "#fff",
                boxShadow: "0 3px 0 color-mix(in srgb, var(--rose) 70%, #000)",
              }}
            >
              Remove listing
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
