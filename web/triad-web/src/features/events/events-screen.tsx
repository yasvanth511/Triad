"use client";

import type { ReactNode } from "react";
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
import type { EventItem } from "@/lib/types";
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

  const renderEventCard = (event: EventItem) => (
    <Card key={event.id} className="space-y-4">
      <div className="h-56 overflow-hidden rounded-[24px]">
        <MediaFrame src={event.bannerUrl} alt={event.title} />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-semibold text-[var(--color-ink)]">{event.title}</h3>
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
  );

  const events = eventsQuery.data ?? [];
  const nearbyEvents = events.filter((event) => event.distanceKm != null);
  const fallbackEvents = events.filter((event) => event.distanceKm == null);

  let body: ReactNode;
  if (eventsQuery.isLoading) {
    body = null;
  } else if (events.length === 0) {
    body = <EmptyState title="No events are available." message="Check back soon for upcoming events." />;
  } else if (nearbyEvents.length > 0) {
    body = (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-[var(--color-ink)]">Nearby Events</h2>
        <div className="space-y-5">{nearbyEvents.map(renderEventCard)}</div>
      </section>
    );
  } else {
    body = (
      <div className="space-y-5">
        <EmptyState
          title="No events are available nearby."
          message="Here are all available events instead."
        />
        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-[var(--color-ink)]">All Events</h2>
          <div className="space-y-5">{fallbackEvents.map(renderEventCard)}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ScreenHeader title="Events" />
      {body}
    </div>
  );
}
