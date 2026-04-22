import Foundation

@MainActor
final class SessionStore: ObservableObject {
    enum Phase {
        case loading
        case signedOut
        case authenticated
    }

    @Published private(set) var phase: Phase = .loading
    @Published private(set) var currentUser: UserProfile?
    @Published var lastErrorMessage: String?
    @Published var isAuthenticating = false

    private let client = APIClient()
    private let tokenStore = KeychainTokenStore()
    private var hasBootstrapped = false

    func bootstrapIfNeeded() async {
        guard !hasBootstrapped else { return }
        hasBootstrapped = true

        if let token = tokenStore.loadToken() {
            client.authToken = token

            do {
                currentUser = try await client.get("profile")
                phase = .authenticated
            } catch {
                tokenStore.deleteToken()
                client.authToken = nil
                currentUser = nil
                phase = .signedOut
                lastErrorMessage = error.localizedDescription
            }
        } else {
            phase = .signedOut
        }
    }

    func login(email: String, password: String) async {
        guard !isAuthenticating else { return }
        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            let response: AuthResponse = try await client.post(
                "auth/login",
                body: LoginRequest(email: email, password: password)
            )
            persistSession(response)
        } catch {
            lastErrorMessage = error.localizedDescription
        }
    }

    func register(username: String, email: String, password: String) async {
        guard !isAuthenticating else { return }
        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            let response: AuthResponse = try await client.post(
                "auth/register",
                body: RegisterRequest(username: username, email: email, password: password)
            )
            persistSession(response)
        } catch {
            lastErrorMessage = error.localizedDescription
        }
    }

    func signOut() {
        tokenStore.deleteToken()
        client.authToken = nil
        currentUser = nil
        phase = .signedOut
    }

    func refreshProfile() async {
        do {
            currentUser = try await client.get("profile")
        } catch {
            lastErrorMessage = error.localizedDescription
        }
    }

    func loadProfile(userId: UUID) async throws -> UserProfile {
        try await client.get("profile/\(userId.uuidString.lowercased())")
    }

    func updateProfile(_ request: UpdateProfileRequest) async throws -> UserProfile {
        let updated: UserProfile = try await client.put("profile", body: request)
        currentUser = updated
        return updated
    }

    func deleteAccount() async throws {
        try await client.delete("profile")
        signOut()
    }

    func loadDiscovery(userType: String?) async throws -> [DiscoveryCard] {
        var queryItems = [
            URLQueryItem(name: "skip", value: "0"),
            URLQueryItem(name: "take", value: "20")
        ]

        if let userType {
            queryItems.append(URLQueryItem(name: "userType", value: userType))
        }

        return try await client.get("discovery", queryItems: queryItems)
    }

    func like(userId: UUID) async throws -> LikeResult {
        try await client.post("match/like", body: LikeRequest(targetUserId: userId))
    }

    func saveProfile(userId: UUID) async throws {
        let _: EmptyResponse = try await client.post("saved", body: SaveProfileRequest(targetUserId: userId))
    }

    func loadSavedProfiles() async throws -> [SavedProfileItem] {
        try await client.get("saved")
    }

    func removeSavedProfile(userId: UUID) async throws {
        try await client.delete("saved/\(userId.uuidString.lowercased())")
    }

    func block(userId: UUID) async throws {
        let _: EmptyResponse = try await client.post("safety/block", body: BlockUserRequest(userId: userId))
    }

    func report(userId: UUID, reason: String, details: String?) async throws {
        let request = ReportUserRequest(
            userId: userId,
            reason: reason,
            details: details
        )
        let _: EmptyResponse = try await client.post("safety/report", body: request)
    }

    func loadMatches() async throws -> [MatchItem] {
        try await client.get("match")
    }

    func loadMessages(matchId: UUID, skip: Int = 0, take: Int = 50) async throws -> [MessageItem] {
        try await client.get(
            "message/\(matchId.uuidString.lowercased())",
            queryItems: [
                URLQueryItem(name: "skip", value: String(skip)),
                URLQueryItem(name: "take", value: String(take))
            ]
        )
    }

    func sendMessage(matchId: UUID, content: String) async throws -> MessageItem {
        try await client.post(
            "message/\(matchId.uuidString.lowercased())",
            body: SendMessageRequest(content: content)
        )
    }

    func loadEvents() async throws -> [EventItem] {
        try await client.get("event")
    }

    func toggleInterest(eventId: UUID) async throws -> EventInterestToggleResponse {
        try await client.post("event/\(eventId.uuidString.lowercased())/interest", body: EmptyRequest())
    }

    func clearError() {
        lastErrorMessage = nil
    }

    func presentError(_ error: Error) {
        lastErrorMessage = error.localizedDescription
    }

    private func persistSession(_ response: AuthResponse) {
        client.authToken = response.token
        currentUser = response.user
        phase = .authenticated
        lastErrorMessage = nil

        do {
            try tokenStore.saveToken(response.token)
        } catch {
            lastErrorMessage = "Signed in, but the session could not be saved for next launch. \(error.localizedDescription)"
        }
    }
}

struct EmptyRequest: Encodable {}
