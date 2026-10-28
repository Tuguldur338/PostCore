import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { ProductsBrowser } from "@/components/products-browser";
import type { SortKey } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop the market",
  description:
    "Browse notebooks, snacks, study tools, and campus essentials listed by students at Orkhon School.",
};

type ProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const allowedSorts: SortKey[] = ["featured", "price", "price-desc", "name"];

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sortParam = typeof params.sort === "string" ? params.sort : "featured";
  const sort = allowedSorts.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "featured";

  return (
    <PageShell>
      <PageHeader
        eyebrow="The market"
        title={
          <>
            Everything on the <span className="display-italic">shelves.</span>
          </>
        }
        description="Notebooks, snacks, study tools, and the odd campus essential — listed by students, requested online, collected on campus."
        actions={
          <>
            <Link href="/sell" className="btn btn-primary">
              <Plus size={16} />
              Sell an item
            </Link>
            <Link href="/saved" className="btn btn-secondary">
              Saved items
              <ArrowRight size={15} className="arrow-slide" />
            </Link>
          </>
        }
      />

      <ProductsBrowser
        key={`${query}|${category}|${sort}`}
        initialQuery={query}
        initialCategory={category}
        initialSort={sort}
      />
    </PageShell>
  );
}
