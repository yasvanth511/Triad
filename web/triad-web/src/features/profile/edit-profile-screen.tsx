"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateBanner } from "@/components/ui/state-banner";
import { Textarea } from "@/components/ui/textarea";
import { CoupleLinkCard } from "@/features/profile/couple-link-card";

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

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Edit Profile"
        description="The form structure mirrors the native profile editor while adapting to a scrollable web settings page."
      />

      <StateBanner
        title="Native Media TODO"
        tone="blue"
        message="TODO: photo ordering, audio bio capture, and video highlights need dedicated web upload and management surfaces."
      />

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
        <Card className="grid gap-4 md:grid-cols-2">
          <Field label="Bio" error={form.formState.errors.bio?.message} className="md:col-span-2">
            <Textarea {...form.register("bio")} />
          </Field>
          <Field label="Age Min" error={form.formState.errors.ageMin?.message}>
            <Input type="number" {...form.register("ageMin")} />
          </Field>
          <Field label="Age Max" error={form.formState.errors.ageMax?.message}>
            <Input type="number" {...form.register("ageMax")} />
          </Field>
          <Field label="Intent" error={form.formState.errors.intent?.message}>
            <Input {...form.register("intent")} />
          </Field>
          <Field label="Looking For" error={form.formState.errors.lookingFor?.message}>
            <Input {...form.register("lookingFor")} />
          </Field>
          <Field label="City" error={form.formState.errors.city?.message}>
            <Input {...form.register("city")} />
          </Field>
          <Field label="State" error={form.formState.errors.state?.message}>
            <Input {...form.register("state")} />
          </Field>
          <Field label="Zip Code" error={form.formState.errors.zipCode?.message}>
            <Input {...form.register("zipCode")} />
          </Field>
          <Field label="Radius Miles" error={form.formState.errors.radiusMiles?.message}>
            <Input type="number" {...form.register("radiusMiles")} />
          </Field>
          <Field label="Interests" error={form.formState.errors.interests?.message} className="md:col-span-2">
            <Input {...form.register("interests")} placeholder="music, travel, coffee, museums" />
          </Field>
          <Field label="Red Flags" error={form.formState.errors.redFlags?.message} className="md:col-span-2">
            <Input {...form.register("redFlags")} placeholder="smoking, dishonesty, disrespect" />
          </Field>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save Profile
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/profile")}>
            Cancel
          </Button>
        </div>
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
    <label className={`block space-y-2 ${className || ""}`}>
      <span className="text-sm font-semibold text-[var(--color-muted-ink)]">{label}</span>
      {children}
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
    </label>
  );
}
