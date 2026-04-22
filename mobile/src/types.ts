export interface UserProfile {
  id: string;
  username: string;
  bio: string;
  ageMin: number;
  ageMax: number;
  intent: string;
  lookingFor: string;
  interests: string[];
  photos: Photo[];
  coupleId: string | null;
  isCouple: boolean;
}

export interface Photo {
  id: string;
  url: string;
  sortOrder: number;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface DiscoveryCard {
  userId: string;
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
}

export interface MatchItem {
  matchId: string;
  participants: ParticipantInfo[];
  matchedAt: string;
  isGroupChat: boolean;
}

export interface ParticipantInfo {
  userId: string;
  username: string;
  bio: string;
  photos: Photo[];
  isCouple: boolean;
  coupleId: string | null;
}

export interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  senderPhotoUrl: string | null;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface CoupleResponse {
  coupleId: string;
  inviteCode: string;
}

export interface EventItem {
  id: string;
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
