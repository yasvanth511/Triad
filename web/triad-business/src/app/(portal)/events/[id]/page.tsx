"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Edit, Gift, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { deleteEvent, getChallenge, getMyEvent, getMyOffers, submitEventForApproval } from "@/lib/api/services";
import { resolveMediaUrl } from "@/lib/config";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useSession();
  const qc = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ["my-event", id],
    queryFn: () => getMyEvent(token!, id),
    enabled: !!token,
  });

  const offersQuery = useQuery({
    queryKey: ["my-offers", id],
    queryFn: () => getMyOffers(token!, id),
    enabled: !!token,
  });

  const challengeQuery = useQuery({
    queryKey: ["challenge", id],
    queryFn: () => getChallenge(token!, id),
    enabled: !!token,
  });

  const submitMutation = useMutation({
    mutationFn: () => submitEventForApproval(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-event", id] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Submitted for approval.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submit failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteEvent(token!, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event deleted.");
      router.replace("/events");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed."),
  });

  const ev = eventQuery.data;
  const coverUrl = resolveMediaUrl(ev?.images[0]?.url);
  const canSubmit = ev?.status === "Draft" || ev?.status === "Rejected";
  const canDelete = ev?.status === "Draft";
  const hasChallenge = challengeQuery.data !== undefined && !challengeQuery.isError;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-5">
      <Link href="/events" className="flex items-center gap-1.5 text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Events
      </Link>

      {eventQuery.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {ev && (
        <>
          {/* Header */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-[var(--color-ink)]">{ev.title}</h1>
                <p className="text-sm text-[var(--color-muted-ink)]">{ev.category} {ev.city ? `· ${ev.city}` : ""}</p>
              </div>
              <StatusBadge status={ev.status} />
            </div>

            {coverUrl && (
              <img src={coverUrl} alt={ev.title} className="w-full h-48 object-cover rounded-xl" />
            )}

            <p className="text-sm text-[var(--color-muted-ink)]">{ev.description}</p>

            {ev.status === "Rejected" && ev.rejectionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                <strong>Rejected:</strong> {ev.rejectionReason}
              </div>
            )}

            <div className="flex gap-4 text-sm text-[var(--color-muted-ink)]">
              <span>❤️ {ev.likeCount} likes</span>
              <span>🔖 {ev.saveCount} saves</span>
              <span>✅ {ev.registrationCount} registrations</span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href={`/events/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </Button>
              </Link>
              {canSubmit && (
                <Button size="sm" loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                  <Send className="w-3.5 h-3.5" /> Submit for Approval
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={deleteMutation.isPending}
                  onClick={() => { if (confirm("Delete this draft event?")) deleteMutation.mutate(); }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>

          {/* Offer section */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--color-ink)]">
                <Gift className="w-4 h-4 inline mr-1.5 text-[var(--color-secondary)]" />
                Offers
              </h2>
              <Link href={`/events/${id}/offers`}>
                <Button variant="secondary" size="sm">
                  <Plus className="w-3.5 h-3.5" /> Add Offer
                </Button>
              </Link>
            </div>
            {offersQuery.data && offersQuery.data.length === 0 && (
              <p className="text-sm text-[var(--color-muted-ink)]">No offers yet. Add a coupon or discount for attendees.</p>
            )}
            {offersQuery.data?.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 bg-white/50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold">{o.title}</p>
                  <p className="text-xs text-[var(--color-muted-ink)]">{o.offerType} · {o.claimCount} claims</p>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>

          {/* Challenge section */}
          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[var(--color-ink)]">
                <Sparkles className="w-4 h-4 inline mr-1.5 text-[var(--color-accent)]" />
                Challenge
              </h2>
              {!hasChallenge && (
                <Link href={`/events/${id}/challenge`}>
                  <Button variant="secondary" size="sm">
                    <Plus className="w-3.5 h-3.5" /> Add Challenge
                  </Button>
                </Link>
              )}
            </div>
            {hasChallenge && challengeQuery.data ? (
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{challengeQuery.data.prompt}</p>
                  <StatusBadge status={challengeQuery.data.status} />
                </div>
                <p className="text-xs text-[var(--color-muted-ink)] mt-1">
                  {challengeQuery.data.responseCount} responses · {challengeQuery.data.winnerCount} winners
                </p>
                <Link href={`/events/${id}/challenge`}>
                  <Button variant="secondary" size="sm" className="mt-2">
                    Manage Challenge
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-muted-ink)]">No challenge yet. Add an optional challenge to engage attendees.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
