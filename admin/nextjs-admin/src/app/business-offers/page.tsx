'use client';

import { useEffect, useState } from 'react';
import { approveBusinessOffer, fetchPendingBusinessOffers, rejectBusinessOffer } from '@/lib/api';
import type { AdminBusinessOfferSummary } from '@/lib/types';
import StateCard from '@/components/StateCard';
import {
  ACTION_BTN_DANGER,
  ACTION_BTN_SUCCESS,
  TableCard,
  TriadTable,
  TD,
  TH,
  TR_HOVER,
} from '@/components/TableShell';

export default function PendingBusinessOffersPage() {
  const [items, setItems] = useState<AdminBusinessOfferSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPendingBusinessOffers());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load pending offers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function approve(id: string) {
    try {
      await approveBusinessOffer(id, window.prompt('Optional admin note') ?? undefined);
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Approve failed.');
    }
  }

  async function reject(id: string) {
    try {
      await rejectBusinessOffer(
        id,
        window.prompt('Rejection reason') ?? undefined,
        window.prompt('Optional admin note') ?? undefined,
      );
      await load();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Reject failed.');
    }
  }

  if (loading) return <StateCard title="Loading offers" body="Fetching pending business offers." />;
  if (error) return <StateCard title="Unable to load offers" body={error} />;
  if (items.length === 0) return <StateCard title="No pending offers" body="Everything is reviewed right now." />;

  return (
    <TableCard>
      <TriadTable className="min-w-[980px]">
        <thead>
          <tr>
            <th className={TH}>Offer</th>
            <th className={TH}>Event</th>
            <th className={TH}>Business</th>
            <th className={TH}>Type</th>
            <th className={TH}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={TR_HOVER}>
              <td className={TD}>
                <strong className="text-[var(--color-ink)]">{item.title}</strong>
                <div className="text-xs text-[var(--color-muted-ink)] mt-1 font-mono">
                  {item.id}
                </div>
              </td>
              <td className={TD}>{item.eventTitle}</td>
              <td className={TD}>{item.businessName}</td>
              <td className={TD}>{item.offerType}</td>
              <td className={TD}>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void approve(item.id)}
                    className={ACTION_BTN_SUCCESS}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => void reject(item.id)}
                    className={ACTION_BTN_DANGER}
                  >
                    Reject
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
