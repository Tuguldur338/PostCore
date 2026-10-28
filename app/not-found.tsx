import Link from "next/link";
import { ArrowRight, Search } from "@/components/icons";
import { PageShell } from "@/components/page-shell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-muted">
          <Search size={28} />
        </span>
        <p className="eyebrow mt-6">404 · Page not found</p>
        <h1 className="page-title mt-3 text-[clamp(2.6rem,6vw,4.5rem)]">
          Lost in the <span className="display-italic">hallway.</span>
        </h1>
        <p className="lede mt-4 max-w-md text-sm">
          This page is not on the shelf. It may have moved, sold out, or never
          existed. The market is still open, though.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <Link href="/products" className="btn btn-primary">
            Browse the market
            <ArrowRight size={15} />
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
