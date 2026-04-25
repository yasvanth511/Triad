"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Images, Mic, PlaySquare } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CoupleLinkCard } from "@/features/profile/couple-link-card";
import { resolveMediaUrl } from "@/lib/config";
import { cn } from "@/lib/utils";

const profileSchema = z.object({
  bio: z.string().max(500),
  ageMin: z.coerce.number().min(18).max(100),
  ageMax: z.coerce.number().min(18).max(100),
  intent: z.string().min(1),
  lookingFor: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  radiusMiles: z.coerce.number().min(1).max(500),
  interests: z.string(),
  redFlags: z.string(),
});

type ProfileValues = z.input<typeof profileSchema>;
type ProfileSubmitValues = z.output<typeof profileSchema>;

export function EditProfileScreen() {
  const router = useRouter();
  const { currentUser, updateProfile } = useSession();

  const form = useForm<ProfileValues, undefined, ProfileSubmitValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: currentUser?.bio || "",
      ageMin: currentUser?.ageMin || 25,
      ageMax: currentUser?.ageMax || 35,
      intent: currentUser?.intent || "",
      lookingFor: currentUser?.lookingFor || "",
      city: currentUser?.city || "",
      state: currentUser?.state || "",
      zipCode: currentUser?.zipCode || "",
      radiusMiles: currentUser?.radiusMiles || 25,
      interests: (currentUser?.interests || []).join(", "),
      redFlags: (currentUser?.redFlags || []).join(", "),
    },
  });

  const audioBioSrc = resolveMediaUrl(currentUser?.audioBioUrl);
  const videoBioSrc = resolveMediaUrl(currentUser?.videoBioUrl);
  const orderedPhotos = [...(currentUser?.photos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const orderedVideos = [...(currentUser?.videos ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const videoTotal = orderedVideos.length + (videoBioSrc ? 1 : 0);

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Edit Profile"
        description="The form structure mirrors the native profile editor while adapting to a scrollable web settings page."
      />

      <Card className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">Profile Media</h2>

        <div className="space-y-3 rounded-[20px] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <Images className="size-4" />
              Photos
            </p>
            <Badge tone={orderedPhotos.length > 0 ? "accent" : "muted"}>
              {orderedPhotos.length} {orderedPhotos.length === 1 ? "photo" : "photos"}
            </Badge>
          </div>
          {orderedPhotos.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {orderedPhotos.slice(0, 8).map((photo, index) => {
                const src = resolveMediaUrl(photo.url);
                if (!src) return null;
                return (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-2xl bg-black/10">
                    <Image src={src} alt={`Photo ${index + 1}`} fill unoptimized className="object-cover" sizes="25vw" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-muted-ink)]">No photos added yet.</p>
          )}
          <p className="text-xs text-[var(--color-muted-ink)]">
            Use the Triad mobile app to add, remove, or reorder photos.
          </p>
        </div>

        <div className="space-y-3 rounded-[20px] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <Mic className="size-4" />
              Audio Bio
            </p>
            <Badge tone={audioBioSrc ? "secondary" : "muted"}>
              {audioBioSrc ? "Available" : "Not set"}
            </Badge>
          </div>
          {audioBioSrc ? (
            <audio controls preload="metadata" className="w-full" src={audioBioSrc} aria-label="Your audio bio" />
          ) : (
            <p className="text-sm text-[var(--color-muted-ink)]">No audio bio recorded yet.</p>
          )}
          <p className="text-xs text-[var(--color-muted-ink)]">
            Use the Triad mobile app to record or replace your audio bio.
          </p>
        </div>

        <div className="space-y-3 rounded-[20px] bg-white/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
              <PlaySquare className="size-4" />
              Video Highlights
            </p>
            <Badge tone={videoTotal > 0 ? "accent" : "muted"}>
              {videoTotal} {videoTotal === 1 ? "clip" : "clips"}
            </Badge>
          </div>
          {videoTotal > 0 ? (
            <ol className="space-y-3">
              {videoBioSrc && (
                <li className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">
                    Featured · Bio
                  </p>
                  <video
                    controls
                    preload="metadata"
                    className="aspect-video w-full rounded-2xl bg-black/85"
                    src={videoBioSrc}
                    aria-label="Your featured bio video"
                  />
                </li>
              )}
              {orderedVideos.map((video, index) => {
                const src = resolveMediaUrl(video.url);
                if (!src) return null;
                return (
                  <li key={video.id} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-ink)]">
                      #{index + 1}
                    </p>
                    <video
                      controls
                      preload="metadata"
                      className="aspect-video w-full rounded-2xl bg-black/85"
                      src={src}
                      aria-label={`Your video highlight ${index + 1}`}
                    />
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-[var(--color-muted-ink)]">No video highlights added yet.</p>
          )}
          <p className="text-xs text-[var(--color-muted-ink)]">
            Use the Triad mobile app to add or remove video highlights.
          </p>
        </div>
      </Card>

      <CoupleLinkCard />

      <form
        className="space-y-5"
        onSubmit={form.handleSubmit(async (values) => {
          await updateProfile({
            bio: values.bio,
            ageMin: values.ageMin,
            ageMax: values.ageMax,
            intent: values.intent,
            lookingFor: values.lookingFor,
            city: values.city,
            state: values.state,
            zipCode: values.zipCode,
            radiusMiles: values.radiusMiles,
            interests: splitList(values.interests),
            redFlags: splitList(values.redFlags),
          });
          router.push("/profile");
        })}
      >
        <Card className="space-y-4">
          <SectionTitle>Bio</SectionTitle>
          <Field label="About you" error={form.formState.errors.bio?.message}>
            <Textarea
              {...form.register("bio")}
              placeholder="Write a short intro — your personality, what you're looking for, what makes you a great connection."
              className="min-h-36"
            />
          </Field>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Basics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Age min" error={form.formState.errors.ageMin?.message}>
              <Input type="number" min={18} max={100} {...form.register("ageMin")} />
            </Field>
            <Field label="Age max" error={form.formState.errors.ageMax?.message}>
              <Input type="number" min={18} max={100} {...form.register("ageMax")} />
            </Field>
            <Field label="Intent" error={form.formState.errors.intent?.message}>
              <Input {...form.register("intent")} placeholder="e.g. serious, casual, friends" />
            </Field>
            <Field label="Looking for" error={form.formState.errors.lookingFor?.message}>
              <Input {...form.register("lookingFor")} placeholder="e.g. single, couple, group" />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Location</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City" error={form.formState.errors.city?.message}>
              <Input {...form.register("city")} placeholder="e.g. Austin" />
            </Field>
            <Field label="State" error={form.formState.errors.state?.message}>
              <Input {...form.register("state")} placeholder="e.g. TX" />
            </Field>
            <Field label="Zip code" error={form.formState.errors.zipCode?.message}>
              <Input {...form.register("zipCode")} placeholder="e.g. 78701" />
            </Field>
            <Field label="Radius (miles)" error={form.formState.errors.radiusMiles?.message}>
              <Input type="number" min={1} max={500} {...form.register("radiusMiles")} />
            </Field>
          </div>
        </Card>

        <Card className="space-y-4">
          <SectionTitle>Preferences</SectionTitle>
          <Field label="Interests" error={form.formState.errors.interests?.message}>
            <Input {...form.register("interests")} placeholder="music, travel, coffee, museums" />
          </Field>
          <Field label="Red flags" error={form.formState.errors.redFlags?.message}>
            <Input {...form.register("redFlags")} placeholder="smoking, dishonesty, disrespect" />
          </Field>
        </Card>

        <Card className="flex flex-wrap gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Saving…" : "Save Profile"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
            Cancel
          </Button>
        </Card>
      </form>
    </div>
  );
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base font-semibold text-[var(--color-ink)]">{children}</h2>
  );
}

function Field({
  label,
  error,
  className,
  children,
}: {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
