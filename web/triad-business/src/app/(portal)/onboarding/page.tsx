"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers/session-provider";
import { getBusinessCategories, upsertBusinessProfile } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

const schema = z.object({
  businessName: z.string().min(2, "Required"),
  category: z.string().min(1, "Select a category"),
  description: z.string().optional(),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function OnboardingPage() {
  const router = useRouter();
  const { token, refreshPartner } = useSession();
  const categoriesQuery = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      upsertBusinessProfile(token!, {
        businessName: data.businessName,
        category: data.category,
        description: data.description,
        website: data.website || undefined,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone,
        city: data.city,
        state: data.state,
      }),
    onSuccess: async () => {
      await refreshPartner();
      toast.success("Business profile saved. Your account is pending review.");
      router.replace("/dashboard");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to save profile."),
  });

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="page-title text-[var(--color-ink)]">Set up your business</h1>
        <p className="text-[var(--color-muted-ink)] mt-1 text-sm">Tell us about your business to get started. Your account will be reviewed before events go live.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="glass-panel rounded-2xl p-6 space-y-5">
        <Input
          {...register("businessName")}
          label="Business name *"
          placeholder="e.g. The Velvet Lounge"
          error={errors.businessName?.message}
        />

        <Select {...register("category")} label="Category *" error={errors.category?.message}>
          <option value="">Select category</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.key}>{category.displayName}</option>
          ))}
        </Select>

        <Textarea
          {...register("description")}
          label="Description"
          placeholder="A brief description of your business..."
          rows={3}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input {...register("city")} label="City" placeholder="Detroit" />
          <Input {...register("state")} label="State" placeholder="MI" />
        </div>

        <Input
          {...register("website")}
          label="Website"
          type="url"
          placeholder="https://yourbusiness.com"
          error={errors.website?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            {...register("contactEmail")}
            type="email"
            label="Contact email"
            placeholder="hello@business.com"
            error={errors.contactEmail?.message}
          />
          <Input {...register("contactPhone")} label="Phone" placeholder="+1 555 0100" />
        </div>

        <Button type="submit" loading={mutation.isPending} className="w-full justify-center" size="lg">
          Save & Submit for Review
        </Button>
      </form>
    </div>
  );
}
