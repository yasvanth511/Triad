import type { ReactNode } from "react";
import Link from "next/link";

import { InterestCloud } from "@/components/domain/interest-cloud";
import { MediaFrame } from "@/components/domain/media-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { joinLocation, kmToMilesLabel, toTitleCase } from "@/lib/utils";
import type { DiscoveryCard, SavedProfileItem } from "@/lib/types";

type ProfilePreview = DiscoveryCard | SavedProfileItem;

export function ProfilePreviewCard({
  profile,
  viewerRedFlags,
  href,
  footer,
  savedAtLabel,
}: {
  profile: ProfilePreview;
  viewerRedFlags?: Set<string>;
  href: string;
  footer?: ReactNode;
  savedAtLabel?: string;
}) {
  const flaggedCount =
    viewerRedFlags == null
      ? 0
      : profile.interests.filter((interest) => viewerRedFlags.has(interest.toLowerCase())).length;

  return (
    <Card className="space-y-5">
      <Link href={href} className="block space-y-5">
        <div className="h-64 overflow-hidden rounded-[24px]">
          <MediaFrame src={profile.photos[0]?.url} alt={profile.username} className="transition duration-300 hover:scale-[1.02]" />
        </div>

        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{profile.username}</h2>
            <p className="text-sm text-[var(--color-muted-ink)]">
              {profile.ageMin}-{profile.ageMax} | {toTitleCase(profile.intent)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={profile.isCouple ? "secondary" : "accent"}>
              {profile.isCouple ? "Couple" : "Single"}
            </Badge>
            {flaggedCount > 0 ? <Badge tone="red">{flaggedCount} red flags</Badge> : null}
          </div>
        </div>

        <p className="text-sm leading-6 text-[var(--color-ink)]">
          {profile.bio || "No bio yet."}
        </p>

        <div className="flex flex-wrap gap-2">
          {savedAtLabel ? <Badge tone="accent">{savedAtLabel}</Badge> : null}
          {joinLocation(profile.city, profile.state) ? (
            <Badge tone="blue">{joinLocation(profile.city, profile.state)}</Badge>
          ) : null}
          {kmToMilesLabel(profile.approximateDistanceKm) ? (
            <Badge tone="muted">{kmToMilesLabel(profile.approximateDistanceKm)}</Badge>
          ) : null}
        </div>

        {profile.interests.length > 0 ? (
          <InterestCloud interests={profile.interests} flaggedSet={viewerRedFlags} />
        ) : null}
      </Link>

      {footer ? footer : <Button variant="ghost">View full profile</Button>}
    </Card>
  );
}
