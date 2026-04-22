import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { api } from "../../src/services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../src/constants";
import { buildPhotoUrl } from "../../src/utils/photos";
import { clay } from "../../src/styles";
import type { DiscoveryCard } from "../../src/types";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.62;

export default function DiscoverScreen() {
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?userType=${filter}` : "";
      const data = await api.get<DiscoveryCard[]>(`/discovery${params}`);
      setCards(data);
      setCurrentIndex(0);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // Initial load via useEffect; re-load on tab focus for freshness.
  // useFocusEffect fires on first mount too, so useEffect is NOT needed separately
  // — keeping both caused a double-fetch on the first render.
  useFocusEffect(
    useCallback(() => {
      loadCards();
    }, [loadCards])
  );

  async function handleLike() {
    const card = cards[currentIndex];
    if (!card) return;
    try {
      const res = await api.post<{ matched: boolean }>("/match/like", {
        targetUserId: card.userId,
      });
      if (res.matched) {
        Alert.alert("It's a Match! 🎉", `You matched with ${card.username}!`);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
    nextCard();
  }

  function handleSkip() {
    nextCard();
  }

  function nextCard() {
    if (currentIndex >= cards.length - 1) {
      loadCards();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  const card = cards[currentIndex];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!card) {
    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={56} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No one nearby</Text>
        <Text style={styles.emptySubtext}>Check back later or adjust your filters</Text>
        <TouchableOpacity style={[clay.button, clay.primary, { marginTop: SPACING.lg }]} onPress={loadCards}>
          <Text style={clay.buttonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const photoUrl = card.photos[0]
    ? buildPhotoUrl(card.photos[0].url)
    : null;

  return (
    <View style={styles.container}>
      {/* Filter pills */}
      <View style={styles.filterRow}>
        {["all", "single", "couple"].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterPill,
              (filter === f || (f === "all" && !filter)) && styles.filterActive,
            ]}
            onPress={() => setFilter(f === "all" ? null : f)}
          >
            <Text
              style={[
                styles.filterText,
                (filter === f || (f === "all" && !filter)) && styles.filterTextActive,
              ]}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Glassmorphism Card ── */}
      <View style={styles.cardWrapper}>
        <View style={styles.card}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={[styles.photo, styles.noPhoto]}>
              <Ionicons name="person" size={72} color={COLORS.textTertiary} />
            </View>
          )}

          {/* Gradient overlay on bottom of photo */}
          <LinearGradient
            colors={["transparent", "rgba(30,19,51,0.80)"]}
            style={styles.photoGradient}
          />

          {/* Glass info overlay at bottom of photo */}
          <View style={styles.glassOverlay}>
            <BlurView intensity={55} tint="light" style={styles.blurFill}>
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.username}>{card.username}</Text>
                  {card.isCouple && (
                    <View style={styles.coupleBadge}>
                      <Text style={styles.badgeText}>Couple</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.meta}>
                  {card.ageMin}–{card.ageMax}
                  {card.approximateDistanceKm != null &&
                    `  ·  ~${card.approximateDistanceKm} km`}
                </Text>

                <Text style={styles.bio} numberOfLines={2}>
                  {card.bio}
                </Text>

                {card.intent ? (
                  <Text style={styles.intent}>{card.intent}</Text>
                ) : null}

                {card.interests.length > 0 && (
                  <View style={styles.tags}>
                    {card.interests.slice(0, 4).map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </BlurView>
          </View>
        </View>
      </View>

      {/* ── Clay Action Buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Ionicons name="close" size={30} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={[clay.button, clay.primary, styles.likeBtn]} onPress={handleLike}>
          <Ionicons name="heart" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: FONTS.large,
    fontWeight: "600",
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    marginTop: SPACING.xs,
  },

  // Filter pills
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  filterPill: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: "500",
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },

  // Card
  cardWrapper: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  card: {
    flex: 1,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  photo: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.surfaceLight,
  },
  noPhoto: {
    justifyContent: "center",
    alignItems: "center",
  },
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "55%",
  },

  // Glass overlay on card
  glassOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    overflow: "hidden",
    borderTopWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  blurFill: {
    padding: SPACING.md,
  },
  cardInfo: {
    gap: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  username: {
    fontSize: FONTS.title,
    fontWeight: "700",
    color: COLORS.text,   // dark text — readable on frosted-light glass
    letterSpacing: -0.3,
  },
  coupleBadge: {
    backgroundColor: COLORS.secondaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: FONTS.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  meta: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
    fontWeight: "500",
  },
  bio: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    lineHeight: 22,
  },
  intent: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: "600",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tag: {
    backgroundColor: COLORS.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: FONTS.xs,
    fontWeight: "600",
  },

  // Actions
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  skipBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  likeBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
});
