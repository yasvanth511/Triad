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

export interface AdminBusinessPartnerSummary {
  id: string;
  userId: string;
  username: string;
  email: string;
  status: string;
  businessName?: string | null;
  category?: string | null;
  createdAt: string;
}

export interface AdminBusinessEventSummary {
  id: string;
  businessPartnerId: string;
  businessName: string;
  title: string;
  category: string;
  status: string;
  startDate?: string | null;
  createdAt: string;
}

export interface AdminBusinessOfferSummary {
  id: string;
  businessEventId: string;
  eventTitle: string;
  businessName: string;
  offerType: string;
  title: string;
  status: string;
  createdAt: string;
}

export interface AdminChallengeSummary {
  id: string;
  businessEventId: string;
  eventTitle: string;
  businessName: string;
  prompt: string;
  status: string;
  createdAt: string;
}

export interface BusinessAuditLogItem {
  id: string;
  action: string;
  adminUserId?: string | null;
  targetPartnerId?: string | null;
  targetEventId?: string | null;
  targetOfferId?: string | null;
  targetChallengeId?: string | null;
  reason?: string | null;
  note?: string | null;
  createdAt: string;
}
