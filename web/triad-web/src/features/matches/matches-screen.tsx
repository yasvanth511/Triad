"use client";

import { useQuery } from "@tanstack/react-query";

import { MatchCard } from "@/components/domain/match-card";
import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { StateBanner } from "@/components/ui/state-banner";
import { getMatches } from "@/lib/api/services";

export function MatchesScreen() {
  const { token } = useSession();
  const matchesQuery = useQuery({
    queryKey: ["matches", token],
    queryFn: () => getMatches(token!),
    enabled: Boolean(token),
  });

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Matches"
        description="Mutual likes still roll into match cards and chat entry points, with the same group-aware participation model as native."
      />

      <StateBanner
        title="Realtime TODO"
        tone="blue"
        message="TODO: native SignalR-backed live chat updates should become a dedicated web realtime layer. This first web pass covers the REST-backed history and sending flow."
      />

      {matchesQuery.isError ? (
        <EmptyState
          title="Matches unavailable"
          message={matchesQuery.error instanceof Error ? matchesQuery.error.message : "Try again later."}
        />
      ) : matchesQuery.data?.length ? (
        matchesQuery.data.map((match) => <MatchCard key={match.matchId} match={match} />)
      ) : (
        <EmptyState
          title="No matches yet"
          message="Likes that become mutual matches will show up here."
        />
      )}
    </div>
  );
}
