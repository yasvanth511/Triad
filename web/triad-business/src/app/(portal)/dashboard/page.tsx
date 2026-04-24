"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarPlus, Gift, Sparkles } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getMyEvents, getAnalytics } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { token, partner } = useSession();

  const eventsQuery = useQuery({
    queryKey: ["my-events"],
    queryFn: () => getMyEvents(token!),
    enabled: !!token && partner?.status === "Approved",
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(token!),
    enabled: !!token && partner?.status === "Approved",
  });

  const isApproved = partner?.status === "Approved";
  const recentEvents = (eventsQuery.data ?? []).slice(0, 5);
  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-[var(--color-ink)]">
            {partner?.profile ? `Hi, ${partner.profile.businessName}` : "Welcome"}
          </h1>
          <p className="text-[var(--color-muted-ink)] text-sm mt-1">
            {isApproved ? "Your account is active." : "Your account is pending review before you can publish content."}
          </p>
        </div>
        {partner && <StatusBadge status={partner.status} />}
      </div>

      {/* Setup prompt */}
      {!partner?.profile && (
        <div className="glass-panel rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-[var(--color-ink)]">Complete your profile</h2>
            <p className="text-sm text-[var(--color-muted-ink)]">Add your business details to get reviewed.</p>
          </div>
          <Link href="/onboarding">
            <Button>Set up profile</Button>
          </Link>
        </div>
      )}

      {/* Rejection notice */}
      {partner?.status === "Rejected" && partner.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <strong>Account rejected:</strong> {partner.rejectionReason}
          <Link href="/profile" className="ml-2 underline font-medium">Update profile</Link>
        </div>
      )}

      {/* Metric cards */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Events", value: analytics.totalEvents },
            { label: "Total Likes", value: analytics.totalLikes },
            { label: "Registrations", value: analytics.totalRegistrations },
            { label: "Coupon Claims", value: analytics.totalCouponClaims },
          ].map(({ label, value }) => (
            <div key={label} className="glass-panel rounded-2xl p-4">
              <p className="text-2xl font-bold text-[var(--color-ink)]">{value}</p>
              <p className="text-xs text-[var(--color-muted-ink)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Primary CTAs */}
      {isApproved && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/events/new" className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center group-hover:bg-[var(--color-accent)]/20 transition-colors">
              <CalendarPlus className="w-6 h-6 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-ink)]">Create Event</p>
              <p className="text-sm text-[var(--color-muted-ink)]">Promote to Triad users</p>
            </div>
          </Link>

          <Link href="/offers" className="glass-panel rounded-2xl p-5 flex items-center gap-4 hover:shadow-lg transition-shadow group">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-secondary)]/10 flex items-center justify-center group-hover:bg-[var(--color-secondary)]/20 transition-colors">
              <Gift className="w-6 h-6 text-[var(--color-secondary)]" />
            </div>
            <div>
              <p className="font-bold text-[var(--color-ink)]">Add Offer</p>
              <p className="text-sm text-[var(--color-muted-ink)]">Coupons & discounts</p>
            </div>
          </Link>
        </div>
      )}

      {/* Recent events */}
      {recentEvents.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-[var(--color-ink)]">Recent Events</h2>
            <Link href="/events" className="text-sm text-[var(--color-accent)] hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="glass-panel rounded-xl px-4 py-3 flex items-center justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-semibold text-sm text-[var(--color-ink)]">{ev.title}</p>
                  <p className="text-xs text-[var(--color-muted-ink)]">
                    {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : "No date set"} · {ev.likeCount} likes · {ev.registrationCount} registrations
                  </p>
                </div>
                <StatusBadge status={ev.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
