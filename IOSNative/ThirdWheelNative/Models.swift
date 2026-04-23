import Foundation

struct UserProfile: Codable, Identifiable {
    let id: UUID
    let username: String
    let bio: String
    let ageMin: Int
    let ageMax: Int
    let intent: String
    let lookingFor: String
    let interests: [String]
    let photos: [Photo]
    let coupleId: UUID?
    let isCouple: Bool
    let city: String
    let state: String
    let zipCode: String
    let radiusMiles: Int?
    let couplePartnerName: String?
    let audioBioUrl: String?
    let videoBioUrl: String?
    let videos: [ProfileVideo]
    let redFlags: [String]?
    // Dating Preferences
    let interestedIn: String?
    let neighborhood: String?
    let ethnicity: String?
    let religion: String?
    let relationshipType: String?
    let height: String?
    let children: String?
    let familyPlans: String?
    let drugs: String?
    let smoking: String?
    let marijuana: String?
    let drinking: String?
    let politics: String?
    let educationLevel: String?
    let weight: String?
    let physique: String?
    let sexualPreference: String?
    let comfortWithIntimacy: String?

    var orderedPhotos: [Photo] {
        photos.sorted {
            if $0.sortOrder == $1.sortOrder {
                return $0.id.uuidString < $1.id.uuidString
            }
            return $0.sortOrder < $1.sortOrder
        }
    }

    var orderedVideos: [ProfileVideo] {
        let sortedVideos = videos.sorted {
            if $0.sortOrder == $1.sortOrder {
                return $0.id.uuidString < $1.id.uuidString
            }
            return $0.sortOrder < $1.sortOrder
        }

        if !sortedVideos.isEmpty {
            return sortedVideos
        }

        guard let videoBioUrl, !videoBioUrl.isEmpty else {
            return []
        }

        return [
            ProfileVideo(
                id: UUID(uuidString: "00000000-0000-0000-0000-000000000001") ?? UUID(),
                url: videoBioUrl,
                sortOrder: 0
            )
        ]
    }
}

struct Photo: Codable, Identifiable {
    let id: UUID
    let url: String
    let sortOrder: Int
}

struct ProfileVideo: Codable, Identifiable {
    let id: UUID
    let url: String
    let sortOrder: Int
}

struct AuthResponse: Codable {
    let token: String
    let user: UserProfile
}

struct RegisterRequest: Encodable {
    let username: String
    let email: String
    let password: String
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct UpdateProfileRequest: Encodable {
    let bio: String?
    let ageMin: Int?
    let ageMax: Int?
    let intent: String?
    let lookingFor: String?
    let interests: [String]?
    let latitude: Double?
    let longitude: Double?
    let city: String?
    let state: String?
    let zipCode: String?
    let radiusMiles: Int?
    let redFlags: [String]?
    // Dating Preferences
    let interestedIn: String?
    let neighborhood: String?
    let ethnicity: String?
    let religion: String?
    let relationshipType: String?
    let height: String?
    let children: String?
    let familyPlans: String?
    let drugs: String?
    let smoking: String?
    let marijuana: String?
    let drinking: String?
    let politics: String?
    let educationLevel: String?
    let weight: String?
    let physique: String?
    let sexualPreference: String?
    let comfortWithIntimacy: String?
}

struct DiscoveryCard: Codable, Identifiable {
    let userId: UUID
    let username: String
    let bio: String
    let ageMin: Int
    let ageMax: Int
    let intent: String
    let lookingFor: String
    let interests: [String]
    let photos: [Photo]
    let isCouple: Bool
    let approximateDistanceKm: Double?
    let city: String
    let state: String

    var id: UUID { userId }
}

struct SavedProfileItem: Codable, Identifiable {
    let userId: UUID
    let username: String
    let bio: String
    let ageMin: Int
    let ageMax: Int
    let intent: String
    let lookingFor: String
    let interests: [String]
    let photos: [Photo]
    let isCouple: Bool
    let approximateDistanceKm: Double?
    let city: String
    let state: String
    let savedAt: Date

    var id: UUID { userId }
}

struct MatchItem: Codable, Identifiable {
    let matchId: UUID
    let participants: [ParticipantInfo]
    let matchedAt: Date
    let isGroupChat: Bool

    var id: UUID { matchId }
}

struct ParticipantInfo: Codable, Identifiable {
    let userId: UUID
    let username: String
    let bio: String
    let photos: [Photo]
    let isCouple: Bool
    let coupleId: UUID?

    var id: UUID { userId }
}

struct MessageItem: Codable, Identifiable {
    let id: UUID
    let senderId: UUID
    let senderUsername: String
    let senderPhotoUrl: String?
    let content: String
    let sentAt: Date
    let isRead: Bool
}

struct SendMessageRequest: Encodable {
    let content: String
}

struct EventItem: Codable, Identifiable {
    let id: UUID
    let title: String
    let description: String
    let bannerUrl: String
    let eventDate: Date
    let city: String
    let state: String
    let venue: String
    let latitude: Double?
    let longitude: Double?
    let distanceKm: Double?
    let interestedCount: Int
    let isInterested: Bool
}

struct EventInterestToggleResponse: Codable {
    let isInterested: Bool
    let interestedCount: Int
}

struct LikeRequest: Encodable {
    let targetUserId: UUID
}

struct SaveProfileRequest: Encodable {
    let targetUserId: UUID
}

struct BlockUserRequest: Encodable {
    let userId: UUID
}

struct ReportUserRequest: Encodable {
    let userId: UUID
    let reason: String
    let details: String?
}

struct LikeResult: Codable {
    let matched: Bool
    let match: MatchItem?
}

struct AppNotification: Codable, Identifiable {
    let id: UUID
    let type: AppNotificationType
    let title: String
    let body: String
    let referenceId: UUID?
    let actorId: UUID?
    let actorName: String?
    let actorPhotoUrl: String?
    let isRead: Bool
    let createdAt: Date

    enum AppNotificationType: String, Codable {
        case likeReceived = "LikeReceived"
        case matchCreated = "MatchCreated"
        case messageReceived = "MessageReceived"
        case impressMeReceived = "ImpressMeReceived"
        case unknown

        init(from decoder: Decoder) throws {
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            self = AppNotificationType(rawValue: raw) ?? .unknown
        }
    }
}

struct NotificationListResponse: Codable {
    let notifications: [AppNotification]
    let unreadCount: Int
}

enum VerificationMethodKey: String, Codable {
    case liveVerified = "live_verified"
    case ageVerified = "age_verified"
}

struct VerificationMethod: Codable, Identifiable {
    let key: String
    let displayName: String
    let status: String
    let isEnabled: Bool
    let isEligible: Bool
    let ineligibilityReason: String?
    let version: String
    let capabilities: [String]
    let failureReason: String?
    let verifiedAt: Date?
    let expiresAt: Date?
    let updatedAt: Date

    var id: String { key }
    var methodKey: VerificationMethodKey? { VerificationMethodKey(rawValue: key) }
    var supportsProfileEntryPoint: Bool { methodKey != nil }
    var isVerified: Bool { status == "verified" }
    var canStart: Bool { isEnabled && isEligible && ["not_started", "failed", "expired"].contains(status) }
    var displayStatus: String { status.replacingOccurrences(of: "_", with: " ").capitalized }
}

struct VerificationListResponse: Codable {
    let methods: [VerificationMethod]
}

struct StartVerificationAttemptRequest: Encodable {
    let idempotencyKey: String? = nil
}

struct StartVerificationAttemptResponse: Codable {
    let attemptId: UUID
    let methodKey: String
    let status: String
    let clientToken: String?
    let expiresAt: Date?
}

struct CompleteVerificationAttemptRequest: Encodable {
    let decision: String
    let providerToken: String? = nil
    let providerReference: String?
}

struct VerificationAttemptResponse: Codable {
    let attemptId: UUID
    let methodKey: String
    let status: String
    let failureReason: String?
    let verifiedAt: Date?
    let expiresAt: Date?
}

struct APIErrorResponse: Decodable {
    let error: String?
    let message: String?
}

struct UploadAudioBioResponse: Decodable {
    let url: String
}

struct UploadVideoBioResponse: Decodable {
    let url: String
}

struct EmptyResponse: Decodable {}

extension JSONDecoder {
    static let triadDecoder: JSONDecoder = {
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let value = try container.decode(String.self)

            if let date = ISO8601DateFormatter.triadFractional.date(from: value) ??
                ISO8601DateFormatter.triadStandard.date(from: value) {
                return date
            }

            throw DecodingError.dataCorruptedError(
                in: container,
                debugDescription: "Unsupported ISO-8601 date value: \(value)"
            )
        }
        return decoder
    }()
}

extension ISO8601DateFormatter {
    static let triadStandard: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    static let triadFractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
}
