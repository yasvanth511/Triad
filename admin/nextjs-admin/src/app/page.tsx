'use client';

import { useEffect, useState } from 'react';
import { fetchUsers } from '@/lib/api';
import type { UserSummary } from '@/lib/types';
import MetricCard from '@/components/MetricCard';
import StateCard from '@/components/StateCard';
import StatusPill from '@/components/StatusPill';
import UserDetailDrawer from '@/components/UserDetailDrawer';
import {
  ACTION_BTN_OUTLINE,
  TableCard,
  TriadTable,
  TD,
  TH,
  TR_HOVER,
} from '@/components/TableShell';

const PAGE_SIZE = 50;

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
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-2">
      <span className="text-sm text-[var(--color-muted-ink)]">
        {from}–{to} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          className={`${ACTION_BTN_OUTLINE} disabled:pointer-events-none disabled:opacity-50`}
        >
          Previous
        </button>
        <span className="px-2 text-sm font-semibold text-[var(--color-muted-ink)]">
          Page {page + 1} / {totalPages}
        </span>
        <button
          type="button"
          disabled={(page + 1) * pageSize >= total}
          onClick={() => onPage(page + 1)}
          className={`${ACTION_BTN_OUTLINE} disabled:pointer-events-none disabled:opacity-50`}
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
    <TableCard>
      <TriadTable className="min-w-[1080px]">
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
            <tr key={user.id} className={TR_HOVER}>
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
                  className={ACTION_BTN_OUTLINE}
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TriadTable>
    </TableCard>
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
          className={`grid gap-4 items-start ${
            selectedId != null
              ? 'lg:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]'
              : ''
          }`}
        >
          <div className="grid gap-3 min-w-0">
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
