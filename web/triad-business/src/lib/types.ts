export type UUID = string;
export type SessionPhase = "loading" | "signedOut" | "authenticated";

// ── Auth / User ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: UUID;
  username: string;
  email?: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

// ── Business Partner ──────────────────────────────────────────────────────────

export interface BusinessCategory {
  id: UUID;
  key: string;
  displayName: string;
  sortOrder: number;
}

export type BusinessVerificationStatus = "Pending" | "Approved" | "Rejected" | "Suspended";
export type BusinessEventStatus = "Draft" | "PendingApproval" | "Approved" | "Rejected" | "Published" | "Cancelled" | "Archived";
export type BusinessOfferStatus = "Draft" | "PendingApproval" | "Approved" | "Rejected" | "Active" | "Expired" | "Archived";
export type ChallengeStatus = "Draft" | "PendingApproval" | "Approved" | "Rejected" | "Active" | "Suspended" | "Closed" | "Archived";
export type ChallengeResponseStatus = "Submitted" | "Winner" | "NotSelected";
export type OfferType = "Coupon" | "Discount" | "FreeItem" | "Upgrade" | "Other";
export type RewardType = "Coupon" | "FreeEntry" | "Discount" | "Merchandise" | "Other";

export interface BusinessProfileData {
  id: UUID;
  businessName: string;
  category: string;
  description: string;
  website: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  updatedAt: string;
}

export interface BusinessPartner {
  id: UUID;
  userId: UUID;
  username: string;
  email: string;
  status: BusinessVerificationStatus;
  rejectionReason: string | null;
  createdAt: string;
  profile: BusinessProfileData | null;
}

// ── Events ────────────────────────────────────────────────────────────────────

export interface EventImage {
  id: UUID;
  url: string;
  sortOrder: number;
}

export interface BusinessEvent {
  id: UUID;
  businessPartnerId: UUID;
  businessName: string;
  title: string;
  description: string;
  category: string;
  location: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  startDate: string | null;
  endDate: string | null;
  capacity: number | null;
  price: number | null;
  externalTicketUrl: string | null;
  status: BusinessEventStatus;
  rejectionReason: string | null;
  images: EventImage[];
  likeCount: number;
  saveCount: number;
  registrationCount: number;
  isLiked: boolean | null;
  isSaved: boolean | null;
  isRegistered: boolean | null;
  hasChallenge: boolean;
  hasOffer: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Offers ────────────────────────────────────────────────────────────────────

export interface BusinessOffer {
  id: UUID;
  businessEventId: UUID;
  eventTitle: string;
  offerType: OfferType;
  title: string;
  description: string | null;
  couponCode: string | null;
  claimLimit: number | null;
  expiryDate: string | null;
  redemptionInstructions: string | null;
  status: BusinessOfferStatus;
  rejectionReason: string | null;
  claimCount: number;
  isClaimed: boolean | null;
  createdAt: string;
}

// ── Challenge ─────────────────────────────────────────────────────────────────

export interface EventChallenge {
  id: UUID;
  businessEventId: UUID;
  eventTitle: string;
  prompt: string;
  rewardType: RewardType;
  rewardDescription: string | null;
  maxWinners: number | null;
  expiryDate: string | null;
  status: ChallengeStatus;
  rejectionReason: string | null;
  responseCount: number;
  winnerCount: number;
  hasResponded: boolean | null;
  createdAt: string;
}

export interface ChallengeResponseItem {
  id: UUID;
  userId: UUID;
  username: string;
  responseText: string;
  status: ChallengeResponseStatus;
  submittedAt: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface EventAnalyticsItem {
  eventId: UUID;
  eventTitle: string;
  status: BusinessEventStatus;
  likes: number;
  saves: number;
  registrations: number;
  challengeResponses: number;
  winners: number;
  couponClaims: number;
}

export interface BusinessAnalytics {
  totalEvents: number;
  publishedEvents: number;
  totalLikes: number;
  totalSaves: number;
  totalRegistrations: number;
  totalOffers: number;
  totalCouponClaims: number;
  totalChallenges: number;
  totalChallengeResponses: number;
  totalWinners: number;
  eventBreakdown: EventAnalyticsItem[];
}

// ── Request forms ─────────────────────────────────────────────────────────────

export interface UpsertProfileForm {
  businessName: string;
  category: string;
  description?: string;
  website?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface CreateEventForm {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  city?: string;
  state?: string;
  startDate?: string;
  endDate?: string;
  capacity?: number;
  price?: number;
  externalTicketUrl?: string;
}

export interface CreateOfferForm {
  offerType: OfferType;
  title: string;
  description?: string;
  couponCode?: string;
  claimLimit?: number;
  expiryDate?: string;
  redemptionInstructions?: string;
}

export interface CreateChallengeForm {
  prompt: string;
  rewardType: RewardType;
  rewardDescription?: string;
  maxWinners?: number;
  expiryDate?: string;
}
