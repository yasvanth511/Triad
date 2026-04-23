import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export function StateBanner({
  title,
  message,
  tone = "accent",
}: {
  title: string;
  message: string;
  tone?: "accent" | "secondary" | "blue" | "red" | "muted" | "green";
}) {
  return (
    <Card className="flex items-start justify-between gap-4 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[var(--color-ink)]">{title}</p>
        <p className="text-sm leading-6 text-[var(--color-muted-ink)]">{message}</p>
      </div>
      <Badge tone={tone}>{title}</Badge>
    </Card>
  );
}
