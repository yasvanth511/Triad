import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-2">
        <h1 className="page-title text-[var(--color-ink)]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[var(--color-muted-ink)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
