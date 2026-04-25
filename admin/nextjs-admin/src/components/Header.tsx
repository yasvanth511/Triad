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
    <header className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-[26px] px-6 py-5">
      <div>
        <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-muted-ink)]">
          Admin
        </p>
        <h2 className="page-title m-0 text-[var(--color-ink)]">{title}</h2>
      </div>
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-700">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          Authenticated
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/70 bg-white/60 px-4 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-white/80"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
