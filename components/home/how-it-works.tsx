import Link from "next/link";
import { ArrowRight, Bag, MapPin, Search } from "@/components/icons";

const steps = [
  {
    number: "01",
    title: "Browse the shelf",
    description:
      "Search by name or browse the categories. Save the good finds with a heart so they are waiting for you later.",
    icon: Search,
  },
  {
    number: "02",
    title: "Send a request",
    description:
      "Sign in, choose a quantity, and request the item. No card details and no delivery fee — just a clear ask.",
    icon: Bag,
  },
  {
    number: "03",
    title: "Collect on campus",
    description:
      "A student admin reviews the request. Then arrange a classroom or campus hand-off with the seller.",
    icon: MapPin,
  },
];

export function HowItWorks() {
  return (
    <section
      className="relative overflow-hidden rounded-[2rem] border border-line bg-paper-deep p-6 sm:p-10"
      aria-labelledby="how-heading"
    >
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div className="relative">
        <div className="max-w-2xl">
          <p className="eyebrow">How it works</p>
          <h2 id="how-heading" className="section-title mt-3">
            From shelf to school bag in{" "}
            <span className="display-italic">three steps.</span>
          </h2>
        </div>

        <div className="relative mt-8 grid gap-4 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="absolute left-[16%] right-[16%] top-9 hidden border-t border-dashed border-line-strong md:block"
          />
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article
                key={step.number}
                className="relative rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-2 text-pine">
                    <Icon size={21} />
                  </span>
                  <span className="font-display text-3xl italic text-line-strong">
                    {step.number}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-xl tracking-tight text-ink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.82rem] leading-6 text-muted">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/products" className="btn btn-primary">
            Start browsing
            <ArrowRight size={15} className="arrow-slide" />
          </Link>
          <Link
            href="/contacts#safety"
            className="text-sm font-semibold text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent-strong"
          >
            Read the pickup guide
          </Link>
        </div>
      </div>
    </section>
  );
}
