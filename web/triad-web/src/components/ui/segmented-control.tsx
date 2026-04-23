import { cn } from "@/lib/utils";

export interface SegmentedItem<T extends string> {
  label: string;
  value: T;
  badge?: number;
}

export function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
}: {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/65 bg-white/45 p-1">
      {items.map((item) => {
        const isActive = item.value === value;

        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
              isActive
                ? "bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white shadow-[0_12px_24px_rgba(119,86,223,0.24)]"
                : "text-[var(--color-muted-ink)] hover:bg-white/65",
            )}
          >
            <span>{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.68rem]",
                  isActive ? "bg-white text-[var(--color-accent)]" : "bg-[var(--color-accent)] text-white",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
