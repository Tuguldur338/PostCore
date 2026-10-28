"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Alert } from "@/components/icons";
import { PageShell } from "@/components/page-shell";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-soft text-rose">
          <Alert size={28} />
        </span>
        <p className="eyebrow mt-6">Something went wrong</p>
        <h1 className="page-title mt-3 text-[clamp(2.4rem,5.5vw,4rem)]">
          That page slipped <span className="display-italic">off the desk.</span>
        </h1>
        <p className="lede mt-4 max-w-md text-sm">
          An unexpected error stopped this page from loading. Try again, or head
          back to the market.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
            <ArrowRight size={15} />
          </button>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
