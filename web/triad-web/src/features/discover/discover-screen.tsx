"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Heart, MapPin, SkipForward, Sparkles } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ScreenHeader } from "@/components/app/screen-header";
import { ProfilePreviewCard } from "@/components/domain/profile-preview-card";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { StateBanner } from "@/components/ui/state-banner";
import { getDiscovery, likeProfile, saveProfile, updateProfile as updateProfileRequest } from "@/lib/api/services";
import type { Audience, DiscoveryCard } from "@/lib/types";

const audienceOptions: Array<{ label: string; value: Audience }> = [
  { label: "All", value: "all" },
  { label: "Singles", value: "single" },
  { label: "Couples", value: "couple" },
];

export function DiscoverScreen() {
  const queryClient = useQueryClient();
  const { token } = useSession();
  const [audience, setAudience] = useState<Audience>("all");
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const hasAttemptedAutoLocation = useRef(false);

  const discoveryQuery = useQuery({
    queryKey: ["discover", audience, token],
    queryFn: () => getDiscovery(token!, audience === "all" ? null : audience),
    enabled: Boolean(token),
  });

  const saveMutation = useMutation({
    mutationFn: (userId: string) => saveProfile(token!, userId),
    onSuccess: (_, userId) => {
      const username = discoveryQuery.data?.find((card) => card.userId === userId)?.username || "Profile";
      setNotice(`${username} was saved for later.`);
      setHiddenIds((current) => [...current, userId]);
      queryClient.invalidateQueries({ queryKey: ["saved"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed."),
  });

  const likeMutation = useMutation({
    mutationFn: (userId: string) => likeProfile(token!, userId),
    onSuccess: (result, userId) => {
      const username = discoveryQuery.data?.find((card) => card.userId === userId)?.username || "Profile";
      setNotice(result.matched ? `You matched with ${username}.` : `Like sent to ${username}.`);
      setHiddenIds((current) => [...current, userId]);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Like failed."),
  });

  const visibleCards = useMemo(
    () => (discoveryQuery.data || []).filter((card) => !hiddenIds.includes(card.userId)),
    [discoveryQuery.data, hiddenIds],
  );
  const viewerRedFlags = new Set<string>();

  useEffect(() => {
    if (!token || hasAttemptedAutoLocation.current) {
      return;
    }

    hasAttemptedAutoLocation.current = true;
    void syncBrowserLocation("auto");
  }, [token]);

  const syncBrowserLocation = useEffectEvent(async (trigger: "auto" | "manual") => {
    if (!token) {
      return;
    }

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    const permissionState = await getPermissionState();
    if (permissionState === "denied") {
      return;
    }

    try {
      const position = await getCurrentBrowserPosition();
      const latitude = roundCoordinate(position.coords.latitude);
      const longitude = roundCoordinate(position.coords.longitude);

      await updateProfileRequest(token, { latitude, longitude });
      await queryClient.invalidateQueries({ queryKey: ["discover"] });
    } catch (error) {
      if (trigger === "manual" && !isPermissionDenied(error)) {
        toast.error(error instanceof Error ? error.message : "Location request failed.");
      }
    }
  });

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Discover"
        description="The web feed keeps the same Triad browsing rhythm: audience filter, profile depth, skip, save, like, and a path into richer detail."
      />

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="glass-panel rounded-[28px] p-5">
            <p className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Audience</p>
            <div className="grid grid-cols-3 gap-2">
              {audienceOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setNotice(null);
                    setHiddenIds([]);
                    setAudience(option.value);
                  }}
                  className={`rounded-2xl px-3 py-2 text-sm font-semibold transition ${
                    audience === option.value
                      ? "bg-[linear-gradient(135deg,var(--color-accent),var(--color-secondary))] text-white"
                      : "bg-white/70 text-[var(--color-muted-ink)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {notice ? <StateBanner title="Update" message={notice} /> : null}

          {discoveryQuery.isLoading ? (
            <DiscoverySkeleton />
          ) : discoveryQuery.isError ? (
            <EmptyState
              title="Discovery unavailable"
              message={discoveryQuery.error instanceof Error ? discoveryQuery.error.message : "Try again in a moment."}
              action={
                <Button variant="secondary" onClick={() => discoveryQuery.refetch()}>
                  Retry
                </Button>
              }
            />
          ) : visibleCards.length === 0 ? (
            <EmptyState
              title="No profiles right now"
              message="Try another audience filter or refresh after seeding more users."
            />
          ) : (
            visibleCards.map((card) => (
              <ProfilePreviewCard
                key={card.userId}
                profile={card}
                viewerRedFlags={viewerRedFlags}
                href={`/profile/${card.userId}`}
                footer={
                  <ActionRow
                    card={card}
                    onSkip={() => setHiddenIds((current) => [...current, card.userId])}
                    onSave={() => saveMutation.mutate(card.userId)}
                    onLike={() => likeMutation.mutate(card.userId)}
                    loadingId={saveMutation.variables || likeMutation.variables || null}
                  />
                }
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  card,
  onSkip,
  onSave,
  onLike,
  loadingId,
}: {
  card: DiscoveryCard;
  onSkip: () => void;
  onSave: () => void;
  onLike: () => void;
  loadingId: string | null;
}) {
  const isWorking = loadingId === card.userId;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={onSkip}>
        <SkipForward className="size-4" />
        Skip
      </Button>
      <Button variant="outline" onClick={onSave} disabled={isWorking}>
        <MapPin className="size-4" />
        Save
      </Button>
      <Button onClick={onLike} disabled={isWorking}>
        <Heart className="size-4" />
        Like
      </Button>
      <Link
        href={`/profile/${card.userId}`}
        className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)]"
      >
        <Sparkles className="size-4" />
        View full profile
      </Link>
    </div>
  );
}

function DiscoverySkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="glass-panel rounded-[28px] p-5">
          <Skeleton className="h-64 w-full rounded-[24px]" />
          <div className="mt-4 space-y-3">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

async function getPermissionState(): Promise<PermissionState | "unsupported"> {
  if (typeof navigator === "undefined" || !("permissions" in navigator) || !navigator.permissions?.query) {
    return "unsupported";
  }

  try {
    const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return result.state;
  } catch {
    return "unsupported";
  }
}

function getCurrentBrowserPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 300_000,
    });
  });
}

function isPermissionDenied(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    Number((error as { code?: unknown }).code) === 1
  );
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100;
}
