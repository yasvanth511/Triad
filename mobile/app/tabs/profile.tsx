import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../../src/contexts/AuthContext";
import { api } from "../../src/services/api";
import { COLORS, FONTS, SPACING, RADIUS } from "../../src/constants";
import { buildPhotoUrl } from "../../src/utils/photos";
import { base, clay } from "../../src/styles";
import type { CoupleResponse, Photo } from "../../src/types";

export default function ProfileScreen() {
  const { user, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  const [ageMin, setAgeMin] = useState(String(user?.ageMin || ""));
  const [ageMax, setAgeMax] = useState(String(user?.ageMax || ""));
  const [intent, setIntent] = useState(user?.intent || "");
  const [lookingFor, setLookingFor] = useState(user?.lookingFor || "");
  const [interests, setInterests] = useState(user?.interests.join(", ") || "");
  const [coupleCode, setCoupleCode] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/profile", {
        bio,
        ageMin: parseInt(ageMin) || 0,
        ageMax: parseInt(ageMax) || 0,
        intent,
        lookingFor,
        interests: interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await refreshProfile();
      setEditing(false);
      Alert.alert("Success", "Profile updated!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    formData.append("file", {
      uri: asset.uri,
      type: "image/jpeg",
      name: "photo.jpg",
    } as any);

    try {
      await api.upload<Photo>("/profile/photos", formData);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    try {
      await api.delete(`/profile/photos/${photoId}`);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleCreateCouple() {
    try {
      const res = await api.post<CoupleResponse>("/couple");
      Alert.alert("Couple Created", `Share this code with your partner:\n\n${res.inviteCode}`);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleJoinCouple() {
    if (!coupleCode) {
      Alert.alert("Error", "Please enter an invite code.");
      return;
    }
    try {
      await api.post("/couple/join", { inviteCode: coupleCode });
      Alert.alert("Success", "You joined a couple!");
      setCoupleCode("");
      await refreshProfile();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  async function handleLeaveCouple() {
    Alert.alert("Leave Couple", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Leave",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/couple");
            await refreshProfile();
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.username}>@{user.username}</Text>
        {user.isCouple && (
          <View style={styles.coupleBadge}>
            <Text style={styles.coupleText}>Couple</Text>
          </View>
        )}
      </View>

      {/* Photos */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PHOTOS ({user.photos.length}/3)</Text>
        <View style={styles.photosRow}>
          {user.photos.map((photo) => (
            <View key={photo.id} style={styles.photoWrapper}>
              <Image
                source={{ uri: buildPhotoUrl(photo.url) }}
                style={styles.photo}
              />
              <TouchableOpacity
                style={styles.deletePhoto}
                onPress={() => handleDeletePhoto(photo.id)}
              >
                <Ionicons name="close-circle" size={22} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          {user.photos.length < 3 && (
            <TouchableOpacity style={styles.addPhoto} onPress={handlePickPhoto}>
              <Ionicons name="add" size={28} color={COLORS.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* About You */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>ABOUT YOU</Text>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editLink}>{editing ? "Cancel" : "Edit"}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.form}>
            <Text style={base.label}>Bio</Text>
            <TextInput
              style={[base.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={500}
              placeholder="Tell people about yourself..."
              placeholderTextColor={COLORS.textTertiary}
            />

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={base.label}>Age Min</Text>
                <TextInput
                  style={base.input}
                  value={ageMin}
                  onChangeText={setAgeMin}
                  keyboardType="numeric"
                  placeholder="18"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
              <View style={styles.half}>
                <Text style={base.label}>Age Max</Text>
                <TextInput
                  style={base.input}
                  value={ageMax}
                  onChangeText={setAgeMax}
                  keyboardType="numeric"
                  placeholder="99"
                  placeholderTextColor={COLORS.textTertiary}
                />
              </View>
            </View>

            <Text style={base.label}>Intent</Text>
            <TextInput
              style={base.input}
              value={intent}
              onChangeText={setIntent}
              maxLength={50}
              placeholder="e.g. Casual, Friendship, Dating"
              placeholderTextColor={COLORS.textTertiary}
            />

            <Text style={base.label}>Looking For</Text>
            <View style={styles.row}>
              {["single", "couple"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.optionBtn,
                    lookingFor === opt && styles.optionActive,
                  ]}
                  onPress={() => setLookingFor(opt)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      lookingFor === opt && styles.optionTextActive,
                    ]}
                  >
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={base.label}>Interests</Text>
            <TextInput
              style={base.input}
              value={interests}
              onChangeText={setInterests}
              placeholder="e.g. hiking, cooking, movies"
              placeholderTextColor={COLORS.textTertiary}
            />

            <TouchableOpacity
              style={[clay.button, clay.primary, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={clay.buttonText}>
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.display}>
            <Text style={styles.bioText}>{user.bio || "No bio yet"}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                Age {user.ageMin}–{user.ageMax}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="heart-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                {user.intent || "Not set"}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="search-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                Looking for {user.lookingFor || "anyone"}
              </Text>
            </View>
            {user.interests.length > 0 && (
              <View style={styles.tags}>
                {user.interests.map((tag) => (
                  <View key={tag} style={base.chip}>
                    <Text style={base.chipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>

      {/* Couple */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>COUPLE</Text>
        {user.coupleId ? (
          <View style={{ gap: SPACING.md }}>
            <View style={styles.detailRow}>
              <Ionicons name="link-outline" size={14} color={COLORS.success} />
              <Text style={[styles.detailText, { color: COLORS.success }]}>
                Linked as a couple
              </Text>
            </View>
            <TouchableOpacity style={styles.dangerBtn} onPress={handleLeaveCouple}>
              <Text style={styles.dangerBtnText}>Leave Couple</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: SPACING.md }}>
            {/* Clay CTA — "Create Couple" */}
            <TouchableOpacity
              style={[clay.button, clay.secondary]}
              onPress={handleCreateCouple}
            >
              <Text style={clay.buttonText}>Create Couple</Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or join existing</Text>
              <View style={styles.dividerLine} />
            </View>

            <TextInput
              style={base.input}
              value={coupleCode}
              onChangeText={setCoupleCode}
              placeholder="Enter invite code"
              placeholderTextColor={COLORS.textTertiary}
              autoCapitalize="characters"
              maxLength={20}
            />
            {/* Clay CTA — "Join Couple" */}
            <TouchableOpacity
              style={[clay.button, clay.primary]}
              onPress={handleJoinCouple}
            >
              <Text style={clay.buttonText}>Join Couple</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Sign Out */}
      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={async () => { await logout(); router.replace('/'); }}
      >
        <Ionicons name="log-out-outline" size={18} color={COLORS.textTertiary} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  username: {
    fontSize: FONTS.title,
    fontWeight: "700",
    color: COLORS.text,
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
  coupleText: {
    color: COLORS.secondary,
    fontSize: FONTS.xs,
    fontWeight: "700",
  },

  // Section
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.xs,
    fontWeight: "600",
    letterSpacing: 1.2,
    marginBottom: SPACING.sm,
  },
  editLink: {
    color: COLORS.primary,
    fontSize: FONTS.small,
    fontWeight: "600",
  },

  // Photos
  photosRow: { flexDirection: "row", gap: SPACING.sm, flexWrap: "wrap" },
  photoWrapper: { position: "relative" },
  photo: { width: 100, height: 130, borderRadius: RADIUS.sm },
  deletePhoto: { position: "absolute", top: -6, right: -6 },
  addPhoto: {
    width: 100,
    height: 130,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },

  // Form
  form: { gap: SPACING.md },
  textArea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: SPACING.md },
  half: { flex: 1 },
  optionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceLight,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionActive: {
    backgroundColor: COLORS.primaryMuted,
    borderColor: COLORS.primary,
  },
  optionText: { color: COLORS.textSecondary, fontWeight: "500" },
  optionTextActive: { color: COLORS.primary, fontWeight: "700" },

  // Display mode
  display: { gap: SPACING.sm },
  bioText: {
    color: COLORS.text,
    fontSize: FONTS.regular,
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  detailText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.small,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: SPACING.xs,
  },

  // Couple
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    color: COLORS.textTertiary,
    fontSize: FONTS.xs,
  },
  dangerBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: RADIUS.sm,
    padding: 14,
    alignItems: "center",
  },
  dangerBtnText: {
    color: COLORS.error,
    fontWeight: "600",
    fontSize: FONTS.small,
  },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  logoutText: {
    color: COLORS.textTertiary,
    fontSize: FONTS.small,
  },
});
