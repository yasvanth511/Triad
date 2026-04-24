'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Users' },
  { href: '/online-users', label: 'Online Users' },
  { href: '/geography', label: 'Geography Analytics' },
  { href: '/moderation', label: 'Moderation Analytics' },
  { href: '/businesses', label: 'Pending Businesses' },
  { href: '/business-events', label: 'Pending Events' },
  { href: '/business-offers', label: 'Pending Offers' },
  { href: '/business-challenges', label: 'Pending Challenges' },
  { href: '/business-audit', label: 'Business Audit' },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-[#0f172a] text-[#f8fafc] px-[18px] py-6 min-h-screen">
      <div className="mb-7">
        <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.08em] uppercase text-[#94a3b8]">
          Third Wheel
        </p>
        <h1 className="m-0 text-base font-bold leading-snug">Admin Control Center</h1>
      </div>
      <nav className="grid gap-2" aria-label="Admin sections">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block w-full border rounded-xl px-3.5 py-3 text-[#f8fafc] text-sm no-underline transition-colors ${
                isActive
                  ? 'bg-white/10 border-white/20'
                  : 'border-transparent hover:bg-white/10 hover:border-white/20'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
