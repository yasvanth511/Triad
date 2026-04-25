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
import {
  ACTION_BTN_DANGER,
  ACTION_BTN_OUTLINE,
  ACTION_BTN_SUCCESS,
  TableCard,
  TriadTable,
  TD,
  TH,
  TR_HOVER,
} from '@/components/TableShell';

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
    <TableCard>
      <TriadTable className="min-w-[980px]">
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
            <tr key={item.id} className={TR_HOVER}>
              <td className={TD}>
                <strong className="text-[var(--color-ink)]">
                  {item.businessName || item.username}
                </strong>
                <div className="text-xs text-[var(--color-muted-ink)] mt-1">{item.username}</div>
              </td>
              <td className={TD}>{item.email}</td>
              <td className={TD}>{item.category || 'Unspecified'}</td>
              <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
              <td className={TD}>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleReview('approve', item)}
                    className={ACTION_BTN_SUCCESS}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReview('reject', item)}
                    className={ACTION_BTN_DANGER}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleReview('suspend', item)}
                    className={ACTION_BTN_OUTLINE}
                  >
                    Suspend
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TriadTable>
    </TableCard>
  );
}
