import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { PageShell } from "@/components/page-shell";
import { ProductsBrowser } from "@/components/products-browser";

export const metadata: Metadata = {
  title: "Saved items",
  description: "The PostCore listings you have saved for later.",
};

export default function SavedPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Saved"
        title={
          <>
            Your <span className="display-italic">saved</span> shelf.
          </>
        }
        description="Keep an eye on the things you want. Saved items stay on this device and are a tap away when you are ready to request them."
        actions={
          <Link href="/products" className="btn btn-secondary">
            Back to the market
            <ArrowRight size={15} className="arrow-slide" />
          </Link>
        }
      />
      <ProductsBrowser mode="saved" />
    </PageShell>
  );
}
