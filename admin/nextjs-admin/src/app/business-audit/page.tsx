'use client';

import { useEffect, useState } from 'react';
import { fetchBusinessAuditLog } from '@/lib/api';
import type { BusinessAuditLogItem } from '@/lib/types';
import StateCard from '@/components/StateCard';
import { TableCard, TriadTable, TD, TH, TR_HOVER } from '@/components/TableShell';

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
    <TableCard>
      <TriadTable className="min-w-[1080px]">
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
            <tr key={item.id} className={TR_HOVER}>
              <td className={TD}>
                <span className="inline-flex items-center rounded-full bg-[rgba(124,77,255,0.12)] px-2.5 py-1 text-xs font-semibold text-[var(--color-accent)]">
                  {item.action}
                </span>
              </td>
              <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
              <td className={`${TD} font-mono text-[13px]`}>
                {item.targetPartnerId ||
                  item.targetEventId ||
                  item.targetOfferId ||
                  item.targetChallengeId ||
                  'N/A'}
              </td>
              <td className={TD}>{item.reason || '—'}</td>
              <td className={TD}>{item.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </TriadTable>
    </TableCard>
  );
}
