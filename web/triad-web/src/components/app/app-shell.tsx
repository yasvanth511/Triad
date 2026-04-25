"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookMarked,
  Calendar,
  HeartHandshake,
  LayoutGrid,
  MessageCircleHeart,
  Sparkles,
  UserRound,
} from "lucide-react";
import type { PropsWithChildren } from "react";

import { LogoWordmark } from "@/components/app/logo-wordmark";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/providers/session-provider";

const primaryNav = [
  { href: "/discover", label: "Discover", icon: Sparkles },
  { href: "/saved", label: "Saved", icon: BookMarked },
  { href: "/matches", label: "Matches", icon: MessageCircleHeart },
  { href: "/impress-me", label: "Impress Me", icon: HeartHandshake },
  { href: "/events", label: "Events", icon: Calendar },
];

const secondaryNav = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
];

export function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { currentUser } = useSession();

  return (
    <div style={{ paddingBottom: "var(--bottom-nav-clearance)" }}>
      <div className="screen-wrap grid gap-6 py-5 lg:grid-cols-[268px_minmax(0,1fr)] lg:py-8">
        <aside className="glass-panel sticky top-6 hidden self-start rounded-[30px] p-5 lg:block">
          <div className="space-y-6">
            <div className="space-y-2">
              <LogoWordmark className="block" />
              <p className="text-sm leading-6 text-[var(--color-muted-ink)] break-words">
                Couple-aware discovery, softer intent, and the same Triad feel adapted for web.
              </p>
            </div>

            <nav className="space-y-2">
              {primaryNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </nav>

            <div className="border-t border-white/60 pt-4">
              <div className="space-y-2">
                {secondaryNav.map((item) => (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    active={pathname.startsWith(item.href)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[24px] bg-[linear-gradient(135deg,rgba(124,77,255,0.10),rgba(219,38,119,0.10))] p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={currentUser?.photos[0]?.url}
                  alt={currentUser?.username || "You"}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                    {currentUser?.username || "Signed in"}
                  </p>
                  <p className="truncate text-xs text-[var(--color-muted-ink)]">
                    {currentUser?.isCouple ? "Couple profile" : "Single profile"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <header className="glass-panel flex items-center justify-between rounded-[26px] px-5 py-4 lg:hidden">
            <div className="flex items-center gap-3">
              <LayoutGrid className="size-5 text-[var(--color-accent)]" />
              <LogoWordmark className="text-3xl" />
            </div>
            <Link href="/profile" className="flex items-center gap-2">
              <Avatar src={currentUser?.photos[0]?.url} alt={currentUser?.username || "You"} className="size-10" />
            </Link>
          </header>

          <main className="space-y-5">{children}</main>
        </div>
      </div>

      <nav
        className="glass-panel fixed inset-x-4 z-40 flex items-center justify-around rounded-[28px] px-2 py-2 lg:hidden"
        style={{ bottom: "calc(1rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {primaryNav.map((item) => (
          <MobileNavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            active={pathname.startsWith(item.href)}
          />
        ))}
      </nav>
    </div>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Sparkles;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-[linear-gradient(135deg,rgba(124,77,255,0.14),rgba(219,38,119,0.12))] text-[var(--color-ink)]"
          : "text-[var(--color-muted-ink)] hover:bg-white/55 hover:text-[var(--color-ink)]",
      )}
    >
      <Icon className={cn("size-5", active ? "text-[var(--color-accent)]" : "text-current")} />
      <span>{label}</span>
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof Sparkles;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[0.7rem] font-semibold",
        active ? "text-[var(--color-accent)]" : "text-[var(--color-muted-ink)]",
      )}
    >
      <Icon className={cn("size-5", active ? "fill-[rgba(124,77,255,0.12)]" : "")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}
