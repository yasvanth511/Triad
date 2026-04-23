import type { UserSummary } from './types';

const GEOGRAPHY_RANK_LIMIT = 8;

function normalize(value: unknown): string {
  return String(value ?? '').trim();
}

function buildRankedRows(
  users: UserSummary[],
  getLabel: (u: UserSummary) => string,
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const user of users) {
    const label = normalize(getLabel(user));
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, GEOGRAPHY_RANK_LIMIT);
}

export interface GeographyAnalytics {
  totalUsers: number;
  stateCoverageCount: number;
  cityCoverageCount: number;
  stateCoverageRatio: number;
  cityCoverageRatio: number;
  countryRows: { label: string; count: number }[];
  stateRows: { label: string; count: number }[];
  cityRows: { label: string; count: number }[];
}

export function buildGeographyAnalytics(users: UserSummary[]): GeographyAnalytics {
  const totalUsers = users.length;

  const stateRows = buildRankedRows(users, (u) => normalize(u.state));
  const cityRows = buildRankedRows(users, (u) => {
    const city = normalize(u.city);
    if (!city) return '';
    const state = normalize(u.state);
    return state ? `${city}, ${state}` : city;
  });
  const countryRows = buildRankedRows(users, (u) => normalize(u.country));

  const stateCoverageCount = users.filter((u) => normalize(u.state)).length;
  const cityCoverageCount = users.filter((u) => normalize(u.city)).length;

  return {
    totalUsers,
    stateCoverageCount,
    cityCoverageCount,
    stateCoverageRatio: totalUsers > 0 ? stateCoverageCount / totalUsers : 0,
    cityCoverageRatio: totalUsers > 0 ? cityCoverageCount / totalUsers : 0,
    countryRows,
    stateRows,
    cityRows,
  };
}
