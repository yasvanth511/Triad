"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ScreenHeader } from "@/components/app/screen-header";
import { ImpressMeCard } from "@/components/domain/impress-me-card";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Textarea } from "@/components/ui/textarea";
import {
  acceptImpressMe,
  declineImpressMe,
  getImpressMeInbox,
  respondToImpressMe,
  reviewImpressMe,
} from "@/lib/api/services";
import type { ImpressMeSignal } from "@/lib/types";

const respondSchema = z.object({
  textContent: z.string().trim().min(1, "Write a reply.").max(1000, "Keep it under 1000 characters."),
});

type RespondValues = z.infer<typeof respondSchema>;

export function ImpressMeScreen() {
  const { token } = useSession();
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [replyingTo, setReplyingTo] = useState<ImpressMeSignal | null>(null);
  const [reviewing, setReviewing] = useState<ImpressMeSignal | null>(null);

  const inboxQuery = useQuery({
    queryKey: ["impress-me", token],
    queryFn: () => getImpressMeInbox(token!),
    enabled: Boolean(token),
  });

  const respondForm = useForm<RespondValues>({
    resolver: zodResolver(respondSchema),
    defaultValues: { textContent: "" },
  });

  const respondMutation = useMutation({
    mutationFn: (payload: { signalId: string; textContent: string }) =>
      respondToImpressMe(token!, payload.signalId, payload.textContent),
    onSuccess: async () => {
      setReplyingTo(null);
      respondForm.reset();
      await inboxQuery.refetch();
      toast.success("Response sent.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Reply failed."),
  });

  const reviewMutation = useMutation({
    mutationFn: (signalId: string) => reviewImpressMe(token!, signalId),
    onSuccess: async () => {
      await inboxQuery.refetch();
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (signalId: string) => acceptImpressMe(token!, signalId),
    onSuccess: async () => {
      setReviewing(null);
      await inboxQuery.refetch();
      toast.success("Impress Me accepted.");
    },
  });

  const declineMutation = useMutation({
    mutationFn: (signalId: string) => declineImpressMe(token!, signalId),
    onSuccess: async () => {
      setReviewing(null);
      await inboxQuery.refetch();
      toast.success("Impress Me declined.");
    },
  });

  const items = useMemo(
    () => (tab === "received" ? inboxQuery.data?.received || [] : inboxQuery.data?.sent || []),
    [inboxQuery.data?.received, inboxQuery.data?.sent, tab],
  );

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Impress Me"
        description="Triad’s challenge-response layer comes over cleanly to web, keeping the softer, more playful opening move intact."
      />

      <SegmentedControl
        items={[
          { label: "Received", value: "received", badge: inboxQuery.data?.unreadCount || 0 },
          {
            label: "Sent",
            value: "sent",
            badge: inboxQuery.data?.sent.filter((signal) => signal.status === "Responded").length || 0,
          },
        ]}
        value={tab}
        onChange={setTab}
      />

      {items.length === 0 ? (
        <EmptyState
          title={tab === "received" ? "No signals yet" : "Nothing sent yet"}
          message={
            tab === "received"
              ? "When someone sends you an Impress Me, it shows up here."
              : "Send an Impress Me from any profile to start a challenge."
          }
        />
      ) : (
        items.map((signal) => (
          <ImpressMeCard
            key={signal.id}
            signal={signal}
            role={tab === "received" ? "receiver" : "sender"}
            cta={
              tab === "received" ? (
                <div className="flex flex-wrap gap-3">
                  <Link href={`/profile/${signal.senderId}`}>
                    <Button variant="outline">View profile</Button>
                  </Link>
                  {signal.status === "Sent" ? (
                    <Button onClick={() => setReplyingTo(signal)}>Reply</Button>
                  ) : null}
                </div>
              ) : signal.status === "Responded" || signal.status === "Viewed" ? (
                <div className="flex flex-wrap gap-3">
                  <Button onClick={async () => {
                    if (signal.status === "Responded") {
                      await reviewMutation.mutateAsync(signal.id);
                    }
                    setReviewing(signal);
                  }}>
                    Review answer
                  </Button>
                </div>
              ) : null
            }
          />
        ))
      )}

      <Modal
        open={Boolean(replyingTo)}
        onClose={() => setReplyingTo(null)}
        title="Reply to Impress Me"
        description="Keep the response personal, playful, and within the same low-pressure tone as native."
      >
        <form
          className="space-y-4"
          onSubmit={respondForm.handleSubmit((values) => {
            if (!replyingTo) {
              return;
            }

            respondMutation.mutate({
              signalId: replyingTo.id,
              textContent: values.textContent,
            });
          })}
        >
          <Textarea
            placeholder="Write your response"
            {...respondForm.register("textContent")}
          />
          {respondForm.formState.errors.textContent ? (
            <p className="text-xs font-medium text-rose-600">
              {respondForm.formState.errors.textContent.message}
            </p>
          ) : null}
          <Button disabled={respondMutation.isPending}>Send response</Button>
        </form>
      </Modal>

      <Modal
        open={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title="Review response"
        description="Web adaptation: sender review and accept/decline stay together in one responsive surface."
      >
        {reviewing ? (
          <div className="space-y-4">
            <div className="rounded-[24px] bg-[color:rgba(219,38,119,0.07)] p-4">
              <p className="mb-2 text-sm font-semibold text-[var(--color-secondary)]">Their answer</p>
              <p className="text-sm leading-6 text-[var(--color-ink)]">
                {reviewing.response?.textContent || "No response body returned."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => acceptMutation.mutate(reviewing.id)}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                Accept
              </Button>
              <Button
                variant="outline"
                onClick={() => declineMutation.mutate(reviewing.id)}
                disabled={acceptMutation.isPending || declineMutation.isPending}
              >
                Decline
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
