const ADMIN_API_BASE_URL = window.ADMIN_API_BASE_URL || "";

const ADMIN_ENDPOINTS = Object.freeze({
  users: `${ADMIN_API_BASE_URL}/api/admin/users`,
  onlineUsers: `${ADMIN_API_BASE_URL}/api/admin/online-users`,
  moderationAnalytics: `${ADMIN_API_BASE_URL}/api/admin/moderation-analytics`,
});

/**
 * Admin-safe verification summary only. Do not add raw user artifacts here.
 * @typedef {Object} AdminSafeVerificationSummaryItem
 * @property {string=} method
 * @property {string=} status
 * @property {boolean=} isEnabled
 * @property {string=} verifiedAt
 * @property {string=} expiresAt
 */

/**
 * Admin-safe user summary only. Keep direct identifiers/contact fields out.
 * @typedef {Object} AdminSafeUserSummary
 * @property {string|number=} id
 * @property {string=} displayName
 * @property {string=} accountStatus
 * @property {string=} profileType
 * @property {string=} verificationSummary
 * @property {number=} blockCount
 * @property {number=} reportCount
 * @property {string=} onlineStatus
 * @property {string=} geographySummary
 * @property {string=} country
 * @property {string=} state
 * @property {string=} city
 */

/**
 * Admin-safe user detail only. Keep private profile/body content out.
 * @typedef {AdminSafeUserSummary & {
 *   verificationSummary?: AdminSafeVerificationSummaryItem[],
 *   reportReasons?: { reason?: string, count?: number }[],
 *   moderationStatus?: string,
 *   isUnderReview?: boolean,
 *   underReview?: boolean,
 *   isFlagged?: boolean,
 *   flagged?: boolean,
 *   createdAt?: string,
 *   lastActiveAt?: string
 * }} AdminSafeUserDetail
 */

/**
 * Aggregated admin-safe moderation analytics only.
 * @typedef {Object} AdminSafeModerationAnalytics
 * @property {number=} totalReportedUsers
 * @property {number=} totalReports
 * @property {number=} totalBlockedUsers
 * @property {number=} totalBlockRelationships
 * @property {{ reason?: string, count?: number }[]=} topReportReasons
 * @property {{ status?: string, count?: number }[]=} verificationStatusDistribution
 */

async function fetchAdminJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

/** @returns {Promise<AdminSafeUserSummary[]>} */
async function fetchAdminUsers() {
  const result = await fetchAdminJson(ADMIN_ENDPOINTS.users);
  return toAdminSafeList(Array.isArray(result) ? result : result.items);
}

/** @returns {Promise<AdminSafeUserSummary[]>} */
async function fetchAdminOnlineUsers() {
  return toAdminSafeList(await fetchAdminJson(ADMIN_ENDPOINTS.onlineUsers));
}

/** @returns {Promise<AdminSafeUserDetail>} */
async function fetchAdminUserDetail(userId) {
  return toAdminSafeObject(await fetchAdminJson(`${ADMIN_ENDPOINTS.users}/${encodeURIComponent(userId)}`));
}

/** @returns {Promise<AdminSafeModerationAnalytics>} */
async function fetchAdminModerationAnalytics() {
  return toAdminSafeObject(await fetchAdminJson(ADMIN_ENDPOINTS.moderationAnalytics));
}

function toAdminSafeList(value) {
  return Array.isArray(value) ? value : [];
}

function toAdminSafeObject(value) {
  return value && typeof value === "object" ? value : {};
}

function formatAdminTimestamp(value) {
  if (!value) {
    return '<span class="detail-muted">Unavailable</span>';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '<span class="detail-muted">Unavailable</span>';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatAdminPercentage(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function normalizeAdminGeographyValue(value) {
  const normalized = String(value || "").trim();
  return normalized.length > 0 ? normalized : "";
}

window.AdminData = {
  ADMIN_ENDPOINTS,
  fetchAdminUsers,
  fetchAdminOnlineUsers,
  fetchAdminUserDetail,
  fetchAdminModerationAnalytics,
  formatAdminPercentage,
  formatAdminTimestamp,
  normalizeAdminGeographyValue,
  toAdminSafeList,
  toAdminSafeObject,
};
