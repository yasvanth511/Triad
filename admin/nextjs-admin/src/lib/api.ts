import type { ModerationAnalytics, UserDetail, UserSummary } from './types';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
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
