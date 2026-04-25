"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flag, Hand, HeartHandshake, MapPin, Mic, PlaySquare, Send, UsersRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { InterestCloud } from "@/components/domain/interest-cloud";
import { MediaFrame } from "@/components/domain/media-frame";
import { MetricTile } from "@/components/domain/metric-tile";
import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import {
  blockProfile,
  getImpressMeInbox,
  getProfileById,
  reportProfile,
  sendImpressMe,
} from "@/lib/api/services";
import { resolveMediaUrl } from "@/lib/config";
import type { ImpressMeSignal, ProfileVideo, UserProfile } from "@/lib/types";
import { joinLocation, toTitleCase } from "@/lib/utils";

const reportSchema = z.object({
  reason: z.string().min(1, "Pick a reason."),
  details: z.string().max(500).optional(),
});

export function ProfileDetailScreen({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { token, currentUser } = useSession();
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", userId, token],
    queryFn: () => getProfileById(token!, userId),
    enabled: Boolean(token),
  });

  const impressMeInboxQuery = useQuery({
    queryKey: ["impress-me", token],
    queryFn: () => getImpressMeInbox(token!),
    enabled: Boolean(token),
  });

  const viewerRedFlags = new Set((currentUser?.redFlags || []).map((item) => item.toLowerCase()));

  const hasSentImpressMe = Boolean(
    findPendingSentImpressMe(impressMeInboxQuery.data?.sent, userId),
  );

  const impressMutation = useMutation({
    mutationFn: () => sendImpressMe(token!, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["impress-me", token] });
      toast.success("Impress Me sent.");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Impress Me failed.";
      if (message.toLowerCase().includes("pending impress me signal")) {
        queryClient.invalidateQueries({ queryKey: ["impress-me", token] });
        toast.message("Challenge already sent. Waiting for their reply.");
        return;
      }
      toast.error(message);
    },
  });

  const blockMutation = useMutation({
    mutationFn: () => blockProfile(token!, userId),
    onSuccess: () => {
      setBlockOpen(false);
      toast.success("Profile blocked.");
    },
  });

  const reportForm = useForm({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reason: "Spam",
      details: "",
    },
  });

  const reportMutation = useMutation({
    mutationFn: (values: { reason: string; details?: string }) =>
      reportProfile(token!, userId, values.reason, values.details),
    onSuccess: () => {
      setReportOpen(false);
      reportForm.reset();
      toast.success("Report submitted.");
    },
  });

  const profile = profileQuery.data;

  return (
    <div className="space-y-5">
      <ScreenHeader title="Profile" />

      {profileQuery.isError ? (
        <EmptyState
          title="Profile unavailable"
          message={profileQuery.error instanceof Error ? profileQuery.error.message : "Try again in a moment."}
        />
      ) : profile ? (
        <>
          <Card className="space-y-5">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
              <div className="h-96 overflow-hidden rounded-[26px]">
                <MediaFrame src={profile.photos[0]?.url} alt={profile.username} />
              </div>
              <div className="space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-semibold text-[var(--color-ink)]">{profile.username}</h1>
                    <p className="text-sm text-[var(--color-muted-ink)]">
                      {profile.ageMin}-{profile.ageMax} | {toTitleCase(profile.intent)}
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm text-[var(--color-muted-ink)]">
                      <MapPin className="size-4" />
                      {joinLocation(profile.city, profile.state) || "Location not set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={profile.isCouple ? "secondary" : "accent"}>
                      {profile.isCouple ? "Couple" : "Single"}
                    </Badge>
                    {profile.interests.filter((interest) => viewerRedFlags.has(interest.toLowerCase())).length > 0 ? (
                      <Badge tone="red">
                        <Flag className="size-3" />
                        {profile.interests.filter((interest) => viewerRedFlags.has(interest.toLowerCase())).length} red flags
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm leading-7 text-[var(--color-ink)]">
                  {profile.bio || "No bio yet. This profile is still finding its voice."}
                </p>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricTile title="Looking For" value={toTitleCase(profile.lookingFor)} />
                  <MetricTile title="Intent" value={toTitleCase(profile.intent)} />
                  <MetricTile title="Profile Type" value={profile.isCouple ? "Couple" : "Single"} />
                  <MetricTile title="Radius" value={`${profile.radiusMiles || 25} mi`} />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => impressMutation.mutate()}
                    disabled={
                      impressMutation.isPending || impressMeInboxQuery.isLoading || hasSentImpressMe
                    }
                  >
                    {hasSentImpressMe ? (
                      <>
                        <Send className="size-4" />
                        Challenge Sent
                      </>
                    ) : (
                      <>
                        <HeartHandshake className="size-4" />
                        Impress Me
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setReportOpen(true)}>
                    Report
                  </Button>
                  <Button variant="outline" onClick={() => setBlockOpen(true)}>
                    <Hand className="size-4" />
                    Block
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-[var(--color-ink)]">Profile Details</h2>
              <DetailRow label="Location" value={joinLocation(profile.city, profile.state) || "Not shared"} />
              <DetailRow label="Zip Code" value={profile.zipCode || "Not shared"} />
              {profile.isCouple ? (
                <DetailRow label="Coupled With" value={profile.couplePartnerName || "Couple profile"} />
              ) : null}
            </Card>

            <Card className="space-y-4">
              <h2 className="text-xl font-semibold text-[var(--color-ink)]">Interests</h2>
              <InterestCloud interests={profile.interests} flaggedSet={viewerRedFlags} />
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <ProfileVideoHighlights videos={profile.videos} videoBioUrl={profile.videoBioUrl} />
            <ProfileAudioBio audioBioUrl={profile.audioBioUrl} />
          </div>

          {profile.isCouple ? <ProfileCoupleContext profile={profile} /> : null}
        </>
      ) : null}

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report profile"
        description="Send this profile to moderation with a reason and optional detail."
      >
        <form
          className="space-y-4"
          onSubmit={reportForm.handleSubmit((values) => reportMutation.mutate(values))}
        >
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--color-muted-ink)]">Reason</span>
            <select
              className="h-12 w-full rounded-2xl border border-white/70 bg-white/85 px-4 text-sm"
              {...reportForm.register("reason")}
            >
              {["Spam", "Harassment", "Fake Profile", "Scam", "Other"].map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-[var(--color-muted-ink)]">Details</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-sm"
              {...reportForm.register("details")}
            />
          </label>
          <Button disabled={reportMutation.isPending}>Submit report</Button>
        </form>
      </Modal>

      <Modal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        title="Block this profile?"
        description="This removes the person from your experience right away."
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBlockOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => blockMutation.mutate()} disabled={blockMutation.isPending}>
            Block
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function findPendingSentImpressMe(
  sentSignals: ImpressMeSignal[] | undefined,
  receiverId: string,
): ImpressMeSignal | undefined {
  if (!sentSignals) return undefined;
  const now = Date.now();
  return sentSignals
    .filter(
      (signal) =>
        signal.receiverId === receiverId &&
        signal.status === "Sent" &&
        new Date(signal.expiresAt).getTime() > now,
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white/60 px-4 py-3">
      <p className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</p>
      <p className="text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

function ProfileVideoHighlights({
  videos,
  videoBioUrl,
}: {
  videos: ProfileVideo[];
  videoBioUrl: string | null;
}) {
  const ordered = [...videos].sort((a, b) => a.sortOrder - b.sortOrder);
  const bioSrc = resolveMediaUrl(videoBioUrl);
  const total = ordered.length + (bioSrc ? 1 : 0);

  return (
    <Card className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[var(--color-ink)]">
          <PlaySquare className="size-5" />
          Video Highlights
        </h2>
        <Badge tone={total > 0 ? "accent" : "muted"}>{total} clips</Badge>
      </header>
      {total === 0 ? (
        <p className="text-sm leading-6 text-[var(--color-muted-ink)]">
          No video highlights shared yet.
        </p>
      ) : (
        <ol className="space-y-3">
          {bioSrc ? (
            <li className="space-y-2 rounded-[20px] bg-white/60 p-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">
                <span>Featured · Bio</span>
              </div>
              <video
                controls
                preload="metadata"
                className="aspect-video w-full rounded-2xl bg-black/85"
                src={bioSrc}
                aria-label="Featured bio video"
              />
            </li>
          ) : null}
          {ordered.map((video, index) => {
            const src = resolveMediaUrl(video.url);
            if (!src) {
              return null;
            }
            const position = index + 1;
            return (
              <li key={video.id} className="space-y-2 rounded-[20px] bg-white/60 p-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">
                  <span>#{position}</span>
                </div>
                <video
                  controls
                  preload="metadata"
                  className="aspect-video w-full rounded-2xl bg-black/85"
                  src={src}
                  aria-label={`Video highlight ${position}`}
                />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

function ProfileAudioBio({ audioBioUrl }: { audioBioUrl: string | null }) {
  const src = resolveMediaUrl(audioBioUrl);

  return (
    <Card className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[var(--color-ink)]">
          <Mic className="size-5" />
          Audio Bio
        </h2>
        <Badge tone={src ? "secondary" : "muted"}>{src ? "Available" : "Empty"}</Badge>
      </header>
      {src ? (
        <div className="space-y-2 rounded-[20px] bg-white/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">
            Press play to listen
          </p>
          <audio
            controls
            preload="metadata"
            className="w-full"
            src={src}
            aria-label="Audio bio playback"
          />
        </div>
      ) : (
        <p className="text-sm leading-6 text-[var(--color-muted-ink)]">
          No audio bio added yet.
        </p>
      )}
    </Card>
  );
}

function ProfileCoupleContext({ profile }: { profile: UserProfile }) {
  return (
    <Card className="space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-[var(--color-ink)]">
          <UsersRound className="size-5" />
          Couple Context
        </h2>
        <Badge tone="secondary">Couple Profile</Badge>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        <DetailRow label="Profile Type" value="Couple" />
        <DetailRow label="Linked Partner" value={profile.couplePartnerName || "Linked partner"} />
        <DetailRow label="Shared Intent" value={toTitleCase(profile.intent) || "Not shared"} />
        <DetailRow label="Looking For" value={toTitleCase(profile.lookingFor) || "Not shared"} />
        {profile.relationshipType ? (
          <DetailRow label="Relationship Style" value={toTitleCase(profile.relationshipType)} />
        ) : null}
        {profile.interestedIn ? (
          <DetailRow label="Interested In" value={toTitleCase(profile.interestedIn)} />
        ) : null}
      </div>
      <p className="text-xs leading-5 text-[var(--color-muted-ink)]">
        Impress Me sends a couple-aware prompt to both partners. Report and Block from the header
        apply to this linked couple profile.
      </p>
    </Card>
  );
}
