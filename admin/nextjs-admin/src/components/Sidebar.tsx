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
    <aside className="glass-panel sticky top-6 self-start rounded-[30px] p-5">
      <div className="mb-6">
        <p className="m-0 mb-1.5 text-xs font-semibold tracking-[0.12em] uppercase text-[var(--color-muted-ink)]">
          Triad
        </p>
        <h1 className="m-0 text-base font-bold leading-snug text-[var(--color-ink)]">
          Admin Control Center
        </h1>
      </div>
      <nav className="grid gap-2" aria-label="Admin sections">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold no-underline transition ${
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))] text-[var(--color-ink)]'
                  : 'text-[var(--color-muted-ink)] hover:bg-white/55 hover:text-[var(--color-ink)]'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isActive
                    ? 'bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))]'
                    : 'bg-current opacity-30'
                }`}
                aria-hidden="true"
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,rgba(124,77,255,0.10),rgba(219,38,119,0.10))] p-4">
        <p className="m-0 text-xs font-semibold tracking-[0.08em] uppercase text-[var(--color-muted-ink)]">
          Operations
        </p>
        <p className="mt-1 mb-0 text-sm text-[var(--color-ink)]">
          Review pending content and monitor platform health.
        </p>
      </div>
    </aside>
  );
}
