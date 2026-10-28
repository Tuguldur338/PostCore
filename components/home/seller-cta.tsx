import Link from "next/link";
import { ArrowRight, Camera, Tag } from "@/components/icons";

export function SellerCta() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-[#163d31] text-[#f7f1e4]">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-[36px] border-white/[0.06]"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-gold/10 blur-3xl"
      />
      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
            Pass it on
          </p>
          <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] leading-[1.03] tracking-[-0.03em]">
            Your spare notes could be someone&apos;s{" "}
            <span className="italic text-gold">lifesaver.</span>
          </h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">
            Got an extra notebook, a snack stash, or study gear you have grown out
            of? Put it on the shelf for another student. Listings are added by
            marketplace admins, so the shop stays tidy and trustworthy.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/sell" className="btn btn-lg bg-gold text-[#241a08] hover:brightness-105">
              Start a listing
              <ArrowRight size={16} className="arrow-slide" />
            </Link>
            <Link
              href="/contacts"
              className="text-sm font-semibold text-white/80 underline decoration-white/30 underline-offset-4 transition-colors hover:text-white"
            >
              Ask about selling
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
          <div className="rotate-[-3deg] rounded-2xl border border-white/15 bg-[#f7f1e4] p-4 text-[#17231e] shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#f5e3d2] px-2.5 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#a83a0d]">
                Listing draft
              </span>
              <Camera size={16} className="text-[#68756e]" />
            </div>
            <div className="mt-4 flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-[#cbbda5] bg-[#f3ecdf]">
              <div className="text-center">
                <Camera size={26} className="mx-auto text-[#cbbda5]" />
                <p className="mt-2 text-[0.7rem] font-medium text-[#68756e]">
                  Add a clear photo
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="font-display text-lg leading-tight tracking-tight">
                What are you selling?
              </p>
              <div className="mt-3 h-2 w-3/4 rounded-full bg-[#e2d9c8]" />
              <div className="mt-2 h-2 w-1/2 rounded-full bg-[#e2d9c8]" />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#e2d9c8] pt-3">
              <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-[#68756e]">
                <Tag size={13} />
                Your price
              </span>
              <span className="font-display text-xl font-semibold">₮—</span>
            </div>
          </div>

          <div className="absolute -right-2 -top-4 rotate-[7deg] rounded-lg bg-gold px-3 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#241a08] shadow-lg">
            Campus only
          </div>
          <div className="absolute -bottom-4 -left-2 rotate-[-6deg] rounded-lg border border-white/20 bg-[#163d31] px-3 py-1.5 font-mono text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[#f7f1e4] shadow-lg">
            No delivery
          </div>
        </div>
      </div>
    </section>
  );
}
