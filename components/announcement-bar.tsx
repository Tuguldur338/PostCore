import Link from "next/link";
import { ArrowUpRight } from "@/components/icons";

export function AnnouncementBar() {
  return (
    <div className="bg-pine-deep text-on-pine">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[11px] font-medium tracking-wide sm:text-xs">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Student-run at Orkhon School
        </span>
        <span className="hidden h-3 w-px bg-white/20 sm:block" />
        <span className="text-on-pine/80">
          No online payment — request it, then collect on campus.
        </span>
        <Link
          href="/contacts#how-it-works"
          className="group ml-1 inline-flex items-center gap-1 border-b border-white/30 pb-px font-semibold text-gold transition-colors hover:border-gold"
        >
          How it works
          <ArrowUpRight size={12} className="arrow-slide" />
        </Link>
      </div>
    </div>
  );
}
