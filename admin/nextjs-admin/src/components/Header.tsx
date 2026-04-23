'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Users',
  '/online-users': 'Online Users',
  '/geography': 'Geography Analytics',
  '/moderation': 'Moderation Analytics',
};

export default function Header() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <header className="flex items-center justify-between px-8 pt-6 pb-3">
      <div>
        <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.04em] uppercase text-[#667085]">
          Admin
        </p>
        <h2 className="m-0 text-2xl font-bold">{title}</h2>
      </div>
    </header>
  );
}
