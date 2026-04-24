"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getMyOffers } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/status-badge";

export default function OffersPage() {
  const { token } = useSession();
  const offersQuery = useQuery({
    queryKey: ["my-offers", "all"],
    queryFn: () => getMyOffers(token!),
    enabled: !!token,
  });

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="page-title text-[var(--color-ink)]">My Offers</h1>
        <p className="text-sm text-[var(--color-muted-ink)] mt-1">
          Offers are attached to events and require approval before users can claim them.
        </p>
      </div>

      {offersQuery.isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {offersQuery.data?.length === 0 && (
        <div className="glass-panel rounded-2xl p-10 text-center space-y-3">
          <Gift className="w-10 h-10 text-[var(--color-secondary)]/40 mx-auto" />
          <p className="font-semibold text-[var(--color-ink)]">No offers yet</p>
          <p className="text-sm text-[var(--color-muted-ink)]">
            Add an offer from one of your event pages.
          </p>
          <Link href="/events" className="text-sm font-semibold text-[var(--color-accent)] hover:underline">
            Browse events
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {offersQuery.data?.map((offer) => (
          <Link
            key={offer.id}
            href={`/events/${offer.businessEventId}/offers`}
            className="glass-panel rounded-2xl p-5 flex items-start justify-between gap-4 hover:shadow-lg transition-shadow"
          >
            <div className="space-y-1 min-w-0">
              <p className="font-semibold text-[var(--color-ink)]">{offer.title}</p>
              <p className="text-sm text-[var(--color-muted-ink)]">
                {offer.eventTitle} · {offer.offerType}
                {offer.couponCode ? ` · ${offer.couponCode}` : ""}
              </p>
              <p className="text-xs text-[var(--color-muted-ink)]">
                {offer.claimCount} claims
                {offer.expiryDate ? ` · Expires ${new Date(offer.expiryDate).toLocaleDateString()}` : ""}
              </p>
              {offer.rejectionReason && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-1.5 inline-block">
                  {offer.rejectionReason}
                </p>
              )}
            </div>
            <StatusBadge status={offer.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
