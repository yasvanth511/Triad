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
      <article className="bg-[#eef2f8] border border-[#d9e0ec] rounded-[18px] p-5">
        <h3 className="m-0 text-base font-semibold">{title}</h3>
        <p className="mt-2.5 mb-0 text-[#667085]">{emptyMessage}</p>
      </article>
    );
  }

  const max = rows[0]?.count || 1;

  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <h3 className="m-0 text-base font-semibold">{title}</h3>
      <div className="grid gap-3.5 mt-4">
        {rows.map((row) => {
          const pct = total > 0 ? row.count / total : 0;
          const barWidth = Math.max((row.count / max) * 100, 6);
          return (
            <div key={row.label} className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <strong className="break-all">{row.label}</strong>
                <span className="text-[#667085] whitespace-nowrap text-sm">
                  {row.count} · {formatPercentage(pct)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#eef2f8] overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
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
