"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { HeartHandshake, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { getMatches, getMessages, sendImpressMe, sendMessage } from "@/lib/api/services";
import { formatRelativeDate } from "@/lib/utils";

export function MatchChatScreen({ matchId }: { matchId: string }) {
  const { token, currentUser } = useSession();
  const [draft, setDraft] = useState("");

  const matchesQuery = useQuery({
    queryKey: ["matches", token],
    queryFn: () => getMatches(token!),
    enabled: Boolean(token),
  });

  const messagesQuery = useQuery({
    queryKey: ["messages", matchId, token],
    queryFn: () => getMessages(token!, matchId),
    enabled: Boolean(token),
  });

  const match = useMemo(
    () => matchesQuery.data?.find((item) => item.matchId === matchId) || null,
    [matchId, matchesQuery.data],
  );

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessage(token!, matchId, content),
    onSuccess: async () => {
      setDraft("");
      await messagesQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Message failed."),
  });

  const impressMutation = useMutation({
    mutationFn: () => sendImpressMe(token!, match?.participants[0]?.userId || "", matchId),
    onSuccess: () => toast.success("Impress Me sent."),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Impress Me failed."),
  });

  if (!match && matchesQuery.isFetched) {
    return (
      <EmptyState
        title="Match unavailable"
        message="We could not find this match in your current session."
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold text-[var(--color-ink)]">
              {match?.participants.map((participant) => participant.username).join(", ") || "Chat"}
            </h1>
            <p className="text-sm text-[var(--color-muted-ink)]">
              Matched {match ? formatRelativeDate(match.matchedAt) : "recently"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {match?.participants.map((participant) => (
              <Link
                key={participant.userId}
                href={`/profile/${participant.userId}`}
                className="flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-sm font-semibold text-[var(--color-ink)]"
              >
                <Avatar src={participant.photos[0]?.url} alt={participant.username} className="size-8" />
                {participant.username}
              </Link>
            ))}
          </div>
        </div>

        <Button variant="outline" onClick={() => impressMutation.mutate()} disabled={impressMutation.isPending || !match?.participants[0]}>
          <HeartHandshake className="size-4" />
          Send Impress Me
        </Button>
      </Card>

      <Card className="space-y-4">
        <div className="space-y-3">
          {messagesQuery.data?.length ? (
            messagesQuery.data.map((message) => {
              const isCurrentUser = message.senderId === currentUser?.id;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] space-y-1 ${isCurrentUser ? "items-end text-right" : ""}`}>
                    <p className="text-xs font-semibold text-[var(--color-muted-ink)]">
                      {isCurrentUser ? "You" : message.senderUsername}
                    </p>
                    <div
                      className={`rounded-[24px] px-4 py-3 text-sm leading-6 ${
                        isCurrentUser
                          ? "bg-[var(--color-accent)] text-white"
                          : "bg-white/80 text-[var(--color-ink)]"
                      }`}
                    >
                      {message.content}
                    </div>
                    <p className="text-xs text-[var(--color-muted-ink)]">{formatRelativeDate(message.sentAt)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No messages yet" message="Say hi to start the conversation." />
          )}
        </div>

        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedDraft = draft.trim();
            if (!trimmedDraft) {
              return;
            }
            sendMutation.mutate(trimmedDraft);
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message"
            className="flex-1"
          />
          <Button disabled={sendMutation.isPending || !draft.trim()}>
            <Send className="size-4" />
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
