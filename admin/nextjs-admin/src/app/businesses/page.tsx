'use client';

import { useEffect, useState } from 'react';
import {
  approveBusiness,
  fetchPendingBusinesses,
  rejectBusiness,
  suspendBusiness,
} from '@/lib/api';
import type { AdminBusinessPartnerSummary } from '@/lib/types';
import StateCard from '@/components/StateCard';

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

export default function PendingBusinessesPage() {
  const [items, setItems] = useState<AdminBusinessPartnerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPendingBusinesses());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pending businesses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleReview(
    action: 'approve' | 'reject' | 'suspend',
    item: AdminBusinessPartnerSummary,
  ) {
    const note = window.prompt('Optional admin note') ?? undefined;
    const reason =
      action === 'approve'
        ? undefined
        : window.prompt(action === 'reject' ? 'Rejection reason' : 'Suspension reason') ?? undefined;

    try {
      if (action === 'approve') await approveBusiness(item.id, note);
      if (action === 'reject') await rejectBusiness(item.id, reason, note);
      if (action === 'suspend') await suspendBusiness(item.id, reason, note);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Review action failed.');
    }
  }

  if (loading) return <StateCard title="Loading businesses" body="Fetching pending business partners." />;
  if (error) return <StateCard title="Unable to load businesses" body={error} />;
  if (items.length === 0) return <StateCard title="No pending businesses" body="Everything is reviewed right now." />;

  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>Business</th>
              <th className={TH}>Contact</th>
              <th className={TH}>Category</th>
              <th className={TH}>Created</th>
              <th className={TH}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className={TD}>
                  <strong>{item.businessName || item.username}</strong>
                  <div className="text-sm text-[#667085] mt-1">{item.username}</div>
                </td>
                <td className={TD}>{item.email}</td>
                <td className={TD}>{item.category || 'Unspecified'}</td>
                <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
                <td className={TD}>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void handleReview('approve', item)} className="rounded-lg bg-[#16a34a] px-3 py-2 text-sm font-semibold text-white">Approve</button>
                    <button type="button" onClick={() => void handleReview('reject', item)} className="rounded-lg bg-[#dc2626] px-3 py-2 text-sm font-semibold text-white">Reject</button>
                    <button type="button" onClick={() => void handleReview('suspend', item)} className="rounded-lg border border-[#d9e0ec] px-3 py-2 text-sm font-semibold text-[#0f172a]">Suspend</button>
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
