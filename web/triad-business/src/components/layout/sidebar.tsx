"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  CalendarDays,
  Gift,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  User,
} from "lucide-react";
import { clsx } from "clsx";
import { useSession } from "@/components/providers/session-provider";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: CalendarDays, label: "Events" },
  { href: "/offers", icon: Gift, label: "Offers" },
  { href: "/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/profile", icon: User, label: "Business Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const partnerStatusTone: Record<string, string> = {
  Approved: "bg-emerald-500/15 text-emerald-700",
  Pending: "bg-amber-500/15 text-amber-700",
  Suspended: "bg-rose-500/15 text-rose-700",
  Rejected: "bg-rose-500/15 text-rose-700",
};

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, partner, signOut } = useSession();

  return (
    <aside className="z-20 md:fixed md:inset-y-4 md:left-4 md:w-60 md:flex md:flex-col">
      <div className="glass-panel md:flex md:flex-1 md:flex-col rounded-[26px] md:rounded-[30px] md:p-5">
        {/* Brand */}
        <div className="px-4 py-4 md:p-0 md:pb-5 flex items-center justify-between md:justify-start gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white shadow-[0_12px_24px_rgba(119,86,223,0.24)]">
              <Sparkles className="size-5" />
            </span>
            <span>
              <span className="block font-[family:var(--font-display)] text-xl font-black leading-tight tracking-[-0.04em] text-[var(--color-ink)]">
                Triad
              </span>
              <span className="block text-xs text-[var(--color-muted-ink)]">for Business</span>
            </span>
          </Link>
        </div>

        {/* Business status */}
        {partner && (
          <div className="hidden md:block border-t border-white/60 pt-4">
            <p className="truncate text-xs font-semibold text-[var(--color-muted-ink)]">
              {partner.profile?.businessName ?? currentUser?.username}
            </p>
            <span
              className={clsx(
                "mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                partnerStatusTone[partner.status] ?? "bg-slate-500/10 text-slate-600",
              )}
            >
              {partner.status}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 pb-3 md:px-0 md:pb-0 md:pt-4 overflow-x-auto md:overflow-y-auto">
          <div className="flex min-w-max gap-2 md:min-w-0 md:flex-col md:gap-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={clsx(
                    "flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap",
                    active
                      ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))] text-[var(--color-ink)]"
                      : "text-[var(--color-muted-ink)] hover:bg-white/60 hover:text-[var(--color-ink)]",
                  )}
                >
                  <Icon
                    className={clsx(
                      "size-5 shrink-0",
                      active ? "text-[var(--color-accent)]" : "text-current",
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sign out */}
        <div className="hidden md:block border-t border-white/60 pt-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-[var(--color-muted-ink)] transition hover:bg-white/60 hover:text-[var(--color-ink)]"
          >
            <LogOut className="size-5" />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}
