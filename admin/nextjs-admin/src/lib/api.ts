import type {
  AdminBusinessEventSummary,
  AdminBusinessOfferSummary,
  AdminBusinessPartnerSummary,
  AdminChallengeSummary,
  BusinessAuditLogItem,
  ModerationAnalytics,
  UserDetail,
  UserSummary,
} from './types';

const ADMIN_TOKEN_KEY = 'triad.admin.token';

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = window.localStorage.getItem(ADMIN_TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
  return res.json() as Promise<T>;
}

async function postJson<T>(url: string, body: unknown = {}): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function fetchUsers(): Promise<UserSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/users');
  return Array.isArray(data) ? (data as UserSummary[]) : [];
}

export async function fetchOnlineUsers(): Promise<UserSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/online-users');
  return Array.isArray(data) ? (data as UserSummary[]) : [];
}

export async function fetchUserDetail(id: string | number): Promise<UserDetail> {
  const data = await fetchJson<unknown>(
    `/api/admin/users/${encodeURIComponent(String(id))}`,
  );
  return (data && typeof data === 'object' ? data : {}) as UserDetail;
}

export async function fetchModerationAnalytics(): Promise<ModerationAnalytics> {
  const data = await fetchJson<unknown>('/api/admin/moderation-analytics');
  return (data && typeof data === 'object' ? data : {}) as ModerationAnalytics;
}

export function getAdminToken(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
}

export function saveAdminToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export async function fetchPendingBusinesses(): Promise<AdminBusinessPartnerSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/business/partners');
  return Array.isArray(data) ? (data as AdminBusinessPartnerSummary[]) : [];
}

export async function fetchPendingBusinessEvents(): Promise<AdminBusinessEventSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/business/events');
  return Array.isArray(data) ? (data as AdminBusinessEventSummary[]) : [];
}

export async function fetchPendingBusinessOffers(): Promise<AdminBusinessOfferSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/business/offers');
  return Array.isArray(data) ? (data as AdminBusinessOfferSummary[]) : [];
}

export async function fetchPendingBusinessChallenges(): Promise<AdminChallengeSummary[]> {
  const data = await fetchJson<unknown>('/api/admin/business/challenges');
  return Array.isArray(data) ? (data as AdminChallengeSummary[]) : [];
}

export async function fetchBusinessAuditLog(): Promise<BusinessAuditLogItem[]> {
  const data = await fetchJson<unknown>('/api/admin/business/audit');
  return Array.isArray(data) ? (data as BusinessAuditLogItem[]) : [];
}

export function approveBusiness(id: string, note?: string) {
  return postJson<void>(`/api/admin/business/partners/${encodeURIComponent(id)}/approve`, { note });
}

export function rejectBusiness(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/partners/${encodeURIComponent(id)}/reject`, { reason, note });
}

export function suspendBusiness(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/partners/${encodeURIComponent(id)}/suspend`, { reason, note });
}

export function approveBusinessEvent(id: string, note?: string) {
  return postJson<void>(`/api/admin/business/events/${encodeURIComponent(id)}/approve`, { note });
}

export function rejectBusinessEvent(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/events/${encodeURIComponent(id)}/reject`, { reason, note });
}

export function approveBusinessOffer(id: string, note?: string) {
  return postJson<void>(`/api/admin/business/offers/${encodeURIComponent(id)}/approve`, { note });
}

export function rejectBusinessOffer(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/offers/${encodeURIComponent(id)}/reject`, { reason, note });
}

export function approveBusinessChallenge(id: string, note?: string) {
  return postJson<void>(`/api/admin/business/challenges/${encodeURIComponent(id)}/approve`, { note });
}

export function rejectBusinessChallenge(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/challenges/${encodeURIComponent(id)}/reject`, { reason, note });
}

export function suspendBusinessChallenge(id: string, reason?: string, note?: string) {
  return postJson<void>(`/api/admin/business/challenges/${encodeURIComponent(id)}/suspend`, { reason, note });
}
