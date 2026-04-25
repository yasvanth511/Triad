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
    <TableCard>
      <TriadTable className="min-w-[980px]">
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
            <tr key={item.id} className={TR_HOVER}>
              <td className={TD}>
                <strong className="text-[var(--color-ink)]">{item.prompt}</strong>
              </td>
              <td className={TD}>{item.eventTitle}</td>
              <td className={TD}>{item.businessName}</td>
              <td className={TD}>{new Date(item.createdAt).toLocaleString()}</td>
              <td className={TD}>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handle('approve', item.id)}
                    className={ACTION_BTN_SUCCESS}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void handle('reject', item.id)}
                    className={ACTION_BTN_DANGER}
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => void handle('suspend', item.id)}
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
