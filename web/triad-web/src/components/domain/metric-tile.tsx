import { Card } from "@/components/ui/card";

export function MetricTile({
  title,
  value,
  colorClass,
}: {
  title: string;
  value: string;
  colorClass?: string;
}) {
  return (
    <Card className={`space-y-1 p-4 ${colorClass || ""}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-ink)]">
        {title}
      </p>
      <p className="text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </Card>
  );
}
