'use client';

import { useEffect, useState } from 'react';
import {
  approveBusinessChallenge,
  fetchPendingBusinessChallenges,
  rejectBusinessChallenge,
  suspendBusinessChallenge,
} from '@/lib/api';
import type { AdminChallengeSummary } from '@/lib/types';
import StateCard from '@/components/StateCard';

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

export default function PendingBusinessChallengesPage() {
  const [items, setItems] = useState<AdminChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPendingBusinessChallenges());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pending challenges.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handle(action: 'approve' | 'reject' | 'suspend', id: string) {
    try {
      if (action === 'approve') {
        await approveBusinessChallenge(id, window.prompt('Optional admin note') ?? undefined);
      } else if (action === 'reject') {
        await rejectBusinessChallenge(
          id,
          window.prompt('Rejection reason') ?? undefined,
          window.prompt('Optional admin note') ?? undefined,
        );
      } else {
        await suspendBusinessChallenge(
          id,
          window.prompt('Suspension reason') ?? undefined,
          window.prompt('Optional admin note') ?? undefined,
        );
      }

      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Review action failed.');
    }
  }

  if (loading) return <StateCard title="Loading challenges" body="Fetching pending challenges." />;
  if (error) return <StateCard title="Unable to load challenges" body={error} />;
  if (items.length === 0) return <StateCard title="No pending challenges" body="Everything is reviewed right now." />;

  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>Prompt</th>
              <th className={TH}>Event</th>
              <th className={TH}>Business</th>
              <th className={TH}>Created</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className={TD}>
                  <strong>{item.prompt}</strong>
                </td>
                <td className={TD}>{item.eventTitle}</td>
                <td className={TD}>{item.businessName}</td>
                <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
                <td className={TD}>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void handle('approve', item.id)} className="rounded-lg bg-[#16a34a] px-3 py-2 text-sm font-semibold text-white">Approve</button>
                    <button type="button" onClick={() => void handle('reject', item.id)} className="rounded-lg bg-[#dc2626] px-3 py-2 text-sm font-semibold text-white">Reject</button>
                    <button type="button" onClick={() => void handle('suspend', item.id)} className="rounded-lg border border-[#d9e0ec] px-3 py-2 text-sm font-semibold text-[#0f172a]">Suspend</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}
