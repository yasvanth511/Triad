import { apiRequest } from "@/lib/api/client";
import type {
  AppNotification,
  AuthResponse,
  CoupleStatus,
  CreateCoupleResponse,
  DiscoveryCard,
  EventInterestToggleResponse,
  EventItem,
  ImpressMeInbox,
  ImpressMeSignal,
  ImpressMeSummary,
  LikeResult,
  MatchItem,
  MessageItem,
  NotificationListResponse,
  SavedProfileItem,
  UpdateProfileRequest,
  UserProfile,
  VerificationListResponse,
} from "@/lib/types";

export type SessionPayload = {
  token: string;
};

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>("auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function register(username: string, email: string, password: string) {
  return apiRequest<AuthResponse>("auth/register", {
    method: "POST",
    body: { username, email, password },
  });
}

export async function getCurrentProfile(token: string) {
  return apiRequest<UserProfile>("profile", { token });
}

export async function getProfileById(token: string, userId: string) {
  return apiRequest<UserProfile>(`profile/${userId.toLowerCase()}`, { token });
}

export async function updateProfile(token: string, payload: UpdateProfileRequest) {
  return apiRequest<UserProfile>("profile", {
    method: "PUT",
    token,
    body: payload,
  });
}

export async function deleteAccount(token: string) {
  return apiRequest("profile", {
    method: "DELETE",
    token,
  });
}

export async function getDiscovery(token: string, audience?: string | null) {
  return apiRequest<DiscoveryCard[]>("discovery", {
    token,
    query: {
      skip: 0,
      take: 20,
      userType: audience,
    },
  });
}

export async function likeProfile(token: string, targetUserId: string) {
  return apiRequest<LikeResult>("match/like", {
    method: "POST",
    token,
    body: { targetUserId },
  });
}

export async function saveProfile(token: string, targetUserId: string) {
  return apiRequest("saved", {
    method: "POST",
    token,
    body: { targetUserId },
  });
}

export async function getSavedProfiles(token: string) {
  return apiRequest<SavedProfileItem[]>("saved", { token });
}

export async function removeSavedProfile(token: string, targetUserId: string) {
  return apiRequest(`saved/${targetUserId.toLowerCase()}`, {
    method: "DELETE",
    token,
  });
}

export async function blockProfile(token: string, userId: string) {
  return apiRequest("safety/block", {
    method: "POST",
    token,
    body: { userId },
  });
}

export async function reportProfile(
  token: string,
  userId: string,
  reason: string,
  details?: string,
) {
  return apiRequest("safety/report", {
    method: "POST",
    token,
    body: { userId, reason, details: details || null },
  });
}

export async function getMatches(token: string) {
  return apiRequest<MatchItem[]>("match", { token });
}

export async function getMessages(token: string, matchId: string) {
  return apiRequest<MessageItem[]>(`message/${matchId.toLowerCase()}`, {
    token,
    query: { skip: 0, take: 50 },
  });
}

export async function sendMessage(token: string, matchId: string, content: string) {
  return apiRequest<MessageItem>(`message/${matchId.toLowerCase()}`, {
    method: "POST",
    token,
    body: { content },
  });
}

export async function getEvents(token: string) {
  return apiRequest<EventItem[]>("event", { token });
}

export async function toggleEventInterest(token: string, eventId: string) {
  return apiRequest<EventInterestToggleResponse>(`event/${eventId.toLowerCase()}/interest`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function getImpressMeInbox(token: string) {
  return apiRequest<ImpressMeInbox>("impress-me/inbox", { token });
}

export async function getImpressMeSummary(token: string) {
  return apiRequest<ImpressMeSummary>("impress-me/summary", { token });
}

export async function sendImpressMe(
  token: string,
  targetUserId: string,
  matchId?: string | null,
) {
  return apiRequest<ImpressMeSignal>("impress-me", {
    method: "POST",
    token,
    body: { targetUserId, matchId: matchId || null },
  });
}

export async function respondToImpressMe(token: string, signalId: string, textContent: string) {
  return apiRequest<ImpressMeSignal>(`impress-me/${signalId.toLowerCase()}/respond`, {
    method: "POST",
    token,
    body: { textContent },
  });
}

export async function reviewImpressMe(token: string, signalId: string) {
  return apiRequest<ImpressMeSignal>(`impress-me/${signalId.toLowerCase()}/review`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function acceptImpressMe(token: string, signalId: string) {
  return apiRequest<ImpressMeSignal>(`impress-me/${signalId.toLowerCase()}/accept`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function declineImpressMe(token: string, signalId: string) {
  return apiRequest<ImpressMeSignal>(`impress-me/${signalId.toLowerCase()}/decline`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function getNotifications(token: string) {
  return apiRequest<NotificationListResponse>("notifications", {
    token,
    query: { skip: 0, take: 50 },
  });
}

export async function markNotificationRead(token: string, notificationId: string) {
  return apiRequest(`notifications/${notificationId.toLowerCase()}/read`, {
    method: "POST",
    token,
    body: {},
  });
}

export async function markAllNotificationsRead(token: string) {
  return apiRequest("notifications/read-all", {
    method: "POST",
    token,
    body: {},
  });
}

export async function getCoupleStatus(token: string) {
  return apiRequest<CoupleStatus>("couple", { token });
}

export async function createCouple(token: string) {
  return apiRequest<CreateCoupleResponse>("couple", {
    method: "POST",
    token,
    body: {},
  });
}

export async function joinCouple(token: string, inviteCode: string) {
  return apiRequest<CreateCoupleResponse>("couple/join", {
    method: "POST",
    token,
    body: { inviteCode },
  });
}

export async function leaveCouple(token: string) {
  return apiRequest("couple", {
    method: "DELETE",
    token,
  });
}

export async function getVerifications(token: string) {
  const response = await apiRequest<VerificationListResponse>("verifications", { token });
  return response.methods;
}

export function notificationBadgeCount(notifications: AppNotification[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}
