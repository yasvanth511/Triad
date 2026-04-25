import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import type { MatchItem } from "@/lib/types";

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1.5 text-[0.65rem] font-bold leading-none text-white">
      {label}
    </span>
  );
}

export function MatchCard({ match, unreadCount = 0 }: { match: MatchItem; unreadCount?: number }) {
  return (
    <Link href={`/matches/${match.matchId}`}>
      <Card className="space-y-5 p-6 transition duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-[var(--color-ink)]">
              {match.participants.map((participant) => participant.username).join(", ") || "Unknown match"}
            </h3>
            <p className="text-sm text-[var(--color-muted-ink)]">{formatRelativeDate(match.matchedAt)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={match.isGroupChat ? "secondary" : "accent"}>
              {match.isGroupChat ? "Group" : "Direct"}
            </Badge>
            <UnreadBadge count={unreadCount} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {match.participants.map((participant) => (
            <div key={participant.userId} className="flex min-w-[160px] flex-1 items-center gap-3 rounded-2xl bg-white/55 px-4 py-3">
              <Avatar src={participant.photos[0]?.url} alt={participant.username} className="size-12 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                  {participant.username}
                </p>
                <p className="line-clamp-2 text-xs leading-relaxed text-[var(--color-muted-ink)]">
                  {participant.bio || "No bio yet."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </Link>
  );
}
