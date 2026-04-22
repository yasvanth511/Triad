import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { api } from "../../src/services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../src/constants";
import type { EventItem } from "../../src/types";

const { width } = Dimensions.get("window");
const BANNER_HEIGHT = 180;

export default function EventsScreen() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const data = await api.get<EventItem[]>("/event");
      setEvents(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handleInterested(eventId: string) {
    try {
      const res = await api.post<{ isInterested: boolean; interestedCount: number }>(
        `/event/${eventId}/interest`,
        {}
      );
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? { ...e, isInterested: res.isInterested, interestedCount: res.interestedCount }
            : e
        )
      );
    } catch {
      // silent
    }
  }

  async function handleShare(event: EventItem) {
    const dateStr = new Date(event.eventDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    await Share.share({
      message: `Check out "${event.title}" on ${dateStr} at ${event.venue || event.city}! 🎉`,
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (events.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={56} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No upcoming events</Text>
        <Text style={styles.emptySubtext}>Check back later for events near you</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadEvents();
            }}
            tintColor={COLORS.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: SPACING.md }} />}
        renderItem={({ item }) => <EventCard event={item} onInterested={handleInterested} onShare={handleShare} />}
      />
    </View>
  );
}

function EventCard({
  event,
  onInterested,
  onShare,
}: {
  event: EventItem;
  onInterested: (id: string) => void;
  onShare: (event: EventItem) => void;
}) {
  const eventDate = new Date(event.eventDate);
  const dayStr = eventDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNum = eventDate.getDate();
  const monthStr = eventDate.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const timeStr = eventDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.card}>
      {/* Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={{ uri: event.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        />
        {/* Date badge overlaid on banner */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateBadgeDay}>{dayStr}</Text>
          <Text style={styles.dateBadgeNum}>{dayNum}</Text>
          <Text style={styles.dateBadgeMonth}>{monthStr}</Text>
        </View>
      </View>

      {/* Card body */}
      <BlurView intensity={50} tint="light" style={styles.cardBody}>
        <View style={styles.cardInner}>
          {/* Title + meta */}
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{timeStr}</Text>
            {(event.venue || event.city) && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.metaText} numberOfLines={1}>
                  {event.venue || `${event.city}, ${event.state}`}
                </Text>
              </>
            )}
            {event.distanceKm != null && (
              <>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{event.distanceKm} km away</Text>
              </>
            )}
          </View>

          {event.description ? (
            <Text style={styles.description} numberOfLines={2}>{event.description}</Text>
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, event.isInterested && styles.actionBtnActive]}
              onPress={() => onInterested(event.id)}
              activeOpacity={0.75}
            >
              <Ionicons
                name={event.isInterested ? "star" : "star-outline"}
                size={16}
                color={event.isInterested ? COLORS.background : COLORS.primary}
              />
              <Text style={[styles.actionText, event.isInterested && styles.actionTextActive]}>
                {event.isInterested ? "Interested" : "Interested?"}
              </Text>
              {event.interestedCount > 0 && (
                <View style={[styles.countBadge, event.isInterested && styles.countBadgeActive]}>
                  <Text style={[styles.countText, event.isInterested && styles.countTextActive]}>
                    {event.interestedCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => onShare(event)}
              activeOpacity={0.75}
            >
              <Ionicons name="share-social-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    gap: SPACING.sm,
  },
  emptyTitle: { color: COLORS.text, fontSize: FONTS.large, fontWeight: "600", marginTop: SPACING.sm },
  emptySubtext: { color: COLORS.textSecondary, fontSize: FONTS.small, textAlign: "center", paddingHorizontal: SPACING.xl },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },

  // Card
  card: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  // Banner
  bannerContainer: { position: "relative" },
  banner: { width: "100%", height: BANNER_HEIGHT, backgroundColor: COLORS.surfaceLight },
  dateBadge: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.overlay,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 44,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  // Date badge sits on a photo, so keep white text regardless of theme
  dateBadgeDay: { color: COLORS.white, fontSize: 10, fontWeight: "700", letterSpacing: 1, opacity: 0.85 },
  dateBadgeNum: { color: COLORS.white, fontSize: 22, fontWeight: "800", lineHeight: 26 },
  dateBadgeMonth: { color: COLORS.white, fontSize: 10, fontWeight: "700", letterSpacing: 1, opacity: 0.75 },

  // Body
  cardBody: { overflow: "hidden" },
  cardInner: { padding: SPACING.md, gap: SPACING.xs },

  title: { color: COLORS.text, fontSize: FONTS.large, fontWeight: "700", lineHeight: 24 },
  description: { color: COLORS.textSecondary, fontSize: FONTS.small, lineHeight: 20 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  metaText: { color: COLORS.textSecondary, fontSize: 12, flexShrink: 1 },
  metaDot: { color: COLORS.textTertiary, fontSize: 12 },

  // Actions
  actions: {
    flexDirection: "row",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    alignItems: "center",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryMuted,
  },
  actionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionText: { color: COLORS.primary, fontSize: FONTS.small, fontWeight: "600" },
  actionTextActive: { color: COLORS.background },
  countBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  countBadgeActive: { backgroundColor: COLORS.background },
  countText: { color: COLORS.background, fontSize: 10, fontWeight: "700" },
  countTextActive: { color: COLORS.primary },

  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  shareBtnText: { color: COLORS.textSecondary, fontSize: FONTS.small, fontWeight: "600" },
});
