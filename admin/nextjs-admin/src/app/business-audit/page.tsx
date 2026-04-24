'use client';

import { useEffect, useState } from 'react';
import { fetchBusinessAuditLog } from '@/lib/api';
import type { BusinessAuditLogItem } from '@/lib/types';
import StateCard from '@/components/StateCard';

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

export default function BusinessAuditPage() {
  const [items, setItems] = useState<BusinessAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinessAuditLog()
      .then(setItems)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load audit history.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <StateCard title="Loading audit log" body="Fetching recent business review history." />;
  if (error) return <StateCard title="Unable to load audit log" body={error} />;
  if (items.length === 0) return <StateCard title="No audit history yet" body="No actions have been recorded." />;

  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>Action</th>
              <th className={TH}>Created</th>
              <th className={TH}>Target</th>
              <th className={TH}>Reason</th>
              <th className={TH}>Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className={TD}>{item.action}</td>
                <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
                <td className={TD}>
                  {item.targetPartnerId || item.targetEventId || item.targetOfferId || item.targetChallengeId || 'N/A'}
                </td>
                <td className={TD}>{item.reason || '—'}</td>
                <td className={TD}>{item.note || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
