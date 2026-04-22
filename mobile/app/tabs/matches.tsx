import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { api } from "../../src/services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../src/constants";
import { buildPhotoUrl } from "../../src/utils/photos";
import type { MatchItem, ParticipantInfo } from "../../src/types";

function ParticipantAvatars({ participants }: { participants: ParticipantInfo[] }) {
  const shown = participants.slice(0, 3);
  const AVATAR = 48;
  const OVERLAP = 16;
  const totalWidth = AVATAR + (shown.length - 1) * (AVATAR - OVERLAP);

  return (
    <View style={{ width: totalWidth, height: AVATAR, position: "relative" }}>
      {shown.map((p, i) => {
        const photoUrl = p.photos[0] ? buildPhotoUrl(p.photos[0].url) : null;
        return (
          <View
            key={p.userId}
            style={[
              styles.stackedAvatar,
              { left: i * (AVATAR - OVERLAP), zIndex: shown.length - i },
            ]}
          >
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.noAvatar]}>
                <Ionicons name="person" size={18} color={COLORS.textTertiary} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function MatchesScreen() {
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<MatchItem[]>("/match");
      setMatches(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  function openChat(match: MatchItem) {
    const participants = JSON.stringify(
      match.participants.map((p) => ({
        name: p.username,
        photo: p.photos[0] ? buildPhotoUrl(p.photos[0].url) : "",
      }))
    );
    router.push(
      `/chat/${match.matchId}?participants=${encodeURIComponent(participants)}&isGroup=${match.isGroupChat}`
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="heart-outline" size={56} color={COLORS.textTertiary} />
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySubtext}>
          Start swiping to find your match
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={matches}
        keyExtractor={(item) => item.matchId}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
        renderItem={({ item }) => {
          const names = item.participants.map((p) => p.username).join(" & ");
          const hasCouple = item.participants.some((p) => p.isCouple);

          return (
            <TouchableOpacity
              style={styles.matchCard}
              onPress={() => openChat(item)}
              activeOpacity={0.7}
            >
              <BlurView intensity={40} tint="light" style={styles.matchBlur}>
                <View style={styles.matchInner}>
                  {/* Avatars — stacked for group, single for 1:1 */}
                  {item.isGroupChat ? (
                    <ParticipantAvatars participants={item.participants} />
                  ) : (
                    (() => {
                      const p = item.participants[0];
                      const photoUrl = p?.photos[0] ? buildPhotoUrl(p.photos[0].url) : null;
                      return photoUrl ? (
                        <Image source={{ uri: photoUrl }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.noAvatar]}>
                          <Ionicons name="person" size={22} color={COLORS.textTertiary} />
                        </View>
                      );
                    })()
                  )}

                  {/* Info */}
                  <View style={styles.matchInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.matchName} numberOfLines={1}>
                        {names}
                      </Text>
                      {item.isGroupChat && (
                        <View style={styles.groupBadge}>
                          <Ionicons name="people" size={10} color={COLORS.primary} style={{ marginRight: 3 }} />
                          <Text style={styles.groupText}>Group</Text>
                        </View>
                      )}
                      {!item.isGroupChat && hasCouple && (
                        <View style={styles.coupleBadge}>
                          <Text style={styles.coupleText}>Couple</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.matchDate}>
                      Matched {new Date(item.matchedAt).toLocaleDateString()}
                    </Text>
                  </View>

                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
              </BlurView>
            </TouchableOpacity>
          );
        }}
      />
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
  list: {
    padding: SPACING.md,
  },
  matchCard: {
    borderRadius: RADIUS.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.borderGlass,
  },
  matchBlur: {
    overflow: "hidden",
  },
  matchInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.surfaceGlass,
  },
  stackedAvatar: {
    position: "absolute",
    borderWidth: 2,
    borderColor: COLORS.background,
    borderRadius: 24,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
  },
  noAvatar: {
    justifyContent: "center",
    alignItems: "center",
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  matchName: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    fontWeight: "600",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  groupBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryMuted ?? "rgba(99,102,241,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  groupText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  coupleBadge: {
    backgroundColor: COLORS.secondaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  coupleText: {
    color: COLORS.secondary,
    fontSize: 10,
    fontWeight: "700",
  },
  matchDate: {
    color: COLORS.textTertiary,
    fontSize: FONTS.xs,
  },
});
