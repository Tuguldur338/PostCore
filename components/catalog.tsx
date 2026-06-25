import type { Product } from "./types";

export function Catalog({ products }: { products: Product[] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Seller badges
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Developers and sellers with verified roles
          </h2>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          4 verified profiles
        </span>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <article
            key={product.name}
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                {product.badge.slice(0, 2).toUpperCase()}
              </div>
              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                {product.price}
              </span>
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {product.category}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {product.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {product.description}
            </p>
            <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Badge:</span>{" "}
              {product.badge}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
