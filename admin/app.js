const {
  ADMIN_ENDPOINTS,
  fetchAdminUsers,
  fetchAdminOnlineUsers,
  fetchAdminUserDetail,
  fetchAdminModerationAnalytics,
  formatAdminPercentage,
  formatAdminTimestamp,
  normalizeAdminGeographyValue,
} = window.AdminData;
const GEOGRAPHY_RANK_LIMIT = 8;

const userColumns = [
  { key: "id", label: "User ID", className: "cell-code" },
  { key: "displayName", label: "Display Name" },
  { key: "accountStatus", label: "Account Status", render: (user) => renderPill(user.accountStatus, "account") },
  { key: "profileType", label: "Profile Type", render: (user) => renderPill(user.profileType, "profile") },
  { key: "verificationSummary", label: "Verification" },
  { key: "blockCount", label: "Blocks" },
  { key: "reportCount", label: "Reports" },
  { key: "onlineStatus", label: "Online", render: (user) => renderPill(user.onlineStatus, "online") },
  { key: "geographySummary", label: "Geography" },
];

const onlineUserColumns = [
  { key: "id", label: "User ID", className: "cell-code" },
  { key: "displayName", label: "Display Name" },
  { key: "accountStatus", label: "Account Status", render: (user) => renderPill(user.accountStatus, "account") },
  { key: "profileType", label: "Profile Type", render: (user) => renderPill(user.profileType, "profile") },
  { key: "verificationSummary", label: "Verification" },
  { key: "onlineStatus", label: "Online", render: (user) => renderPill(user.onlineStatus, "online") },
  { key: "geographySummary", label: "Geography" },
];

const pages = {
  users: {
    title: "Users",
    render: renderUsersPage,
  },
  "online-users": {
    title: "Online Users",
    render: renderOnlineUsersPage,
  },
  "geography-analytics": {
    title: "Geography Analytics",
    render: renderGeographyAnalyticsPage,
  },
  "moderation-analytics": {
    title: "Moderation Analytics",
    render: renderModerationAnalyticsPage,
  },
};

const title = document.getElementById("page-title");
const content = document.getElementById("page-content");
const navItems = document.querySelectorAll(".nav-item");
let activePageKey = "users";
let usersRequestId = 0;
let onlineUsersRequestId = 0;
let geographyRequestId = 0;
let userDetailRequestId = 0;
let usersState = [];
let selectedUserId = null;
let selectedUserDetail = null;
let selectedUserDetailError = null;
let isUserDetailLoading = false;

function renderPage(pageKey) {
  activePageKey = pageKey;
  const page = pages[pageKey] || pages.users;
  title.textContent = page.title;

  if (pageKey !== "users") {
    selectedUserId = null;
    selectedUserDetail = null;
    selectedUserDetailError = null;
    isUserDetailLoading = false;
  }

  navItems.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.page === pageKey);
  });

  if (page.render) {
    page.render();
    return;
  }

  content.innerHTML = page.content;
}

async function renderUsersPage() {
  const requestId = ++usersRequestId;
  usersState = [];

  renderUsersLayout(null, renderStateCard("Loading users", "Fetching the latest admin user summary."));

  try {
    const users = await fetchAdminUsers();
    if (requestId !== usersRequestId || activePageKey !== "users") {
      return;
    }

    usersState = users;

    if (users.length === 0) {
      renderUsersLayout([], renderStateCard("No users yet", "The admin API returned an empty user list."));
      return;
    }

    renderUsersLayout(users, renderUsersContent(users));
  } catch (error) {
    if (requestId !== usersRequestId || activePageKey !== "users") {
      return;
    }

    usersState = [];
    renderUsersLayout(
      [],
      renderStateCard("Unable to load users", error.message || "The admin API request failed."),
    );
  }
}

async function renderOnlineUsersPage() {
  const requestId = ++onlineUsersRequestId;
  renderOnlineUsersLayout(renderStateCard("Loading online users", "Fetching users with active realtime presence."));

  try {
    const users = await fetchAdminOnlineUsers();
    if (requestId !== onlineUsersRequestId || activePageKey !== "online-users") {
      return;
    }

    if (users.length === 0) {
      renderOnlineUsersLayout(renderStateCard("No users online", "No active users are connected right now."));
      return;
    }

    renderOnlineUsersLayout(renderOnlineUsersTable(users));
  } catch (error) {
    if (requestId !== onlineUsersRequestId || activePageKey !== "online-users") {
      return;
    }

    renderOnlineUsersLayout(
      renderStateCard("Unable to load online users", error.message || "The admin API request failed."),
    );
  }
}

async function renderGeographyAnalyticsPage() {
  const requestId = ++geographyRequestId;
  content.innerHTML = `
    <section class="page-grid">
      ${renderStateCard("Loading geography analytics", "Aggregating coarse geography from the admin user summary.")}
    </section>
  `;

  try {
    const users = await fetchAdminUsers();
    if (requestId !== geographyRequestId || activePageKey !== "geography-analytics") {
      return;
    }

    if (users.length === 0) {
      content.innerHTML = `
        <section class="page-grid">
          ${renderStateCard("No geography data yet", "The admin API returned an empty user list.")}
        </section>
      `;
      return;
    }

    const analytics = buildGeographyAnalytics(users);
    content.innerHTML = renderGeographyAnalyticsLayout(analytics);
  } catch (error) {
    if (requestId !== geographyRequestId || activePageKey !== "geography-analytics") {
      return;
    }

    content.innerHTML = `
      <section class="page-grid">
        ${renderStateCard("Unable to load geography analytics", error.message || "The admin API request failed.")}
      </section>
    `;
  }
}

async function renderModerationAnalyticsPage() {
  content.innerHTML = `
    <section class="page-grid">
      ${renderStateCard("Loading moderation analytics", "Aggregating admin-safe moderation totals.")}
    </section>
  `;

  try {
    const analytics = await fetchAdminModerationAnalytics();
    if (activePageKey !== "moderation-analytics") {
      return;
    }

    content.innerHTML = renderModerationAnalyticsLayout(analytics);
  } catch (error) {
    if (activePageKey !== "moderation-analytics") {
      return;
    }

    content.innerHTML = `
      <section class="page-grid">
        ${renderStateCard("Unable to load moderation analytics", error.message || "The admin API request failed.")}
      </section>
    `;
  }
}

function renderUsersLayout(users, body) {
  const stats = getUserStats(users);

  content.innerHTML = `
    <section class="page-grid">
      <div class="metric-row">
        ${renderMetricCard("Total Users", stats.total, "All users returned by the admin API.")}
        ${renderMetricCard("Singles", stats.singles, "Profiles not linked to a couple.")}
        ${renderMetricCard("Couples", stats.couples, "Users currently linked to a couple profile.")}
      </div>
      ${body}
    </section>
  `;
}

function renderOnlineUsersLayout(body) {
  content.innerHTML = `
    <section class="page-grid">
      ${body}
    </section>
  `;
}

function renderUsersContent(users) {
  return `
    <div class="users-layout ${selectedUserId ? "has-detail" : ""}">
      ${renderUsersTable(users)}
      ${selectedUserId ? renderUserDetailDrawer() : ""}
    </div>
  `;
}

function renderUsersTable(users) {
  const head = `${userColumns.map((column) => `<th scope="col">${column.label}</th>`).join("")}<th scope="col">Details</th>`;
  const rows = users
    .map(
      (user) => `
        <tr>
          ${userColumns
            .map((column) => {
              const value = column.render
                ? column.render(user)
                : escapeHtml(String(getValueOrDefault(user[column.key], "Unavailable")));
              return `<td class="${column.className || ""}">${value}</td>`;
            })
            .join("")}
          <td>
            <button
              type="button"
              class="button-link"
              data-user-detail-trigger="true"
              data-user-id="${escapeHtml(String(user.id))}"
            >
              View
            </button>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <article class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderOnlineUsersTable(users) {
  const head = onlineUserColumns.map((column) => `<th scope="col">${column.label}</th>`).join("");
  const rows = users
    .map(
      (user) => `
        <tr>
          ${onlineUserColumns
            .map((column) => {
              const value = column.render
                ? column.render(user)
                : escapeHtml(String(getValueOrDefault(user[column.key], "Unavailable")));
              return `<td class="${column.className || ""}">${value}</td>`;
            })
            .join("")}
        </tr>
      `,
    )
    .join("");

  return `
    <article class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>${head}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderUserDetailDrawer() {
  const selectedUser = usersState.find((user) => user.id === selectedUserId);
  const heading = selectedUser && selectedUser.displayName ? selectedUser.displayName : "User details";
  let body = renderStateCard("Loading detail", "Fetching the admin-safe user summary.");

  if (selectedUserDetailError) {
    body = renderStateCard("Unable to load detail", selectedUserDetailError);
  } else if (!isUserDetailLoading && selectedUserDetail) {
    body = renderUserDetailSections(selectedUserDetail);
  }

  return `
    <aside class="panel detail-drawer">
      <div class="detail-header">
        <div>
          <p class="eyebrow">User Detail</p>
          <h3>${escapeHtml(heading)}</h3>
        </div>
        <button type="button" class="icon-button" data-close-user-detail="true" aria-label="Close user detail">
          Close
        </button>
      </div>
      ${body}
    </aside>
  `;
}

function renderUserDetailSections(user) {
  return `
    <div class="detail-sections">
      ${renderDetailSection("Account", [
        renderDetailRow("User ID", escapeHtml(String(user.id || "Unavailable")), "cell-code"),
        renderDetailRow("Display Name", escapeHtml(user.displayName || "Unavailable")),
        renderDetailRow("Account Status", renderPill(user.accountStatus, "account")),
        renderDetailRow("Profile Type", renderPill(user.profileType, "profile")),
        renderDetailRow("Online", renderPill(user.onlineStatus || "Unknown", "online")),
      ])}
      ${renderVerificationSummaryModule(user.verificationSummary)}
      ${renderModerationSummaryModule(user)}
      ${renderDetailSection("Context", [
        renderDetailRow("Geography", escapeHtml(user.geographySummary || "Unavailable")),
        renderDetailRow("Created", formatTimestamp(user.createdAt)),
        user.lastActiveAt ? renderDetailRow("Last Active", formatTimestamp(user.lastActiveAt)) : "",
      ])}
    </div>
  `;
}

function renderVerificationSummaryModule(items) {
  const content = !Array.isArray(items) || items.length === 0
    ? '<p class="detail-muted verification-empty">No verification methods.</p>'
    : `
      <div class="verification-summary-list">
        ${items.map(renderVerificationSummaryItem).join("")}
      </div>
    `;

  return `
    <section class="panel panel-muted detail-section">
      <h3>Verification Summary</h3>
      ${content}
    </section>
  `;
}

function renderVerificationSummaryItem(item) {
  return `
    <article class="verification-summary-item">
      <div class="verification-summary-top">
        <strong>${escapeHtml(String(item.method || "Unknown"))}</strong>
        ${renderPill(item.status || "Unknown", "verification")}
      </div>
      <dl class="verification-summary-meta">
        ${typeof item.isEnabled === "boolean"
          ? `
            <div>
              <dt>Availability</dt>
              <dd>${renderPill(item.isEnabled ? "Enabled" : "Disabled", "availability")}</dd>
            </div>
          `
          : ""}
        ${item.verifiedAt
          ? `
            <div>
              <dt>Verified</dt>
              <dd>${formatTimestamp(item.verifiedAt)}</dd>
            </div>
          `
          : ""}
        ${item.expiresAt
          ? `
            <div>
              <dt>Expires</dt>
              <dd>${formatTimestamp(item.expiresAt)}</dd>
            </div>
          `
          : ""}
      </dl>
    </article>
  `;
}

function renderModerationSummaryModule(user) {
  return renderDetailSection("Moderation Summary", [
    renderDetailRow("Report Count", escapeHtml(String(getValueOrDefault(user.reportCount, 0)))),
    renderDetailRow("Report Reasons", renderCountList(user.reportReasons, "reason")),
    renderDetailRow("Block Count", escapeHtml(String(getValueOrDefault(user.blockCount, 0)))),
    renderModerationStatusRow(user),
  ]);
}

function renderModerationStatusRow(user) {
  const status = getModerationStatus(user);
  return status ? renderDetailRow("Current Status", renderPill(status, "moderation")) : "";
}

function getModerationStatus(user) {
  if (user && typeof user.moderationStatus === "string" && user.moderationStatus.trim()) {
    return user.moderationStatus.trim();
  }

  if (user && (user.isUnderReview === true || user.underReview === true)) {
    return "Under Review";
  }

  if (user && (user.isFlagged === true || user.flagged === true)) {
    return "Flagged";
  }

  return "";
}

function renderDetailSection(titleText, rows) {
  return `
    <section class="panel panel-muted detail-section">
      <h3>${escapeHtml(titleText)}</h3>
      <div class="detail-list">${rows.filter(Boolean).join("")}</div>
    </section>
  `;
}

function renderDetailRow(label, value, valueClassName = "") {
  return `
    <div class="detail-row">
      <dt>${escapeHtml(label)}</dt>
      <dd class="${valueClassName}">${value}</dd>
    </div>
  `;
}

function renderSummaryList(items, keyField, valueField) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<span class="detail-muted">None</span>';
  }

  return `
    <ul class="detail-summary-list">
      ${items
        .map(
          (item) => `
            <li>
              <span>${escapeHtml(String(item[keyField] || "Unknown"))}</span>
              <strong>${escapeHtml(String(item[valueField] || "Unavailable"))}</strong>
            </li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderCountList(items, labelField) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<span class="detail-muted">None</span>';
  }

  return `
    <ul class="detail-chip-list">
      ${items
        .map(
          (item) => `
            <li>${escapeHtml(String(item[labelField] || "Unknown"))} (${escapeHtml(String(getValueOrDefault(item.count, 0)))})</li>
          `,
        )
        .join("")}
    </ul>
  `;
}

function renderMetricCard(label, value, text) {
  return `
    <article class="panel">
      <h3>${label}</h3>
      <p class="metric-value">${value}</p>
      <p class="metric-label">${text}</p>
    </article>
  `;
}

function renderGeographyAnalyticsLayout(analytics) {
  return `
    <section class="page-grid">
      <div class="metric-row">
        ${renderMetricCard("Total Users", analytics.totalUsers, "Users included in the coarse geography rollup.")}
        ${renderMetricCard("State Coverage", formatPercentage(analytics.stateCoverageRatio), `${analytics.stateCoverageCount} users include a state or region.`)}
        ${renderMetricCard("City Coverage", formatPercentage(analytics.cityCoverageRatio), `${analytics.cityCoverageCount} users include a city.`)}
      </div>
      <div class="analytics-grid">
        ${renderGeographyPanel("Users by Country", analytics.countryRows, analytics.totalUsers, "Country data is not available in the current admin user summary.")}
        ${renderGeographyPanel("Users by State/Region", analytics.stateRows, analytics.totalUsers, "No state or region data is available.")}
        ${renderGeographyPanel("Users by City", analytics.cityRows, analytics.totalUsers, "No city data is available.")}
      </div>
    </section>
  `;
}

function renderModerationAnalyticsLayout(analytics) {
  const totalReports = Number(analytics.totalReports || 0);
  const totalRelationships = Number(analytics.totalBlockRelationships || 0);
  const totalVerificationStatuses = Array.isArray(analytics.verificationStatusDistribution)
    ? analytics.verificationStatusDistribution.reduce((sum, row) => sum + Number(row.count || 0), 0)
    : 0;

  return `
    <section class="page-grid">
      <div class="metric-row metric-row-compact">
        ${renderMetricCard("Reported Users", Number(analytics.totalReportedUsers || 0), "Distinct users who have been reported.")}
        ${renderMetricCard("Total Reports", totalReports, "All report records across the platform.")}
        ${renderMetricCard("Blocked Users", Number(analytics.totalBlockedUsers || 0), "Distinct users who were blocked by someone.")}
        ${renderMetricCard("Block Relationships", totalRelationships, "Total blocker to blocked relationships.")}
        ${renderMetricCard("Verification Records", totalVerificationStatuses, "Non-disabled verification status records, if available.")}
      </div>
      <div class="analytics-grid analytics-grid-compact">
        ${renderModerationReasonPanel(analytics.topReportReasons, totalReports)}
        ${renderVerificationDistributionPanel(analytics.verificationStatusDistribution, totalVerificationStatuses)}
      </div>
    </section>
  `;
}

function renderModerationReasonPanel(rows, totalReports) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return renderStateCard("Top Report Reasons", "No report reason data is available yet.");
  }

  const max = rows[0] && rows[0].count ? rows[0].count : 1;
  return `
    <article class="panel">
      <h3>Top Report Reasons</h3>
      <div class="rank-list">
        ${rows
          .map((row) => {
            const count = Number(row.count || 0);
            const share = totalReports > 0 ? count / totalReports : 0;
            return `
              <div class="rank-row">
                <div class="rank-row-top">
                  <strong>${escapeHtml(String(row.reason || "Unknown"))}</strong>
                  <span>${escapeHtml(String(count))} · ${escapeHtml(formatPercentage(share))}</span>
                </div>
                <div class="rank-bar" aria-hidden="true">
                  <span style="width: ${Math.max((count / max) * 100, 6)}%"></span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderVerificationDistributionPanel(rows, total) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return renderStateCard("Verification Status Distribution", "Verification data is not available.");
  }

  const body = rows
    .map((row) => {
      const count = Number(row.count || 0);
      return `
        <tr>
          <td>${renderPill(String(row.status || "Unknown"), "verification")}</td>
          <td>${escapeHtml(String(count))}</td>
          <td>${escapeHtml(formatPercentage(total > 0 ? count / total : 0))}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <article class="panel">
      <h3>Verification Status Distribution</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th scope="col">Status</th>
              <th scope="col">Count</th>
              <th scope="col">Share</th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </article>
  `;
}

function renderGeographyPanel(titleText, rows, total, emptyMessage) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return renderStateCard(titleText, emptyMessage);
  }

  const max = rows[0] && rows[0].count ? rows[0].count : 1;
  return `
    <article class="panel">
      <h3>${escapeHtml(titleText)}</h3>
      <div class="rank-list">
        ${rows
          .map((row) => {
            const percentage = total > 0 ? row.count / total : 0;
            return `
              <div class="rank-row">
                <div class="rank-row-top">
                  <strong>${escapeHtml(row.label)}</strong>
                  <span>${escapeHtml(String(row.count))} · ${escapeHtml(formatPercentage(percentage))}</span>
                </div>
                <div class="rank-bar" aria-hidden="true">
                  <span style="width: ${Math.max((row.count / max) * 100, 6)}%"></span>
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </article>
  `;
}

function renderStateCard(titleText, bodyText) {
  return `
    <article class="panel panel-muted state-card">
      <h3>${escapeHtml(titleText)}</h3>
      <p>${escapeHtml(bodyText)}</p>
    </article>
  `;
}

function buildGeographyAnalytics(users) {
  const totalUsers = users.length;
  const stateRows = buildRankedRows(users, (user) => normalizeGeographyValue(user.state));
  const cityRows = buildRankedRows(users, (user) => {
    const city = normalizeGeographyValue(user.city);
    const state = normalizeGeographyValue(user.state);
    if (!city) {
      return "";
    }

    return state ? `${city}, ${state}` : city;
  });
  const countryRows = buildRankedRows(users, (user) => normalizeGeographyValue(user.country));

  const stateCoverageCount = users.filter((user) => normalizeGeographyValue(user.state)).length;
  const cityCoverageCount = users.filter((user) => normalizeGeographyValue(user.city)).length;

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

function buildRankedRows(items, getLabel) {
  const counts = new Map();

  items.forEach((item) => {
    const label = normalizeGeographyValue(getLabel(item));
    if (!label) {
      return;
    }

    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, GEOGRAPHY_RANK_LIMIT);
}

function renderPill(value, type) {
  return `<span class="status-pill ${getPillClass(value, type)}">${escapeHtml(value)}</span>`;
}

function getPillClass(value, type) {
  const normalized = String(value).toLowerCase();

  if (type === "account") {
    return normalized === "banned" ? "pill-danger" : "pill-success";
  }

  if (type === "online") {
    return normalized === "online" ? "pill-success" : "pill-neutral";
  }

  if (type === "verification") {
    if (normalized === "verified") {
      return "pill-success";
    }

    if (normalized === "failed" || normalized === "expired") {
      return "pill-danger";
    }

    return "pill-neutral";
  }

  if (type === "availability") {
    return normalized === "enabled" ? "pill-success" : "pill-neutral";
  }

  if (type === "moderation") {
    if (normalized === "flagged") {
      return "pill-danger";
    }

    if (normalized === "under review") {
      return "pill-neutral";
    }
  }

  return "pill-neutral";
}

function formatTimestamp(value) {
  const formatted = formatAdminTimestamp(value);
  return formatted.includes("detail-muted") ? formatted : escapeHtml(formatted);
}

function formatPercentage(value) {
  return formatAdminPercentage(value);
}

function normalizeGeographyValue(value) {
  return normalizeAdminGeographyValue(value);
}

async function openUserDetail(userId) {
  if (!userId) {
    return;
  }

  const requestId = ++userDetailRequestId;
  selectedUserId = userId;
  selectedUserDetail = null;
  selectedUserDetailError = null;
  isUserDetailLoading = true;

  if (activePageKey === "users" && usersState.length > 0) {
    renderUsersLayout(usersState, renderUsersContent(usersState));
  }

  try {
    const detail = await fetchAdminUserDetail(userId);
    if (requestId !== userDetailRequestId || activePageKey !== "users" || selectedUserId !== userId) {
      return;
    }

    selectedUserDetail = detail;
  } catch (error) {
    if (requestId !== userDetailRequestId || activePageKey !== "users" || selectedUserId !== userId) {
      return;
    }

    selectedUserDetailError = error.message || "The admin API request failed.";
  } finally {
    if (requestId === userDetailRequestId && activePageKey === "users" && selectedUserId === userId) {
      isUserDetailLoading = false;
      renderUsersLayout(usersState, renderUsersContent(usersState));
    }
  }
}

function closeUserDetail() {
  selectedUserId = null;
  selectedUserDetail = null;
  selectedUserDetailError = null;
  isUserDetailLoading = false;

  if (activePageKey === "users" && usersState.length > 0) {
    renderUsersLayout(usersState, renderUsersContent(usersState));
  }
}

function getUserStats(users) {
  if (!Array.isArray(users) || users.length === 0) {
    return { total: 0, singles: 0, couples: 0 };
  }

  const couples = users.filter((user) => user.profileType === "couple").length;
  return {
    total: users.length,
    singles: users.length - couples,
    couples,
  };
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getValueOrDefault(value, fallback) {
  return value === null || value === undefined ? fallback : value;
}

navItems.forEach((item) => {
  item.addEventListener("click", () => renderPage(item.dataset.page));
});

content.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-user-detail-trigger]");
  if (trigger) {
    openUserDetail(trigger.dataset.userId);
    return;
  }

  const closeButton = event.target.closest("[data-close-user-detail]");
  if (closeButton) {
    closeUserDetail();
  }
});

renderPage("users");
