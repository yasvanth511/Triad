"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Plus, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/providers/session-provider";
import { createOffer, deleteOffer, getMyOffers, submitOfferForApproval } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

const schema = z.object({
  offerType: z.enum(["Coupon", "Discount", "FreeItem", "Upgrade", "Other"]),
  title: z.string().min(2, "Required"),
  description: z.string().optional(),
  couponCode: z.string().optional(),
  claimLimit: z.coerce.number().positive().optional().or(z.literal("")),
  expiryDate: z.string().optional(),
  redemptionInstructions: z.string().optional(),
});
type FormValues = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function EventOffersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useSession();
  const qc = useQueryClient();

  const offersQuery = useQuery({
    queryKey: ["my-offers", id],
    queryFn: () => getMyOffers(token!, id),
    enabled: !!token,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: { offerType: "Coupon" },
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      createOffer(token!, id, {
        offerType: data.offerType,
        title: data.title,
        description: data.description,
        couponCode: data.couponCode,
        claimLimit: data.claimLimit !== "" ? data.claimLimit : undefined,
        expiryDate: data.expiryDate || undefined,
        redemptionInstructions: data.redemptionInstructions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-offers", id] });
      toast.success("Offer created.");
      reset();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Create failed."),
  });

  const submitMutation = useMutation({
    mutationFn: (offerId: string) => submitOfferForApproval(token!, offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-offers", id] });
      toast.success("Offer submitted for approval.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submit failed."),
  });

  const deleteMutation = useMutation({
    mutationFn: (offerId: string) => deleteOffer(token!, offerId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-offers", id] });
      toast.success("Offer deleted.");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed."),
  });

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <Link href={`/events/${id}`} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Link>

      <h1 className="page-title text-[var(--color-ink)]">Offers</h1>

      {/* Existing offers */}
      {offersQuery.data?.map((o) => (
        <div key={o.id} className="glass-panel rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">{o.title}</p>
              <p className="text-xs text-[var(--color-muted-ink)]">{o.offerType} {o.couponCode ? `· Code: ${o.couponCode}` : ""} · {o.claimCount} claims</p>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <div className="flex gap-2">
            {(o.status === "Draft" || o.status === "Rejected") && (
              <Button
                size="sm"
                onClick={() => submitMutation.mutate(o.id)}
                loading={submitMutation.isPending}
              >
                <Send className="w-3.5 h-3.5" /> Submit
              </Button>
            )}
            {o.status === "Draft" && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => { if (confirm("Delete offer?")) deleteMutation.mutate(o.id); }}
                loading={deleteMutation.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </Button>
            )}
          </div>
        </div>
      ))}

      {/* Create new offer */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <h2 className="font-bold text-[var(--color-ink)]">
          <Plus className="w-4 h-4 inline mr-1" />
          Add New Offer
        </h2>
        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
          <Select {...register("offerType")} label="Offer type *" error={errors.offerType?.message}>
            <option value="Coupon">Coupon</option>
            <option value="Discount">Discount</option>
            <option value="FreeItem">Free Item</option>
            <option value="Upgrade">Upgrade</option>
            <option value="Other">Other</option>
          </Select>
          <Input {...register("title")} label="Title *" placeholder="e.g. 20% off drinks" error={errors.title?.message} />
          <Textarea {...register("description")} label="Description" rows={2} />
          <Input {...register("couponCode")} label="Coupon code" placeholder="e.g. TRIAD20" />
          <div className="grid grid-cols-2 gap-4">
            <Input {...register("claimLimit")} type="number" label="Claim limit" placeholder="Unlimited" />
            <Input {...register("expiryDate")} type="date" label="Expiry date" />
          </div>
          <Textarea {...register("redemptionInstructions")} label="Redemption instructions" rows={2} />
          <Button type="submit" loading={createMutation.isPending} className="w-full justify-center">
            Create Offer
          </Button>
        </form>
      </div>
    </div>
  );
}
