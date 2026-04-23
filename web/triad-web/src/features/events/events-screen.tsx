"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

import { MediaFrame } from "@/components/domain/media-frame";
import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getEvents, toggleEventInterest } from "@/lib/api/services";
import { formatRelativeDate, kmToMilesLabel } from "@/lib/utils";

export function EventsScreen() {
  const { token } = useSession();
  const eventsQuery = useQuery({
    queryKey: ["events", token],
    queryFn: () => getEvents(token!),
    enabled: Boolean(token),
  });

  const toggleMutation = useMutation({
    mutationFn: (eventId: string) => toggleEventInterest(token!, eventId),
    onSuccess: async () => {
      await eventsQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Event update failed."),
  });

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Events"
        description="The events layer stays connected to the main dating loop so discovery can spill into real-world interaction, not just chat."
      />

      {eventsQuery.data?.length ? (
        eventsQuery.data.map((event) => (
          <Card key={event.id} className="space-y-4">
            <div className="h-56 overflow-hidden rounded-[24px]">
              <MediaFrame src={event.bannerUrl} alt={event.title} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-[var(--color-ink)]">{event.title}</h2>
              <p className="text-sm leading-6 text-[var(--color-muted-ink)]">{event.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="accent">
                <Calendar className="size-3" />
                {formatRelativeDate(event.eventDate)}
              </Badge>
              <Badge tone="blue">
                <MapPin className="size-3" />
                {event.city}, {event.state}
              </Badge>
              {kmToMilesLabel(event.distanceKm) ? <Badge tone="secondary">{kmToMilesLabel(event.distanceKm)}</Badge> : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">{event.venue}</p>
                <p className="text-sm text-[var(--color-muted-ink)]">
                  {event.interestedCount} people interested
                </p>
              </div>
              <Button
                variant={event.isInterested ? "danger" : "primary"}
                onClick={() => toggleMutation.mutate(event.id)}
                disabled={toggleMutation.variables === event.id}
              >
                {event.isInterested ? "Interested" : "Join"}
              </Button>
            </div>
          </Card>
        ))
      ) : (
        <EmptyState
          title="No events nearby"
          message="Seed a few events or expand the user radius in the backend profile."
        />
      )}
    </div>
  );
}
