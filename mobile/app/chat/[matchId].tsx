import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { api } from "../../src/services/api";
import {
  joinMatch,
  leaveMatch,
  onMessage,
  offMessage,
  onMessageError,
  sendRealtimeMessage,
} from "../../src/services/signalr";
import { COLORS, FONTS } from "../../src/constants";
import type { Message } from "../../src/types";

interface ParticipantParam {
  name: string;
  photo: string;
}

export default function ChatScreen() {
  const { matchId, participants: participantsParam, isGroup } = useLocalSearchParams<{
    matchId: string;
    participants?: string;
    isGroup?: string;
  }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const participants = useMemo<ParticipantParam[]>(() => {
    if (!participantsParam) return [];
    try { return JSON.parse(participantsParam); } catch { return []; }
  }, [participantsParam]);

  const isGroupChat = isGroup === "true";
  const chatTitle = participants.map((p) => p.name).join(" & ") || "Chat";

  const loadMessages = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const data = await api.get<Message[]>(`/message/${matchId}`);
      setMessages(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!matchId) return;

    const handler = (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    };

    const errorHandler = (error: string) => {
      Alert.alert("Message Error", error);
    };

    let active = true;
    // Must await joinMatch so the connection is established before registering
    // the ReceiveMessage handler — otherwise onMessage sees connection=null and
    // returns early, causing sent/received messages to never appear in the UI.
    joinMatch(matchId)
      .then(() => {
        if (!active) return;
        onMessage(handler);
        onMessageError(errorHandler);
      })
      .catch(() => {});

    return () => {
      active = false;
      offMessage(handler);
      leaveMatch(matchId).catch(() => {});
    };
  }, [matchId]);

  async function handleSend() {
    if (!text.trim() || !matchId) return;
    const content = text.trim();
    setText("");
    setSending(true);

    try {
      await sendRealtimeMessage(matchId, content);
    } catch {
      try {
        const msg = await api.post<Message>(`/message/${matchId}`, { content });
        setMessages((prev) => [...prev, msg]);
      } catch (e: any) {
        Alert.alert("Error", e.message);
        setText(content);
      }
    } finally {
      setSending(false);
    }
  }

  function handleReport() {
    const otherUserId = participants[0]?.name; // display name for prompt
    Alert.alert(
      "Report User",
      `Are you sure you want to report ${otherUserId ?? "this user"}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async () => {
            try {
              // POST /safety/report  { reportedUserId, reason }
              // We derive reportedUserId from match participants via the match ID.
              await api.post(`/safety/report`, {
                matchId,
                reason: "Reported via chat",
              });
              Alert.alert("Reported", "Your report has been submitted. Our team will review it.");
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Could not submit report.");
            }
          },
        },
      ]
    );
  }

  function handleBlock() {
    Alert.alert(
      "Block User",
      "Blocking will also remove this match. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              // POST /safety/block  { blockedUserId }
              await api.post(`/safety/block`, { matchId });
              Alert.alert("Blocked", "User has been blocked and the match removed.");
              router.back();
            } catch (e: any) {
              Alert.alert("Error", e.message ?? "Could not block user.");
            }
          },
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitle: () => (
            <View style={styles.headerTitle}>
              {isGroupChat ? (
                <View style={styles.groupAvatarWrap}>
                  {participants.slice(0, 2).map((p, i) => (
                    <View
                      key={i}
                      style={[styles.headerAvatarStack, { left: i * 14, zIndex: 2 - i }]}
                    >
                      {p.photo ? (
                        <Image source={{ uri: p.photo }} style={styles.headerAvatar} />
                      ) : (
                        <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                          <Ionicons name="person" size={12} color={COLORS.textTertiary} />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                participants[0]?.photo ? (
                  <Image source={{ uri: participants[0].photo }} style={styles.headerAvatar} />
                ) : (
                  <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
                    <Ionicons name="person" size={16} color={COLORS.textTertiary} />
                  </View>
                )
              )}
              <View>
                <Text style={styles.headerName} numberOfLines={1}>{chatTitle}</Text>
                {isGroupChat && (
                  <Text style={styles.headerSub}>{participants.length} people</Text>
                )}
              </View>
            </View>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleReport}>
                <Ionicons name="flag-outline" size={22} color={COLORS.warning} />
              </TouchableOpacity>
              {!isGroupChat && (
                <TouchableOpacity onPress={handleBlock}>
                  <Ionicons name="ban-outline" size={22} color={COLORS.error} />
                </TouchableOpacity>
              )}
            </View>
          ),
        }}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
          renderItem={({ item }) => {
            const isMe = item.senderId === user?.id;
            return (
              <View
                style={[
                  styles.bubbleWrap,
                  isMe ? styles.bubbleWrapMe : styles.bubbleWrapThem,
                ]}
              >
                {isGroupChat && !isMe && (
                  <View style={styles.senderRow}>
                    {item.senderPhotoUrl ? (
                      <Image source={{ uri: item.senderPhotoUrl }} style={styles.senderAvatar} />
                    ) : (
                      <View style={[styles.senderAvatar, styles.senderAvatarFallback]}>
                        <Ionicons name="person" size={10} color={COLORS.textTertiary} />
                      </View>
                    )}
                    <Text style={styles.senderName}>{item.senderUsername}</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{item.content}</Text>
                  <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
                    {new Date(item.sentAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isMe && item.isRead && " ✓"}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Say hello! 👋</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={COLORS.textSecondary}
          maxLength={2000}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, // COLORS.background is now warm light
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 10 },
  groupAvatarWrap: { width: 48, height: 34, position: "relative" },
  headerAvatarStack: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: COLORS.background,
    borderRadius: 17,
  },
  headerAvatar: { width: 34, height: 34, borderRadius: 17 },
  headerAvatarFallback: {
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  headerName: { color: COLORS.text, fontSize: 16, fontWeight: "600", maxWidth: 160 },
  headerSub: { color: COLORS.textTertiary, fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 16, marginRight: 8 },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  bubbleWrap: {
    marginBottom: 8,
  },
  bubbleWrapMe: { alignItems: "flex-end" },
  bubbleWrapThem: { alignItems: "flex-start" },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
    marginLeft: 2,
  },
  senderAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceLight,
  },
  senderAvatarFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  senderName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "78%",
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: 4,
  },
  messageText: { color: COLORS.text, fontSize: FONTS.regular },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: "right",
  },
  messageTimeMe: { color: "rgba(255,255,255,0.75)" },   // white on violet bubble
  messageTimeThem: { color: COLORS.textTertiary },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.large,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,  // white bar on light theme
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    color: COLORS.text,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: FONTS.regular,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDisabled: { opacity: 0.5 },
});
