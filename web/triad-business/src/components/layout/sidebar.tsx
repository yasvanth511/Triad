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

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, partner, signOut } = useSession();

  return (
    <aside
      className="md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex md:flex-col z-20 border-b border-white/10 md:border-b-0"
      style={{ background: "var(--color-sidebar)" }}
    >
      {/* Brand */}
      <div className="px-5 py-5 md:border-b md:border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Triad</p>
            <p className="text-white/50 text-xs">for Business</p>
          </div>
        </div>
      </div>

      {/* Business status */}
      {partner && (
        <div className="hidden md:block px-4 py-3 border-b border-white/10">
          <p className="text-white/70 text-xs truncate">{partner.profile?.businessName ?? currentUser?.username}</p>
          <span
            className={clsx(
              "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
              partner.status === "Approved"
                ? "bg-emerald-500/20 text-emerald-300"
                : partner.status === "Pending"
                  ? "bg-amber-500/20 text-amber-300"
                  : partner.status === "Suspended"
                    ? "bg-pink-500/20 text-pink-300"
                    : "bg-red-500/20 text-red-300",
            )}
          >
            {partner.status}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 md:py-4 md:space-y-0.5 overflow-x-auto md:overflow-y-auto">
        <div className="flex gap-2 md:grid md:gap-0.5 min-w-max md:min-w-0">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all whitespace-nowrap",
                active
                  ? "bg-[var(--color-sidebar-active)] text-white font-semibold"
                  : "text-white/60 hover:text-white hover:bg-[var(--color-sidebar-hover)]",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
        </div>
      </nav>

      {/* Sign out */}
      <div className="hidden md:block px-3 pb-4">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white/80 hover:bg-white/5 w-full transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
