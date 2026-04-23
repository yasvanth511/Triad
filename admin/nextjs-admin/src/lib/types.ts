export interface VerificationSummaryItem {
  method?: string;
  status?: string;
  isEnabled?: boolean;
  verifiedAt?: string;
  expiresAt?: string;
}

export interface ReportReason {
  reason?: string;
  count?: number;
}

export interface UserSummary {
  id?: string | number;
  displayName?: string;
  accountStatus?: string;
  profileType?: string;
  verificationSummary?: string;
  blockCount?: number;
  reportCount?: number;
  onlineStatus?: string;
  geographySummary?: string;
  country?: string;
  state?: string;
  city?: string;
}

export interface UserDetail {
  id?: string | number;
  displayName?: string;
  accountStatus?: string;
  profileType?: string;
  verificationSummary?: VerificationSummaryItem[];
  blockCount?: number;
  reportCount?: number;
  onlineStatus?: string;
  geographySummary?: string;
  country?: string;
  state?: string;
  city?: string;
  reportReasons?: ReportReason[];
  moderationStatus?: string;
  isUnderReview?: boolean;
  underReview?: boolean;
  isFlagged?: boolean;
  flagged?: boolean;
  createdAt?: string;
  lastActiveAt?: string;
}

export interface ModerationAnalytics {
  totalReportedUsers?: number;
  totalReports?: number;
  totalBlockedUsers?: number;
  totalBlockRelationships?: number;
  topReportReasons?: ReportReason[];
  verificationStatusDistribution?: { status?: string; count?: number }[];
}
