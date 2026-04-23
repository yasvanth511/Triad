import Link from "next/link";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import type { MatchItem } from "@/lib/types";

export function MatchCard({ match }: { match: MatchItem }) {
  return (
    <Link href={`/matches/${match.matchId}`}>
      <Card className="space-y-4 transition duration-200 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-[var(--color-ink)]">
              {match.participants.map((participant) => participant.username).join(", ") || "Unknown match"}
            </h3>
            <p className="text-sm text-[var(--color-muted-ink)]">{formatRelativeDate(match.matchedAt)}</p>
          </div>
          <Badge tone={match.isGroupChat ? "secondary" : "accent"}>
            {match.isGroupChat ? "Group" : "Direct"}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-3">
          {match.participants.map((participant) => (
            <div key={participant.userId} className="flex min-w-0 items-center gap-3 rounded-2xl bg-white/55 px-3 py-2">
              <Avatar src={participant.photos[0]?.url} alt={participant.username} className="size-11" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                  {participant.username}
                </p>
                <p className="line-clamp-1 text-xs text-[var(--color-muted-ink)]">
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
