export type UUID = string;

export type SessionPhase = "loading" | "signedOut" | "authenticated";

export type Audience = "all" | "single" | "couple";

export interface Photo {
  id: UUID;
  url: string;
  sortOrder: number;
}

export interface ProfileVideo {
  id: UUID;
  url: string;
  sortOrder: number;
}

export interface UserProfile {
  id: UUID;
  username: string;
  bio: string;
  ageMin: number;
  ageMax: number;
  intent: string;
  lookingFor: string;
  interests: string[];
  photos: Photo[];
  coupleId: UUID | null;
  isCouple: boolean;
  city: string;
  state: string;
  zipCode: string;
  radiusMiles: number | null;
  couplePartnerName: string | null;
  audioBioUrl: string | null;
  videoBioUrl: string | null;
  videos: ProfileVideo[];
  redFlags: string[] | null;
  interestedIn: string | null;
  neighborhood: string | null;
  ethnicity: string | null;
  religion: string | null;
  relationshipType: string | null;
  height: string | null;
  children: string | null;
  familyPlans: string | null;
  drugs: string | null;
  smoking: string | null;
  marijuana: string | null;
  drinking: string | null;
  politics: string | null;
  educationLevel: string | null;
  weight: string | null;
  physique: string | null;
  sexualPreference: string | null;
  comfortWithIntimacy: string | null;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface DiscoveryCard {
  userId: UUID;
  username: string;
  bio: string;
  ageMin: number;
  ageMax: number;
  intent: string;
  lookingFor: string;
  interests: string[];
  photos: Photo[];
  isCouple: boolean;
  approximateDistanceKm: number | null;
  city: string;
  state: string;
}

export interface SavedProfileItem extends DiscoveryCard {
  savedAt: string;
}

export interface ParticipantInfo {
  userId: UUID;
  username: string;
  bio: string;
  photos: Photo[];
  isCouple: boolean;
  coupleId: UUID | null;
}

export interface MatchItem {
  matchId: UUID;
  participants: ParticipantInfo[];
  matchedAt: string;
  isGroupChat: boolean;
}

export interface MessageItem {
  id: UUID;
  senderId: UUID;
  senderUsername: string;
  senderPhotoUrl: string | null;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface EventItem {
  id: UUID;
  title: string;
  description: string;
  bannerUrl: string;
  eventDate: string;
  city: string;
  state: string;
  venue: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  interestedCount: number;
  isInterested: boolean;
}

export interface EventInterestToggleResponse {
  isInterested: boolean;
  interestedCount: number;
}

export interface LikeResult {
  matched: boolean;
  match: MatchItem | null;
}

export type ImpressMeStatus =
  | "Sent"
  | "Responded"
  | "Viewed"
  | "Accepted"
  | "Declined"
  | "Expired";

export type ImpressMeFlow = "PreMatch" | "PostMatch";

export interface ImpressMePromptModel {
  id: UUID;
  category: string;
  promptText: string;
  senderContext: string | null;
}

export interface ImpressMeResponseModel {
  id: UUID;
  textContent: string;
  mediaUrl: string | null;
  mediaType: string | null;
  createdAt: string;
}

export interface ImpressMeSignal {
  id: UUID;
  senderId: UUID;
  senderUsername: string;
  senderPhotoUrl: string | null;
  receiverId: UUID;
  receiverUsername: string;
  receiverPhotoUrl: string | null;
  matchId: UUID | null;
  flow: ImpressMeFlow;
  status: ImpressMeStatus;
  prompt: ImpressMePromptModel;
  response: ImpressMeResponseModel | null;
  createdAt: string;
  expiresAt: string;
  respondedAt: string | null;
  viewedAt: string | null;
  resolvedAt: string | null;
}

export interface ImpressMeInbox {
  received: ImpressMeSignal[];
  sent: ImpressMeSignal[];
  unreadCount: number;
}

export interface ImpressMeSummary {
  receivedUnreadCount: number;
  sentNeedsReviewCount: number;
}

export type NotificationType =
  | "LikeReceived"
  | "MatchCreated"
  | "MessageReceived"
  | "ImpressMeReceived"
  | "unknown";

export interface AppNotification {
  id: UUID;
  type: NotificationType;
  title: string;
  body: string;
  referenceId: UUID | null;
  actorId: UUID | null;
  actorName: string | null;
  actorPhotoUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export interface VerificationMethod {
  key: string;
  displayName: string;
  status: string;
  isEnabled: boolean;
  isEligible: boolean;
  ineligibilityReason: string | null;
  version: string;
  capabilities: string[];
  failureReason: string | null;
  verifiedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

export interface VerificationListResponse {
  methods: VerificationMethod[];
}

export interface UpdateProfileRequest {
  bio?: string;
  ageMin?: number;
  ageMax?: number;
  intent?: string;
  lookingFor?: string;
  interests?: string[];
  city?: string;
  state?: string;
  zipCode?: string;
  radiusMiles?: number;
  redFlags?: string[];
  interestedIn?: string;
  neighborhood?: string;
  ethnicity?: string;
  religion?: string;
  relationshipType?: string;
  height?: string;
  children?: string;
  familyPlans?: string;
  drugs?: string;
  smoking?: string;
  marijuana?: string;
  drinking?: string;
  politics?: string;
  educationLevel?: string;
  weight?: string;
  physique?: string;
  sexualPreference?: string;
  comfortWithIntimacy?: string;
}
