'use client';

import { useEffect, useState } from 'react';
import { fetchUsers } from '@/lib/api';
import type { UserSummary } from '@/lib/types';
import MetricCard from '@/components/MetricCard';
import StateCard from '@/components/StateCard';
import StatusPill from '@/components/StatusPill';
import UserDetailDrawer from '@/components/UserDetailDrawer';

const PAGE_SIZE = 50;

const TH = 'px-3 py-3.5 border-b border-[#d9e0ec] text-left text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]';
const TD = 'px-3 py-3.5 border-b border-[#d9e0ec] align-top';

function UserStats({
  total,
  totalSingles,
  totalCouples,
}: {
  total: number;
  totalSingles: number;
  totalCouples: number;
}) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <MetricCard
        label="Total Users"
        value={total}
        description="All users returned by the admin API."
      />
      <MetricCard
        label="Singles"
        value={totalSingles}
        description="Profiles not linked to a couple."
      />
      <MetricCard
        label="Couples"
        value={totalCouples}
        description="Users currently linked to a couple profile."
      />
    </div>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between px-1 pt-2">
      <span className="text-sm text-[#667085]">
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className="border border-[#d9e0ec] rounded-[10px] bg-white text-[#1d4ed8] px-3 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dbeafe]"
        >
          Previous
        </button>
        <span className="flex items-center px-3 text-sm text-[#667085]">
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={(page + 1) * pageSize >= total}
          onClick={() => onPage(page + 1)}
          className="border border-[#d9e0ec] rounded-[10px] bg-white text-[#1d4ed8] px-3 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#dbeafe]"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function UsersTable({
  users,
  onView,
}: {
  users: UserSummary[];
  onView: (id: string | number) => void;
}) {
  return (
    <article className="bg-white border border-[#d9e0ec] rounded-[18px] p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse">
          <thead>
            <tr>
              <th className={TH}>User ID</th>
              <th className={TH}>Display Name</th>
              <th className={TH}>Account Status</th>
              <th className={TH}>Profile Type</th>
              <th className={TH}>Verification</th>
              <th className={TH}>Blocks</th>
              <th className={TH}>Reports</th>
              <th className={TH}>Online</th>
              <th className={TH}>Geography</th>
              <th className={TH}>Details</th>
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
                <td className={TD}>{user.blockCount ?? 0}</td>
                <td className={TD}>{user.reportCount ?? 0}</td>
                <td className={TD}>
                  <StatusPill value={user.onlineStatus ?? 'Unknown'} type="online" />
                </td>
                <td className={TD}>{user.geographySummary ?? 'Unavailable'}</td>
                <td className={TD}>
                  <button
                    type="button"
                    onClick={() => user.id != null && onView(user.id)}
                    className="border border-[#d9e0ec] rounded-[10px] bg-white text-[#1d4ed8] px-3 py-2 cursor-pointer text-sm font-semibold hover:bg-[#dbeafe]"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalSingles, setTotalSingles] = useState(0);
  const [totalCouples, setTotalCouples] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchUsers(page * PAGE_SIZE, PAGE_SIZE)
      .then((data) => {
        setUsers(data.items);
        setTotal(data.total);
        setTotalSingles(data.totalSingles);
        setTotalCouples(data.totalCouples);
        setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'The admin API request failed.');
        setLoading(false);
      });
  }, [page]);

  const selectedUser = selectedId != null ? users.find((u) => u.id === selectedId) : undefined;

  return (
    <div className="grid gap-4">
      <UserStats total={total} totalSingles={totalSingles} totalCouples={totalCouples} />

      {loading && (
        <StateCard title="Loading users" body="Fetching the latest admin user summary." />
      )}
      {!loading && error && <StateCard title="Unable to load users" body={error} />}
      {!loading && !error && users.length === 0 && (
        <StateCard title="No users yet" body="The admin API returned an empty user list." />
      )}
      {!loading && !error && users.length > 0 && (
        <div
          className="grid gap-4 items-start"
          style={
            selectedId != null
              ? { gridTemplateColumns: 'minmax(0, 1.7fr) minmax(320px, 0.9fr)' }
              : undefined
          }
        >
          <div className="grid gap-3">
            <UsersTable users={users} onView={setSelectedId} />
            <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
          </div>
          {selectedId != null && (
            <UserDetailDrawer
              userId={selectedId}
              displayName={selectedUser?.displayName}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </div>
  );
}
