import { formatPercentage } from '@/lib/format';

interface RankRow {
  label: string;
  count: number;
}

interface Props {
  title: string;
  rows: RankRow[];
  total: number;
  emptyMessage: string;
}

export default function RankList({ title, rows, total, emptyMessage }: Props) {
  if (rows.length === 0) {
    return (
      <article className="admin-card p-5">
        <h3 className="m-0 text-base font-semibold text-[var(--color-ink)]">{title}</h3>
        <p className="mt-2 mb-0 text-sm text-[var(--color-muted-ink)]">{emptyMessage}</p>
      </article>
    );
  }

  const max = rows[0]?.count || 1;

  return (
    <article className="admin-card p-5">
      <h3 className="m-0 text-base font-semibold text-[var(--color-ink)]">{title}</h3>
      <div className="grid gap-3.5 mt-4">
        {rows.map((row) => {
          const pct = total > 0 ? row.count / total : 0;
          const barWidth = Math.max((row.count / max) * 100, 6);
          return (
            <div key={row.label} className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <strong className="break-all text-sm text-[var(--color-ink)]">{row.label}</strong>
                <span className="text-[var(--color-muted-ink)] whitespace-nowrap text-xs font-semibold">
                  {row.count} · {formatPercentage(pct)}
                </span>
              </div>
              <div
                className="h-2 rounded-full bg-white/55 border border-white/60 overflow-hidden"
                aria-hidden="true"
              >
                <span
                  className="block h-full rounded-full bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))]"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
