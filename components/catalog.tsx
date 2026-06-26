import type { Product } from "./types";

export function Catalog({ products }: { products: Product[] }) {
  return (
    <div className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-600">
            Your catalog
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            Phone cases you&apos;re ready to sell
          </h2>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {products.length} cases
        </span>
      </div>

      {products.length === 0 ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No cases yet. Add one above to start building your storefront.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {products.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50 shadow-sm"
            >
              <div className="aspect-[4/5] bg-slate-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Phone case
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {product.price}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {product.category}
                  </span>
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
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
