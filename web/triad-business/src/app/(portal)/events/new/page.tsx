"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers/session-provider";
import { createEvent, getBusinessCategories } from "@/lib/api/services";
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

export default function NewEventPage() {
  const router = useRouter();
  const { token } = useSession();
  const qc = useQueryClient();
  const categoriesQuery = useQuery({
    queryKey: ["business-categories"],
    queryFn: getBusinessCategories,
  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues, unknown, FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      createEvent(token!, {
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
    onSuccess: (ev) => {
      qc.invalidateQueries({ queryKey: ["my-events"] });
      toast.success("Event created as Draft.");
      router.replace(`/events/${ev.id}`);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create event."),
  });

  return (
    <div className="max-w-xl mx-auto py-8 space-y-6">
      <div>
        <h1 className="page-title text-[var(--color-ink)]">Create Event</h1>
        <p className="text-[var(--color-muted-ink)] text-sm mt-1">Events must be submitted for admin approval before going live.</p>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="glass-panel rounded-2xl p-6 space-y-5">
        <Input {...register("title")} label="Event title *" placeholder="e.g. Thursday Night Social" error={errors.title?.message} />
        <Textarea {...register("description")} label="Description" rows={3} placeholder="What's happening at this event?" />

        <Select {...register("category")} label="Category">
          <option value="">Select category</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.key}>{category.displayName}</option>
          ))}
        </Select>

        <Input {...register("location")} label="Venue name" placeholder="e.g. The Velvet Lounge" />
        <div className="grid grid-cols-2 gap-4">
          <Input {...register("city")} label="City" />
          <Input {...register("state")} label="State" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input {...register("startDate")} type="datetime-local" label="Start date & time" />
          <Input {...register("endDate")} type="datetime-local" label="End date & time" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input {...register("capacity")} type="number" label="Capacity" placeholder="Leave blank for unlimited" />
          <Input {...register("price")} type="number" step="0.01" label="Price (USD)" placeholder="0 for free" />
        </div>

        <Input {...register("externalTicketUrl")} type="url" label="External ticket URL" placeholder="https://tickets.example.com" error={errors.externalTicketUrl?.message} />

        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1 justify-center">
            Save as Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
