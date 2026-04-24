"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getMyEvents } from "@/lib/api/services";
import { resolveMediaUrl } from "@/lib/config";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import type { BusinessEvent } from "@/lib/types";

function EventCard({ ev }: { ev: BusinessEvent }) {
  const coverUrl = resolveMediaUrl(ev.images[0]?.url);

  return (
    <Link
      href={`/events/${ev.id}`}
      className="glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow"
    >
      {coverUrl && (
        <img
          src={coverUrl}
          alt={ev.title}
          className="w-full h-40 object-cover rounded-xl"
        />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold text-[var(--color-ink)] truncate">{ev.title}</h3>
          <p className="text-xs text-[var(--color-muted-ink)] mt-0.5">
            {ev.category}{ev.city ? ` · ${ev.city}` : ""}
            {ev.startDate ? ` · ${new Date(ev.startDate).toLocaleDateString()}` : ""}
          </p>
        </div>
        <StatusBadge status={ev.status} />
      </div>
      <div className="flex gap-4 text-xs text-[var(--color-muted-ink)]">
        <span>❤️ {ev.likeCount}</span>
        <span>🔖 {ev.saveCount}</span>
        <span>✅ {ev.registrationCount}</span>
        {ev.hasChallenge && <span>🎯 Challenge</span>}
        {ev.hasOffer && <span>🎁 Offer</span>}
      </div>
      {ev.status === "Rejected" && ev.rejectionReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5">{ev.rejectionReason}</p>
      )}
    </Link>
  );
}

export default function EventsPage() {
  const { token, partner } = useSession();

  const query = useQuery({
    queryKey: ["my-events"],
    queryFn: () => getMyEvents(token!),
    enabled: !!token,
  });

  const isApproved = partner?.status === "Approved";

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-[var(--color-ink)]">My Events</h1>
          <p className="text-[var(--color-muted-ink)] text-sm mt-1">{query.data?.length ?? 0} events</p>
        </div>
        {isApproved && (
          <Link href="/events/new">
            <Button>
              <CalendarPlus className="w-4 h-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {!isApproved && (
        <div className="glass-panel rounded-2xl p-5 text-sm text-[var(--color-muted-ink)]">
          Your account must be approved before you can create events.
        </div>
      )}

      {query.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
          <CalendarPlus className="w-10 h-10 text-[var(--color-accent)]/40 mx-auto" />
          <p className="font-semibold text-[var(--color-ink)]">No events yet</p>
          <p className="text-sm text-[var(--color-muted-ink)]">Create your first event to start reaching Triad users.</p>
          {isApproved && (
            <Link href="/events/new">
              <Button>Create Event</Button>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {query.data?.map((ev) => <EventCard key={ev.id} ev={ev} />)}
      </div>
    </div>
  );
}
