import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  aside?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  aside,
}: PageHeaderProps) {
  return (
    <header className="relative">
      <div className="flex flex-col gap-8 border-b border-line pb-8 pt-2 sm:pt-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="page-title mt-4">{title}</h1>
          {description ? (
            <p className="lede mt-4 max-w-2xl">{description}</p>
          ) : null}
          {actions ? (
            <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>
          ) : null}
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  );
}
