import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, Heart, MessageCircle, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function NotificationRow({
  notification,
  href,
  action,
}: {
  notification: AppNotification;
  href?: string;
  action?: ReactNode;
}) {
  const appearance = resolveAppearance(notification.type);
  const content = (
    <Card className={`flex items-start gap-4 p-4 ${notification.isRead ? "opacity-70" : ""}`}>
      <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl ${appearance.panel}`}>
        <appearance.icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start gap-2">
          <h3 className="min-w-0 flex-1 text-sm font-semibold text-[var(--color-ink)]">
            {notification.title}
          </h3>
          {appearance.badge ? <Badge tone={appearance.badge}>{appearance.label}</Badge> : null}
        </div>
        <p className="text-sm leading-6 text-[var(--color-muted-ink)]">{notification.body}</p>
        <p className="text-xs text-[var(--color-muted-ink)]">{formatRelativeDate(notification.createdAt)}</p>
      </div>
      {action}
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function resolveAppearance(type: AppNotification["type"]) {
  switch (type) {
    case "LikeReceived":
      return { icon: Heart, label: "Like", badge: "secondary" as const, panel: "bg-rose-500/10 text-rose-700" };
    case "MatchCreated":
      return { icon: Users, label: "Match", badge: "accent" as const, panel: "bg-violet-500/10 text-violet-700" };
    case "MessageReceived":
      return { icon: MessageCircle, label: "Message", badge: "blue" as const, panel: "bg-sky-500/10 text-sky-700" };
    case "ImpressMeReceived":
      return { icon: Sparkles, label: "Challenge", badge: "accent" as const, panel: "bg-fuchsia-500/10 text-fuchsia-700" };
    default:
      return { icon: Bell, label: "Update", badge: "muted" as const, panel: "bg-slate-500/10 text-slate-700" };
  }
}
