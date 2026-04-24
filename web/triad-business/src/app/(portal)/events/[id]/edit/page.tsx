"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/providers/session-provider";
import { getBusinessCategories, getMyEvent, updateEvent } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";

const schema = z.object({
  title: z.string().min(2, "Required"),
  description: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  capacity: z.coerce.number().positive().optional().or(z.literal("")),
  price: z.coerce.number().min(0).optional().or(z.literal("")),
  externalTicketUrl: z.string().url().optional().or(z.literal("")),
});
type FormValues = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useSession();
  const qc = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const eventQuery = useQuery({
    queryKey: ["my-event", id],
    queryFn: () => getMyEvent(token!, id),
    enabled: !!token,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (eventQuery.data) {
      const ev = eventQuery.data;
      reset({
        title: ev.title,
        description: ev.description,
        category: ev.category ?? "",
        location: ev.location ?? "",
        city: ev.city ?? "",
        state: ev.state ?? "",
        startDate: ev.startDate ? ev.startDate.slice(0, 16) : "",
        endDate: ev.endDate ? ev.endDate.slice(0, 16) : "",
        capacity: ev.capacity ?? "",
        price: ev.price ?? "",
        externalTicketUrl: ev.externalTicketUrl ?? "",
      });
    }
  }, [eventQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateEvent(token!, id, {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        city: data.city,
        state: data.state,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        capacity: data.capacity !== "" ? data.capacity : undefined,
        price: data.price !== "" ? data.price : undefined,
        externalTicketUrl: data.externalTicketUrl || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-event", id] });
      qc.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event updated.");
      router.push(`/events/${id}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Update failed."),
  });

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <Link href={`/events/${id}`} className="flex items-center gap-1.5 text-sm text-[var(--color-muted-ink)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </Link>

      <div>
        <h1 className="page-title text-[var(--color-ink)]">Edit Event</h1>
        <p className="text-[var(--color-muted-ink)] text-sm mt-1">Saving will re-queue the event for approval if already published.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="glass-panel rounded-2xl p-6 space-y-5">
        <Input {...register("title")} label="Event title *" error={errors.title?.message} />
        <Textarea {...register("description")} label="Description" rows={3} />
        <Select {...register("category")} label="Category">
          <option value="">Select category</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.key}>{category.displayName}</option>
          ))}
        </Select>
        <Input {...register("location")} label="Venue name" />
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("city")} label="City" />
          <Input {...register("state")} label="State" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("startDate")} type="datetime-local" label="Start" />
          <Input {...register("endDate")} type="datetime-local" label="End" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("capacity")} type="number" label="Capacity" />
          <Input {...register("price")} type="number" step="0.01" label="Price (USD)" />
        </div>
        <Input {...register("externalTicketUrl")} type="url" label="Ticket URL" error={errors.externalTicketUrl?.message} />
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1 justify-center">Save changes</Button>
        </div>
      </form>
    </div>
  );
}
