"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";
import { getAnalytics } from "@/lib/api/services";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AnalyticsPage() {
  const { token } = useSession();
  const analyticsQuery = useQuery({
    queryKey: ["analytics"],
    queryFn: () => getAnalytics(token!),
    enabled: !!token,
  });

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6 py-4">
      <div>
        <h1 className="page-title text-[var(--color-ink)]">Performance</h1>
        <p className="text-sm text-[var(--color-muted-ink)] mt-1">
          Simple aggregate counts for your events, offers, and challenges.
        </p>
      </div>

      {analytics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              ["Published Events", analytics.publishedEvents],
              ["Likes", analytics.totalLikes],
              ["Saves", analytics.totalSaves],
              ["Registrations", analytics.totalRegistrations],
              ["Coupon Claims", analytics.totalCouponClaims],
            ].map(([label, value]) => (
              <div key={label} className="glass-panel rounded-2xl p-4">
                <p className="text-2xl font-bold text-[var(--color-ink)]">{value}</p>
                <p className="text-xs text-[var(--color-muted-ink)] mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-[var(--color-accent)]" />
              <h2 className="font-bold text-[var(--color-ink)]">Event Breakdown</h2>
            </div>
            <div className="space-y-3">
              {analytics.eventBreakdown.map((item) => (
                <div key={item.eventId} className="rounded-xl bg-white/60 border border-white/70 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--color-ink)]">{item.eventTitle}</p>
                      <p className="text-xs text-[var(--color-muted-ink)] mt-1">
                        {item.likes} likes · {item.saves} saves · {item.registrations} registrations · {item.challengeResponses} responses · {item.couponClaims} claims
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
