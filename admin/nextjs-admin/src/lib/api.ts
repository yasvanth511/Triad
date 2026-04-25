import type {
  AdminBusinessEventSummary,
  AdminBusinessOfferSummary,
  AdminBusinessPartnerSummary,
  AdminChallengeSummary,
  BusinessAuditLogItem,
  ModerationAnalytics,
  UserDetail,
  UserListResponse,
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

export async function fetchUsers(skip = 0, take = 50): Promise<UserListResponse> {
  const data = await fetchJson<unknown>(`/api/admin/users?skip=${skip}&take=${take}`);
  if (Array.isArray(data)) {
    const items = data as UserSummary[];
    return { items, total: items.length, totalSingles: 0, totalCouples: 0, skip, take };
  }
  const e = data as Partial<UserListResponse>;
  return {
    items: Array.isArray(e.items) ? (e.items as UserSummary[]) : [],
    total: e.total ?? 0,
    totalSingles: e.totalSingles ?? 0,
    totalCouples: e.totalCouples ?? 0,
    skip: e.skip ?? skip,
    take: e.take ?? take,
  };
}

export async function fetchAllUsers(): Promise<UserSummary[]> {
  const PAGE_SIZE = 200;
  const first = await fetchUsers(0, PAGE_SIZE);
  const all: UserSummary[] = [...first.items];
  let skip = PAGE_SIZE;
  while (skip < first.total) {
    const page = await fetchUsers(skip, PAGE_SIZE);
    all.push(...page.items);
    skip += PAGE_SIZE;
  }
  return all;
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login failed (${res.status})`);
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error('No token in response');
  return body.token;
}

export async function adminLogin(username: string, password: string): Promise<string> {
  const res = await fetch('/api/admin/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid username or password.');
  const body = (await res.json()) as { token?: string };
  if (!body.token) throw new Error('No token in response');
  return body.token;
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
