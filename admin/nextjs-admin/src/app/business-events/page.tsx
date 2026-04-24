'use client';

import { useEffect, useState } from 'react';
import { approveBusinessEvent, fetchPendingBusinessEvents, rejectBusinessEvent } from '@/lib/api';
import type { AdminBusinessEventSummary } from '@/lib/types';
import StateCard from '@/components/StateCard';

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

export default function PendingBusinessEventsPage() {
  const [items, setItems] = useState<AdminBusinessEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPendingBusinessEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pending events.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    try {
      await approveBusinessEvent(id, window.prompt('Optional admin note') ?? undefined);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Approve failed.');
    }
  }

  async function reject(id: string) {
    try {
      await rejectBusinessEvent(
        id,
        window.prompt('Rejection reason') ?? undefined,
        window.prompt('Optional admin note') ?? undefined,
      );
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Reject failed.');
    }
  }

  if (loading) return <StateCard title="Loading events" body="Fetching pending business events." />;
  if (error) return <StateCard title="Unable to load events" body={error} />;
  if (items.length === 0) return <StateCard title="No pending events" body="Everything is reviewed right now." />;

  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>Event</th>
              <th className={TH}>Business</th>
              <th className={TH}>Category</th>
              <th className={TH}>Start Date</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className={TD}>
                  <strong>{item.title}</strong>
                  <div className="text-sm text-[#667085] mt-1">{item.id}</div>
                </td>
                <td className={TD}>{item.businessName}</td>
                <td className={TD}>{item.category || 'Unspecified'}</td>
                <td className={TD}>{item.startDate ? new Date(item.startDate).toLocaleString() : 'Not set'}</td>
                <td className={TD}>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void approve(item.id)} className="rounded-lg bg-[#16a34a] px-3 py-2 text-sm font-semibold text-white">Approve</button>
                    <button type="button" onClick={() => void reject(item.id)} className="rounded-lg bg-[#dc2626] px-3 py-2 text-sm font-semibold text-white">Reject</button>
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
