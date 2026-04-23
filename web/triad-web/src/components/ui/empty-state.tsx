import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="max-w-xl text-sm leading-6 text-[var(--color-muted-ink)]">{message}</p>
      </div>
      {action}
    </Card>
  );
}
