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
