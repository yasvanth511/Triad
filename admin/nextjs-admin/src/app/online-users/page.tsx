'use client';

import { useEffect, useState } from 'react';
import { fetchOnlineUsers } from '@/lib/api';
import type { UserSummary } from '@/lib/types';
import StateCard from '@/components/StateCard';
import StatusPill from '@/components/StatusPill';

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

export default function OnlineUsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOnlineUsers()
      .then((data) => {
        setUsers(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'The admin API request failed.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="grid gap-4">
      {loading && (
        <StateCard
          title="Loading online users"
          body="Fetching users with active realtime presence."
        />
      )}
      {!loading && error && <StateCard title="Unable to load online users" body={error} />}
      {!loading && !error && users.length === 0 && (
        <StateCard title="No users online" body="No active users are connected right now." />
      )}
      {!loading && !error && users.length > 0 && (
        <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className={TH}>User ID</th>
                  <th className={TH}>Display Name</th>
                  <th className={TH}>Account Status</th>
                  <th className={TH}>Profile Type</th>
                  <th className={TH}>Verification</th>
                  <th className={TH}>Online</th>
                  <th className={TH}>Geography</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f5f7fb]">
                    <td className={`${TD} font-mono text-[13px]`}>
                      {String(user.id ?? 'Unavailable')}
                    </td>
                    <td className={TD}>{user.displayName ?? 'Unavailable'}</td>
                    <td className={TD}>
                      <StatusPill value={user.accountStatus ?? 'Unknown'} type="account" />
                    </td>
                    <td className={TD}>
                      <StatusPill value={user.profileType ?? 'Unknown'} type="profile" />
                    </td>
                    <td className={TD}>{user.verificationSummary ?? 'Unavailable'}</td>
                    <td className={TD}>
                      <StatusPill value={user.onlineStatus ?? 'Online'} type="online" />
                    </td>
                    <td className={TD}>{user.geographySummary ?? 'Unavailable'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </div>
  );
}
