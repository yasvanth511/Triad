'use client';

import { useEffect, useState } from 'react';
import { fetchModerationAnalytics } from '@/lib/api';
import type { ModerationAnalytics } from '@/lib/types';
import { formatPercentage } from '@/lib/format';
import MetricCard from '@/components/MetricCard';
import StateCard from '@/components/StateCard';
import StatusPill from '@/components/StatusPill';
import { TableCard, TriadTable, TD, TH, TR_HOVER } from '@/components/TableShell';

function ReportReasonsPanel({
  rows,
  totalReports,
}: {
  rows: NonNullable<ModerationAnalytics['topReportReasons']>;
  totalReports: number;
}) {
  if (rows.length === 0) {
    return (
      <StateCard title="Top Report Reasons" body="No report reason data is available yet." />
    );
  }

  const maxCount = rows[0]?.count ?? 1;

  return (
    <article className="admin-card p-5">
      <h3 className="m-0 text-base font-semibold text-[var(--color-ink)]">Top Report Reasons</h3>
      <div className="grid gap-3.5 mt-4">
        {rows.map((row, i) => {
          const count = Number(row.count ?? 0);
          const share = totalReports > 0 ? count / totalReports : 0;
          const barWidth = Math.max((count / (maxCount || 1)) * 100, 6);
          return (
            <div key={i} className="grid gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <strong className="break-all text-sm text-[var(--color-ink)]">
                  {row.reason ?? 'Unknown'}
                </strong>
                <span className="text-[var(--color-muted-ink)] whitespace-nowrap text-xs font-semibold">
                  {count} · {formatPercentage(share)}
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

function VerificationDistributionPanel({
  rows,
  total,
}: {
  rows: NonNullable<ModerationAnalytics['verificationStatusDistribution']>;
  total: number;
}) {
  if (rows.length === 0) {
    return (
      <StateCard
        title="Verification Status Distribution"
        body="Verification data is not available."
      />
    );
  }

  return (
    <TableCard>
      <h3 className="m-0 text-base font-semibold text-[var(--color-ink)]">
        Verification Status Distribution
      </h3>
      <div className="mt-4">
        <TriadTable>
          <thead>
            <tr>
              <th className={TH}>Status</th>
              <th className={TH}>Count</th>
              <th className={TH}>Share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const count = Number(row.count ?? 0);
              return (
                <tr key={i} className={TR_HOVER}>
                  <td className={TD}>
                    <StatusPill value={String(row.status ?? 'Unknown')} type="verification" />
                  </td>
                  <td className={TD}>{count}</td>
                  <td className={TD}>{formatPercentage(total > 0 ? count / total : 0)}</td>
                </tr>
              );
            })}
          </tbody>
        </TriadTable>
      </div>
    </TableCard>
  );
}

export default function ModerationPage() {
  const [analytics, setAnalytics] = useState<ModerationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModerationAnalytics()
      .then((data) => {
        setAnalytics(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'The admin API request failed.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <StateCard
        title="Loading moderation analytics"
        body="Aggregating admin-safe moderation totals."
      />
    );
  }
  if (error) {
    return <StateCard title="Unable to load moderation analytics" body={error} />;
  }
  if (!analytics) return null;

  const totalReports = Number(analytics.totalReports ?? 0);
  const totalRelationships = Number(analytics.totalBlockRelationships ?? 0);
  const verificationDist = analytics.verificationStatusDistribution ?? [];
  const totalVerificationStatuses = verificationDist.reduce(
    (sum, r) => sum + Number(r.count ?? 0),
    0,
  );

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        <MetricCard
          label="Reported Users"
          value={Number(analytics.totalReportedUsers ?? 0)}
          description="Distinct users who have been reported."
        />
        <MetricCard
          label="Total Reports"
          value={totalReports}
          description="All report records across the platform."
        />
        <MetricCard
          label="Blocked Users"
          value={Number(analytics.totalBlockedUsers ?? 0)}
          description="Distinct users who were blocked by someone."
        />
        <MetricCard
          label="Block Relationships"
          value={totalRelationships}
          description="Total blocker to blocked relationships."
        />
        <MetricCard
          label="Verification Records"
          value={totalVerificationStatuses}
          description="Non-disabled verification status records, if available."
        />
      </div>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
        <ReportReasonsPanel
          rows={analytics.topReportReasons ?? []}
          totalReports={totalReports}
        />
        <VerificationDistributionPanel
          rows={verificationDist}
          total={totalVerificationStatuses}
        />
      </div>
    </div>
  );
}
