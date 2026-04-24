"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Send, Sparkles, Trash2, Trophy } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import {
  createChallenge,
  deleteChallenge,
  getChallenge,
  getMyEvent,
  submitChallengeForApproval,
  updateChallenge,
} from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";

const schema = z.object({
  prompt: z.string().min(5, "Required"),
  rewardType: z.enum(["Coupon", "FreeEntry", "Discount", "Merchandise", "Other"]),
  rewardDescription: z.string().optional(),
  maxWinners: z.coerce.number().positive().optional().or(z.literal("")),
  expiryDate: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useSession();
  const qc = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["my-event", id],
    queryFn: () => getMyEvent(token!, id),
    enabled: !!token,
  });

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(token!, id),
    enabled: !!token,
    retry: false,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rewardType: "Coupon" },
  });

  useEffect(() => {
    if (!challengeQuery.data) return;
    reset({
      prompt: challengeQuery.data.prompt,
      rewardType: challengeQuery.data.rewardType,
      rewardDescription: challengeQuery.data.rewardDescription ?? "",
      maxWinners: challengeQuery.data.maxWinners ?? "",
      expiryDate: challengeQuery.data.expiryDate ? challengeQuery.data.expiryDate.slice(0, 10) : "",
    });
  }, [challengeQuery.data, reset]);

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      createChallenge(token!, id, {
        prompt: data.prompt,
        rewardType: data.rewardType,
        rewardDescription: data.rewardDescription,
        maxWinners: data.maxWinners === "" ? undefined : data.maxWinners,
        expiryDate: data.expiryDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["my-event", id] });
      toast.success("Challenge created.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Create failed."),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      updateChallenge(token!, challengeQuery.data!.id, {
        prompt: data.prompt,
        rewardType: data.rewardType,
        rewardDescription: data.rewardDescription,
        maxWinners: data.maxWinners === "" ? undefined : data.maxWinners,
        expiryDate: data.expiryDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["my-event", id] });
      toast.success("Challenge updated.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed."),
  });

  const submitMutation = useMutation({
    mutationFn: () => submitChallengeForApproval(token!, challengeQuery.data!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      toast.success("Challenge submitted for approval.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submit failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteChallenge(token!, challengeQuery.data!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["challenge", id] });
      qc.invalidateQueries({ queryKey: ["my-event", id] });
      reset({ prompt: "", rewardType: "Coupon", rewardDescription: "", maxWinners: "", expiryDate: "" });
      toast.success("Challenge deleted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed."),
  });

  const challenge = challengeQuery.data;
  const hasChallenge = Boolean(challenge);
  const canSubmit = challenge && (challenge.status === "Draft" || challenge.status === "Rejected");
  const canDelete = challenge?.status === "Draft";

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6">
      <Link href={`/events/${id}`} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="page-title text-[var(--color-ink)]">Event Challenge</h1>
          <p className="text-sm text-[var(--color-muted-ink)] mt-1">
            Add a private response prompt and pick winners after review.
          </p>
        </div>
        {challenge && <StatusBadge status={challenge.status} />}
      </div>

      {eventQuery.data && (
        <div className="glass-panel rounded-2xl p-4 text-sm text-[var(--color-muted-ink)]">
          For event: <span className="font-semibold text-[var(--color-ink)]">{eventQuery.data.title}</span>
        </div>
      )}

      {challenge?.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Rejected:</strong> {challenge.rejectionReason}
        </div>
      )}

      {challenge && (
        <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-muted-ink)]">
            {challenge.responseCount} responses · {challenge.winnerCount} winners
          </div>
          <Link href={`/events/${id}/challenge/responses`}>
            <Button variant="secondary" size="sm">
              <Trophy className="w-4 h-4" />
              Review Responses
            </Button>
          </Link>
        </div>
      )}

      <form
        onSubmit={handleSubmit((data) => {
          if (hasChallenge) updateMutation.mutate(data);
          else createMutation.mutate(data);
        })}
        className="glass-panel rounded-2xl p-6 space-y-5"
      >
        <Textarea
          {...register("prompt")}
          label="Prompt *"
          rows={4}
          placeholder="Ask users to answer a prompt, share a story, or respond creatively."
          error={errors.prompt?.message}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select {...register("rewardType")} label="Reward type *" error={errors.rewardType?.message}>
            <option value="Coupon">Coupon</option>
            <option value="FreeEntry">Free Entry</option>
            <option value="Discount">Discount</option>
            <option value="Merchandise">Merchandise</option>
            <option value="Other">Other</option>
          </Select>
          <Input {...register("maxWinners")} type="number" label="Max winners" placeholder="Optional" />
        </div>

        <Input {...register("rewardDescription")} label="Reward description" placeholder="What winners receive" />
        <Input {...register("expiryDate")} type="date" label="Challenge expiry date" />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
            <Sparkles className="w-4 h-4" />
            {hasChallenge ? "Save Challenge" : "Create Challenge"}
          </Button>
          {canSubmit && (
            <Button type="button" loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
              <Send className="w-4 h-4" />
              Submit for Approval
            </Button>
          )}
          {canDelete && (
            <Button
              type="button"
              variant="danger"
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm("Delete this draft challenge?")) deleteMutation.mutate();
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={() => router.push(`/events/${id}`)}>
            Back to Event
          </Button>
        </div>
      </form>
    </div>
  );
}
