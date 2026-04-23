"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { NotificationRow } from "@/components/domain/notification-row";
import { ScreenHeader } from "@/components/app/screen-header";
import { useSession } from "@/components/providers/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api/services";

export function NotificationsScreen() {
  const { token } = useSession();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", token],
    queryFn: () => getNotifications(token!),
    enabled: Boolean(token),
  });

  const markOneMutation = useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(token!, notificationId),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not mark notification read."),
  });

  const markAllMutation = useMutation({
    mutationFn: () => markAllNotificationsRead(token!),
    onSuccess: async () => {
      await notificationsQuery.refetch();
    },
  });

  const notifications = notificationsQuery.data?.notifications || [];
  const unreadCount = notificationsQuery.data?.unreadCount || 0;

  return (
    <div className="space-y-5">
      <ScreenHeader
        title="Notifications"
        description="Likes, matches, messages, and Impress Me activity stay collected in one quiet, readable inbox."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllMutation.mutate()} disabled={markAllMutation.isPending}>
              Mark all read
            </Button>
          ) : null
        }
      />

      {notifications.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-ink)]">
              Unread
            </p>
            <p className="text-3xl font-semibold text-[var(--color-ink)]">{unreadCount}</p>
          </Card>
          <Card className="space-y-1 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-ink)]">
              Total
            </p>
            <p className="text-3xl font-semibold text-[var(--color-ink)]">{notifications.length}</p>
          </Card>
        </div>
      ) : null}

      {notifications.length === 0 ? (
        <EmptyState
          title="All caught up"
          message="Likes, matches, messages, and Impress Me challenges will appear here."
        />
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            onClick={() => {
              if (!notification.isRead) {
                markOneMutation.mutate(notification.id);
              }
            }}
          >
            <NotificationRow
              notification={notification}
              href={notification.actorId ? `/profile/${notification.actorId}` : undefined}
            />
          </div>
        ))
      )}
    </div>
  );
}
