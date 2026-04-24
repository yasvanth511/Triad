"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Trophy } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getChallenge, getChallengeResponses, markWinner } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";

export default function ChallengeResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useSession();
  const qc = useQueryClient();

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(token!, id),
    enabled: !!token,
  });

  const responsesQuery = useQuery({
    queryKey: ["challenge-responses", id, challengeQuery.data?.id],
    queryFn: () => getChallengeResponses(token!, challengeQuery.data!.id),
    enabled: !!token && !!challengeQuery.data?.id,
  });

  const winnerMutation = useMutation({
    mutationFn: (responseId: string) => markWinner(token!, challengeQuery.data!.id, responseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenge-responses", id, challengeQuery.data?.id] });
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      toast.success("Winner selected and reward issued.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Unable to select winner."),
  });

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Link href={`/events/${id}/challenge`} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to Challenge
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-[var(--color-ink)]">Challenge Responses</h1>
          <p className="text-sm text-[var(--color-muted-ink)] mt-1">
            Responses are private. Winners receive their reward when selected.
          </p>
        </div>
        {challengeQuery.data && <StatusBadge status={challengeQuery.data.status} />}
      </div>

      {challengeQuery.data && (
        <div className="glass-panel rounded-2xl p-5 space-y-2">
          <p className="font-semibold text-[var(--color-ink)]">{challengeQuery.data.prompt}</p>
          <p className="text-sm text-[var(--color-muted-ink)]">
            {challengeQuery.data.responseCount} responses · {challengeQuery.data.winnerCount} winners
          </p>
        </div>
      )}

      {responsesQuery.data?.length === 0 && (
        <div className="glass-panel rounded-2xl p-8 text-center text-sm text-[var(--color-muted-ink)]">
          No responses yet.
        </div>
      )}

      <div className="space-y-4">
        {responsesQuery.data?.map((response) => (
          <div key={response.id} className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-[var(--color-ink)]">{response.username}</p>
                <p className="text-xs text-[var(--color-muted-ink)]">
                  Submitted {new Date(response.submittedAt).toLocaleString()}
                </p>
              </div>
              <StatusBadge status={response.status} />
            </div>
            <p className="text-sm text-[var(--color-ink)] whitespace-pre-wrap">{response.responseText}</p>
            {response.status !== "Winner" && challengeQuery.data?.status === "Active" && (
              <Button
                size="sm"
                loading={winnerMutation.isPending}
                onClick={() => winnerMutation.mutate(response.id)}
              >
                <Trophy className="w-4 h-4" />
                Mark as Winner
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
