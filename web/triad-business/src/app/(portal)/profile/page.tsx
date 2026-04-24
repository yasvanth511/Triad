"use client";

import { useEffect, useRef } from "react";
import type { ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getBusinessCategories, getBusinessProfile, upsertBusinessProfile, uploadLogo } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { resolveMediaUrl } from "@/lib/config";

const schema = z.object({
  businessName: z.string().min(2, "Required"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ProfilePage() {
  const { token, partner, refreshPartner } = useSession();
  const qc = useQueryClient();
  const logoRef = useRef<HTMLInputElement>(null);
  const categoriesQuery = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const profileQuery = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => getBusinessProfile(token!),
    enabled: !!token,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profileQuery.data) {
      const p = profileQuery.data;
      reset({
        businessName: p.businessName,
        category: p.category,
        description: p.description,
        website: p.website ?? "",
        contactEmail: p.contactEmail ?? "",
        contactPhone: p.contactPhone ?? "",
        address: p.address ?? "",
        city: p.city ?? "",
        state: p.state ?? "",
      });
    }
  }, [profileQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (data: FormData) =>
      upsertBusinessProfile(token!, {
        ...data,
        website: data.website || undefined,
        contactEmail: data.contactEmail || undefined,
      }),
    onSuccess: async () => {
      await refreshPartner();
      qc.invalidateQueries({ queryKey: ["business-profile"] });
      toast.success("Profile updated.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed."),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => uploadLogo(token!, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-profile"] });
      toast.success("Logo uploaded.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Upload failed."),
  });

  function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) logoMutation.mutate(file);
  }

  const logoUrl = resolveMediaUrl(profileQuery.data?.logoUrl);

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="page-title text-[var(--color-ink)]">Business Profile</h1>
          <p className="text-[var(--color-muted-ink)] mt-1 text-sm">Changes will be re-queued for admin review.</p>
        </div>
        {partner && <StatusBadge status={partner.status} />}
      </div>

      {partner?.status === "Rejected" && partner.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Rejected:</strong> {partner.rejectionReason}
        </div>
      )}

      {/* Logo */}
      <div className="glass-panel rounded-2xl p-5 flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-[var(--color-accent)]/30 hover:border-[var(--color-accent)] transition-colors"
          onClick={() => logoRef.current?.click()}
        >
          {logoUrl ? (
            <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
          ) : (
            <Upload className="w-6 h-6 text-[var(--color-accent)]/60" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">Business logo</p>
          <p className="text-xs text-[var(--color-muted-ink)]">Click to upload. Square format recommended.</p>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
      </div>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="glass-panel rounded-2xl p-6 space-y-5">
        <Input {...register("businessName")} label="Business name *" error={errors.businessName?.message} />
        <Select {...register("category")} label="Category *" error={errors.category?.message}>
          <option value="">Select category</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.key}>{category.displayName}</option>
          ))}
        </Select>
        <Textarea {...register("description")} label="Description" rows={3} />
        <Input {...register("address")} label="Address" />
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("city")} label="City" />
          <Input {...register("state")} label="State" />
        </div>
        <Input {...register("website")} type="url" label="Website" error={errors.website?.message} />
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("contactEmail")} type="email" label="Contact email" error={errors.contactEmail?.message} />
          <Input {...register("contactPhone")} label="Phone" />
        </div>
        <Button type="submit" loading={saveMutation.isPending} className="w-full justify-center">
          Save changes
        </Button>
      </form>
    </div>
  );
}
