"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { MatchCard } from "@/components/domain/match-card";
import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { getMatches, getNotifications } from "@/lib/api/services";

export function MatchesScreen() {
  const { token } = useSession();

  const matchesQuery = useQuery({
    queryKey: ["matches", token],
    queryFn: () => getMatches(token!),
    enabled: Boolean(token),
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", token],
    queryFn: () => getNotifications(token!),
    enabled: Boolean(token),
    staleTime: 15_000,
  });

  const unreadByMatchId = useMemo(() => {
    const notifications = notificationsQuery.data?.notifications ?? [];
    const counts: Record<string, number> = {};
    for (const n of notifications) {
      if (n.type === "MessageReceived" && !n.isRead && n.referenceId) {
        counts[n.referenceId] = (counts[n.referenceId] ?? 0) + 1;
      }
    }
    return counts;
  }, [notificationsQuery.data]);

  return (
    <div className="space-y-6">
      <ScreenHeader title="Matches" />

      {matchesQuery.isError ? (
        <EmptyState
          title="Matches unavailable"
          message={matchesQuery.error instanceof Error ? matchesQuery.error.message : "Try again later."}
        />
      ) : matchesQuery.data?.length ? (
        <div className="flex flex-col gap-4">
          {matchesQuery.data.map((match) => (
            <MatchCard
              key={match.matchId}
              match={match}
              unreadCount={unreadByMatchId[match.matchId] ?? 0}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matches yet"
          message="Likes that become mutual matches will show up here."
        />
      )}
    </div>
  );
}
