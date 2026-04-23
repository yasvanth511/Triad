import Foundation

// MARK: – Domain models

enum ImpressMeStatus: String, Codable {
    case sent       = "Sent"
    case responded  = "Responded"
    case viewed     = "Viewed"
    case accepted   = "Accepted"
    case declined   = "Declined"
    case expired    = "Expired"

    var displayLabel: String {
        switch self {
        case .sent:      return "Waiting for reply"
        case .responded: return "New response!"
        case .viewed:    return "Response reviewed"
        case .accepted:  return "Accepted ✨"
        case .declined:  return "Passed"
        case .expired:   return "Expired"
        }
    }

    var isActionable: Bool { self == .responded || self == .viewed }
    var isTerminal: Bool   { self == .accepted || self == .declined || self == .expired }
}

enum ImpressMeFlow: String, Codable {
    case preMatch  = "PreMatch"
    case postMatch = "PostMatch"
}

struct ImpressMePromptModel: Codable, Identifiable {
    let id: UUID
    let category: String
    let promptText: String
    let senderContext: String?
}

struct ImpressMeResponseModel: Codable, Identifiable {
    let id: UUID
    let textContent: String
    let mediaUrl: String?
    let mediaType: String?
    let createdAt: Date
}

struct ImpressMeSignal: Codable, Identifiable {
    let id: UUID
    let senderId: UUID
    let senderUsername: String
    let senderPhotoUrl: String?
    let receiverId: UUID
    let receiverUsername: String
    let receiverPhotoUrl: String?
    let matchId: UUID?
    let flow: ImpressMeFlow
    let status: ImpressMeStatus
    let prompt: ImpressMePromptModel
    let response: ImpressMeResponseModel?
    let createdAt: Date
    let expiresAt: Date
    let respondedAt: Date?
    let viewedAt: Date?
    let resolvedAt: Date?

    var isExpired: Bool { expiresAt < Date() || status == .expired }

    var hoursRemaining: Int {
        max(0, Int(expiresAt.timeIntervalSinceNow / 3600))
    }
}

struct ImpressMeInbox: Codable {
    var received: [ImpressMeSignal]
    var sent: [ImpressMeSignal]
    let unreadCount: Int

    var sentNeedsReviewCount: Int {
        sent.filter { $0.status == .responded }.count
    }

    var summary: ImpressMeSummary {
        ImpressMeSummary(
            receivedUnreadCount: unreadCount,
            sentNeedsReviewCount: sentNeedsReviewCount
        )
    }
}

struct ImpressMeSummary: Codable, Equatable {
    let receivedUnreadCount: Int
    let sentNeedsReviewCount: Int

    static let empty = ImpressMeSummary(receivedUnreadCount: 0, sentNeedsReviewCount: 0)

    var totalBadgeCount: Int {
        receivedUnreadCount + sentNeedsReviewCount
    }
}

// MARK: – Request models

struct SendImpressMeRequest: Encodable {
    let targetUserId: UUID
    let matchId: UUID?
}

struct ImpressMeRespondRequest: Encodable {
    let textContent: String
}
