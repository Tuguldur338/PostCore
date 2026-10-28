import type { ReactNode } from "react";
import { ArrowRight } from "@/components/icons";
import Link from "next/link";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: { href: string; label: string };
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className = "",
}: SectionHeadingProps) {
  return (
    <div
      className={`flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between ${
        align === "center" ? "sm:flex-col sm:items-center sm:text-center" : ""
      } ${className}`}
    >
      <div className={`max-w-2xl ${align === "center" ? "mx-auto" : ""}`}>
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title mt-3">{title}</h2>
        {description ? (
          <p className="lede mt-3 max-w-xl text-[0.98rem]">{description}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="group inline-flex w-fit items-center gap-2 border-b border-line-strong pb-1 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent-strong"
        >
          {action.label}
          <ArrowRight size={16} className="arrow-slide" />
        </Link>
      ) : null}
    </div>
  );
}
