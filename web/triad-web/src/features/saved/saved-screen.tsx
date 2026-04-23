"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { ScreenHeader } from "@/components/app/screen-header";
import { ProfilePreviewCard } from "@/components/domain/profile-preview-card";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StateBanner } from "@/components/ui/state-banner";
import { formatDateOnly } from "@/lib/utils";
import { getSavedProfiles, likeProfile, removeSavedProfile } from "@/lib/api/services";

export function SavedScreen() {
  const queryClient = useQueryClient();
  const { token, currentUser } = useSession();
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const savedQuery = useQuery({
    queryKey: ["saved", token],
    queryFn: () => getSavedProfiles(token!),
    enabled: Boolean(token),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeSavedProfile(token!, userId),
    onSuccess: (_, userId) => {
      const username = savedQuery.data?.find((card) => card.userId === userId)?.username || "Profile";
      setNotice(`${username} was removed from saved profiles.`);
      setHiddenIds((current) => [...current, userId]);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Remove failed."),
  });

  const likeMutation = useMutation({
    mutationFn: (userId: string) => likeProfile(token!, userId),
    onSuccess: (result, userId) => {
      const username = savedQuery.data?.find((card) => card.userId === userId)?.username || "Profile";
      setNotice(result.matched ? `You matched with ${username}.` : `Like sent to ${username}.`);
      setHiddenIds((current) => [...current, userId]);
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Like failed."),
  });

  const viewerRedFlags = new Set((currentUser?.redFlags || []).map((item) => item.toLowerCase()));
  const visible = useMemo(
    () => (savedQuery.data || []).filter((profile) => !hiddenIds.includes(profile.userId)),
    [hiddenIds, savedQuery.data],
  );

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Saved"
        description="Triad’s softer-intent layer stays intact on web, giving people somewhere to land between browsing and acting."
      />

      {notice ? <StateBanner title="Update" message={notice} /> : null}

      {savedQuery.isLoading ? null : savedQuery.isError ? (
        <EmptyState
          title="Saved profiles unavailable"
          message={savedQuery.error instanceof Error ? savedQuery.error.message : "Try again in a moment."}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          message="Bookmarks from Discover will land here so you can revisit them later."
        />
      ) : (
        visible.map((profile) => (
          <ProfilePreviewCard
            key={profile.userId}
            profile={profile}
            viewerRedFlags={viewerRedFlags}
            href={`/profile/${profile.userId}`}
            savedAtLabel={`Saved ${formatDateOnly(profile.savedAt)}`}
            footer={
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => removeMutation.mutate(profile.userId)}
                  disabled={removeMutation.variables === profile.userId || likeMutation.variables === profile.userId}
                >
                  <Trash2 className="size-4" />
                  Remove
                </Button>
                <Button
                  onClick={() => likeMutation.mutate(profile.userId)}
                  disabled={removeMutation.variables === profile.userId || likeMutation.variables === profile.userId}
                >
                  <Heart className="size-4" />
                  Like
                </Button>
              </div>
            }
          />
        ))
      )}
    </div>
  );
}
