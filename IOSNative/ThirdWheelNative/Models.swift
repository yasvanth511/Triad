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
}

struct Photo: Codable, Identifiable {
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

struct LikeResult: Codable {
    let matched: Bool
    let match: MatchItem?
}

struct APIErrorResponse: Decodable {
    let error: String?
    let message: String?
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

