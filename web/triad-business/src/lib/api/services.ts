import { apiRequest, apiUpload } from "@/lib/api/client";
import type {
  AuthResponse,
  BusinessCategory,
  BusinessAnalytics,
  BusinessEvent,
  BusinessEventStatus,
  BusinessOffer,
  BusinessPartner,
  BusinessProfileData,
  ChallengeResponseItem,
  CreateChallengeForm,
  CreateEventForm,
  CreateOfferForm,
  EventChallenge,
  EventImage,
  UpsertProfileForm,
} from "@/lib/types";

// ── Auth ──────────────────────────────────────────────────────────────────────

export function loginBusiness(email: string, password: string) {
  return apiRequest<AuthResponse>("auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function registerBusiness(username: string, email: string, password: string) {
  return apiRequest<AuthResponse>("auth/business/register", {
    method: "POST",
    body: { username, email, password },
  });
}

export function getBusinessCategories() {
  return apiRequest<BusinessCategory[]>("business/categories");
}

// ── Business Partner Profile ──────────────────────────────────────────────────

export function getMe(token: string) {
  return apiRequest<BusinessPartner>("business/me", { token });
}

export function onboard(token: string) {
  return apiRequest<BusinessPartner>("business/onboard", { method: "POST", token });
}

export function getBusinessProfile(token: string) {
  return apiRequest<BusinessProfileData>("business/profile", { token });
}

export function upsertBusinessProfile(token: string, data: UpsertProfileForm) {
  return apiRequest<BusinessProfileData>("business/profile", {
    method: "PUT",
    token,
    body: data,
  });
}

export function uploadLogo(token: string, file: File) {
  return apiUpload<{ url: string }>("business/profile/logo", token, file);
}

// ── Events ────────────────────────────────────────────────────────────────────

export function getMyEvents(token: string) {
  return apiRequest<BusinessEvent[]>("business/events", { token });
}

export function getMyEvent(token: string, id: string) {
  return apiRequest<BusinessEvent>(`business/events/${id}`, { token });
}

export function createEvent(token: string, data: CreateEventForm) {
  return apiRequest<BusinessEvent>("business/events", { method: "POST", token, body: data });
}

export function updateEvent(token: string, id: string, data: Partial<CreateEventForm>) {
  return apiRequest<BusinessEvent>(`business/events/${id}`, {
    method: "PUT",
    token,
    body: data,
  });
}

export function submitEventForApproval(token: string, id: string) {
  return apiRequest<void>(`business/events/${id}/submit`, { method: "POST", token });
}

export function deleteEvent(token: string, id: string) {
  return apiRequest<void>(`business/events/${id}`, { method: "DELETE", token });
}

export function uploadEventImage(token: string, eventId: string, file: File) {
  return apiUpload<EventImage>(`business/events/${eventId}/images`, token, file);
}

export function deleteEventImage(token: string, eventId: string, imageId: string) {
  return apiRequest<void>(`business/events/${eventId}/images/${imageId}`, {
    method: "DELETE",
    token,
  });
}

// ── Offers ────────────────────────────────────────────────────────────────────

export function getMyOffers(token: string, eventId?: string) {
  return apiRequest<BusinessOffer[]>("business/offers", {
    token,
    query: { eventId },
  });
}

export function getMyOffer(token: string, id: string) {
  return apiRequest<BusinessOffer>(`business/offers/${id}`, { token });
}

export function createOffer(token: string, eventId: string, data: CreateOfferForm) {
  return apiRequest<BusinessOffer>(`business/events/${eventId}/offers`, {
    method: "POST",
    token,
    body: data,
  });
}

export function updateOffer(token: string, id: string, data: Partial<CreateOfferForm>) {
  return apiRequest<BusinessOffer>(`business/offers/${id}`, {
    method: "PUT",
    token,
    body: data,
  });
}

export function submitOfferForApproval(token: string, id: string) {
  return apiRequest<void>(`business/offers/${id}/submit`, { method: "POST", token });
}

export function deleteOffer(token: string, id: string) {
  return apiRequest<void>(`business/offers/${id}`, { method: "DELETE", token });
}

// ── Challenge ─────────────────────────────────────────────────────────────────

export function getChallenge(token: string, eventId: string) {
  return apiRequest<EventChallenge>(`business/events/${eventId}/challenge`, { token });
}

export function createChallenge(token: string, eventId: string, data: CreateChallengeForm) {
  return apiRequest<EventChallenge>(`business/events/${eventId}/challenge`, {
    method: "POST",
    token,
    body: data,
  });
}

export function updateChallenge(token: string, challengeId: string, data: Partial<CreateChallengeForm>) {
  return apiRequest<EventChallenge>(`business/challenges/${challengeId}`, {
    method: "PUT",
    token,
    body: data,
  });
}

export function submitChallengeForApproval(token: string, challengeId: string) {
  return apiRequest<void>(`business/challenges/${challengeId}/submit`, { method: "POST", token });
}

export function deleteChallenge(token: string, challengeId: string) {
  return apiRequest<void>(`business/challenges/${challengeId}`, { method: "DELETE", token });
}

export function getChallengeResponses(token: string, challengeId: string) {
  return apiRequest<ChallengeResponseItem[]>(`business/challenges/${challengeId}/responses`, { token });
}

export function markWinner(
  token: string,
  challengeId: string,
  responseId: string,
  rewardCode?: string,
  rewardNote?: string,
) {
  return apiRequest<void>(`business/challenges/${challengeId}/responses/${responseId}/win`, {
    method: "POST",
    token,
    body: { rewardCode, rewardNote },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function getAnalytics(token: string) {
  return apiRequest<BusinessAnalytics>("business/analytics", { token });
}
