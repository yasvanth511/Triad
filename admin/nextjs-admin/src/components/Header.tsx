'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { clearAdminToken, getAdminToken, saveAdminToken } from '@/lib/api';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Users',
  '/online-users': 'Online Users',
  '/geography': 'Geography Analytics',
  '/moderation': 'Moderation Analytics',
  '/businesses': 'Pending Businesses',
  '/business-events': 'Pending Events',
  '/business-offers': 'Pending Offers',
  '/business-challenges': 'Pending Challenges',
  '/business-audit': 'Business Audit',
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Admin';
  const [token, setToken] = useState('');

  useEffect(() => {
    setToken(getAdminToken());
  }, []);

  return (
    <header className="flex items-center justify-between px-8 pt-6 pb-3">
      <div>
        <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
          Admin
        </p>
        <h2 className="m-0 text-2xl font-bold">{title}</h2>
      </div>
      <div className="flex items-center gap-2">
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Admin bearer token"
          className="w-[280px] rounded-xl border border-[#d9e0ec] bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            saveAdminToken(token.trim());
            window.location.reload();
          }}
          className="rounded-xl bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white"
        >
          Save token
        </button>
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            setToken('');
            window.location.reload();
          }}
          className="rounded-xl border border-[#d9e0ec] bg-white px-3 py-2 text-sm font-semibold text-[#0f172a]"
        >
          Clear
        </button>
      </div>
    </header>
  );
}
