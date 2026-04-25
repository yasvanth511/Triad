'use client';

import { usePathname } from 'next/navigation';

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

export default function Header({ onLogout }: { onLogout?: () => void }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <header className="px-8 pt-6 pb-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
            Admin
          </p>
          <h2 className="m-0 text-2xl font-bold">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#16a34a] font-semibold">Authenticated</span>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-[#d9e0ec] bg-white px-3 py-2 text-sm font-semibold text-[#0f172a] hover:bg-[#f5f7fb]"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
