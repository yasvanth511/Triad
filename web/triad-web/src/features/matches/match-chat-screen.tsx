"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { HeartHandshake, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useSession } from "@/components/providers/session-provider";
import { getMatches, getMessages, getNotifications, markNotificationRead, sendImpressMe, sendMessage } from "@/lib/api/services";
import { formatRelativeDate } from "@/lib/utils";

export function MatchChatScreen({ matchId }: { matchId: string }) {
  const { token, currentUser } = useSession();
  const [draft, setDraft] = useState("");
  const queryClient = useQueryClient();
  const hasMarkedRef = useRef(false);

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

  const notificationsQuery = useQuery({
    queryKey: ["notifications", token],
    queryFn: () => getNotifications(token!),
    enabled: Boolean(token),
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!messagesQuery.isSuccess || !notificationsQuery.data || !token || hasMarkedRef.current) return;

    const toMark = notificationsQuery.data.notifications.filter(
      (n) => n.type === "MessageReceived" && n.referenceId === matchId && !n.isRead,
    );

    hasMarkedRef.current = true;

    if (toMark.length === 0) return;

    void Promise.all(toMark.map((n) => markNotificationRead(token, n.id))).then(() =>
      queryClient.invalidateQueries({ queryKey: ["notifications", token] }),
    );
  }, [matchId, messagesQuery.isSuccess, notificationsQuery.data, queryClient, token]);

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

      <Card className="space-y-5">
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
            <div className="space-y-1 rounded-[20px] bg-white/55 px-4 py-5 text-center">
              <p className="text-base font-semibold text-[var(--color-ink)]">No messages yet</p>
              <p className="text-sm leading-6 text-[var(--color-muted-ink)]">
                Say hi to start the conversation.
              </p>
            </div>
          )}
        </div>

        <form
          className="flex flex-col gap-3 border-t border-white/60 pt-4 sm:flex-row sm:items-center"
          onSubmit={(event) => {
            event.preventDefault();
            const trimmedDraft = draft.trim();
            if (!trimmedDraft) {
              return;
            }
            sendMutation.mutate(trimmedDraft);
          }}
        >
          <label htmlFor="chat-message-input" className="sr-only">
            Message
          </label>
          <Input
            id="chat-message-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Send a message"
            autoComplete="off"
            enterKeyHint="send"
            className="h-14 flex-1 rounded-[20px] border-2 px-5 text-base placeholder:text-base"
          />
          <Button
            type="submit"
            size="lg"
            disabled={sendMutation.isPending || !draft.trim()}
            className="h-14 w-full sm:w-auto sm:px-7"
          >
            <Send className="size-5 shrink-0" aria-hidden="true" />
            <span>Send</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}
