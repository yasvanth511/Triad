"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { LogOut, PencilLine, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

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
import { StateBanner } from "@/components/ui/state-banner";
import { getVerifications } from "@/lib/api/services";
import { joinLocation, toTitleCase } from "@/lib/utils";

export function ProfileScreen() {
  const { token, currentUser, signOut, deleteAccount } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const verificationsQuery = useQuery({
    queryKey: ["verifications", token],
    queryFn: () => getVerifications(token!),
    enabled: Boolean(token),
  });

  if (!currentUser) {
    return (
      <EmptyState
        title="No profile loaded"
        message="Sign in again or refresh your session."
      />
    );
  }

  const verificationMethods = verificationsQuery.data?.filter(
    (method) => method.isEnabled || method.status === "verified",
  );

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Profile"
        description="The profile surface stays richer than a swipe card, with the same deeper context, trust cues, and media-first tone as native."
        actions={
          <Link href="/profile/edit">
            <Button variant="outline">
              <PencilLine className="size-4" />
              Edit Profile
            </Button>
          </Link>
        }
      />

      <Card className="space-y-5">
        <div className="grid gap-5 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div className="h-80 overflow-hidden rounded-[26px]">
            <MediaFrame src={currentUser.photos[0]?.url} alt={currentUser.username} />
          </div>
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold text-[var(--color-ink)]">{currentUser.username}</h1>
                <p className="text-sm text-[var(--color-muted-ink)]">
                  {joinLocation(currentUser.city, currentUser.state) || "Location not set"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={currentUser.isCouple ? "secondary" : "accent"}>
                  {currentUser.isCouple ? "Couple" : "Single"}
                </Badge>
                {verificationMethods?.filter((method) => method.status === "verified").map((method) => (
                  <Badge key={method.key} tone="green">
                    {method.displayName}
                  </Badge>
                ))}
              </div>
            </div>

            <p className="text-sm leading-7 text-[var(--color-ink)]">
              {currentUser.bio || "No bio yet. Add a short intro so your profile feels more like you."}
            </p>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricTile title="Age Range" value={`${currentUser.ageMin}-${currentUser.ageMax}`} />
              <MetricTile title="Intent" value={toTitleCase(currentUser.intent)} />
              <MetricTile title="Looking For" value={toTitleCase(currentUser.lookingFor)} />
              <MetricTile title="Radius" value={`${currentUser.radiusMiles || 25} mi`} />
            </div>
          </div>
        </div>
      </Card>

      <StateBanner
        title="Media + Verification Adaptation"
        tone="blue"
        message="TODO: the native audio/video upload flows and vendor-backed verification sheets should become dedicated web flows. This first pass keeps the structure, badges, and placeholders in place."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Profile Details</h2>
          <DetailRow label="Location" value={joinLocation(currentUser.city, currentUser.state) || "Not set"} />
          <DetailRow label="Zip Code" value={currentUser.zipCode || "Not set"} />
          {currentUser.isCouple ? (
            <DetailRow label="Coupled With" value={currentUser.couplePartnerName || "Waiting for partner"} />
          ) : null}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Verifications</h2>
          {verificationMethods?.length ? (
            verificationMethods.map((method) => (
              <div key={method.key} className="rounded-[20px] bg-white/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">{method.displayName}</p>
                    <p className="text-sm text-[var(--color-muted-ink)]">{toTitleCase(method.status)}</p>
                  </div>
                  <Badge tone={method.status === "verified" ? "green" : "muted"}>
                    <ShieldCheck className="size-3" />
                    {method.status === "verified" ? "Verified" : "Not complete"}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-[var(--color-muted-ink)]">
              No verification methods surfaced yet.
            </p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Interests</h2>
          {currentUser.interests.length ? (
            <InterestCloud interests={currentUser.interests} />
          ) : (
            <p className="text-sm text-[var(--color-muted-ink)]">No interests added yet.</p>
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">Red Flags</h2>
          {currentUser.redFlags?.length ? (
            <InterestCloud interests={currentUser.redFlags} flaggedSet={new Set(currentUser.redFlags.map((item) => item.toLowerCase()))} />
          ) : (
            <p className="text-sm text-[var(--color-muted-ink)]">No red flags set yet.</p>
          )}
        </Card>
      </div>

      <Card className="flex flex-wrap gap-3">
        <Link href="/profile/edit">
          <Button variant="outline">
            <PencilLine className="size-4" />
            Edit Profile
          </Button>
        </Link>
        <Button variant="secondary" onClick={signOut}>
          <LogOut className="size-4" />
          Sign Out
        </Button>
        <Button variant="danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="size-4" />
          Delete Account
        </Button>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        description="This permanently removes your profile and signs you out."
      >
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              await deleteAccount();
              setConfirmDelete(false);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[20px] bg-white/60 px-4 py-3">
      <p className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</p>
      <p className="text-sm text-[var(--color-ink)]">{value}</p>
    </div>
  );
}
