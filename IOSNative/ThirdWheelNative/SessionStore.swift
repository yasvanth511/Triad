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
    @Published private(set) var impressMeSummary: ImpressMeSummary = .empty
    @Published private(set) var notificationUnreadCount: Int = 0
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
        impressMeSummary = .empty
        notificationUnreadCount = 0
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

    // MARK: – Audio Bio

    /// Upload an audio file as the current user's bio clip.
    /// - Parameters:
    ///   - data: Raw audio bytes
    ///   - mimeType: e.g. "audio/mpeg", "audio/m4a", "audio/wav"
    ///   - fileName: e.g. "bio.m4a"
    @discardableResult
    func uploadAudioBio(data: Data, mimeType: String, fileName: String) async throws -> String {
        let response: UploadAudioBioResponse = try await client.upload(
            "profile/audio-bio",
            data: data,
            mimeType: mimeType,
            fileName: fileName
        )
        _ = try await reloadCurrentUser()
        return response.url
    }

    func deleteAudioBio() async throws {
        try await client.delete("profile/audio-bio")
        _ = try await reloadCurrentUser()
    }

    // MARK: – Video Bio

    /// Upload a video file as the current user's bio clip.
    /// - Parameters:
    ///   - data: Raw video bytes
    ///   - mimeType: e.g. "video/mp4", "video/quicktime"
    ///   - fileName: e.g. "bio.mp4"
    @discardableResult
    func uploadVideoBio(data: Data, mimeType: String, fileName: String) async throws -> String {
        let response: UploadVideoBioResponse = try await client.upload(
            "profile/video-bio",
            data: data,
            mimeType: mimeType,
            fileName: fileName
        )
        _ = try await reloadCurrentUser()
        return response.url
    }

    func deleteVideoBio() async throws {
        try await client.delete("profile/video-bio")
        _ = try await reloadCurrentUser()
    }

    @discardableResult
    func uploadProfilePhoto(data: Data, mimeType: String, fileName: String) async throws -> Photo {
        let response: Photo = try await client.upload(
            "profile/photos",
            data: data,
            mimeType: mimeType,
            fileName: fileName
        )
        _ = try await reloadCurrentUser()
        return response
    }

    func deleteProfilePhoto(photoId: UUID) async throws {
        try await client.delete("profile/photos/\(photoId.uuidString.lowercased())")
        _ = try await reloadCurrentUser()
    }

    @discardableResult
    func uploadProfileVideo(data: Data, mimeType: String, fileName: String) async throws -> ProfileVideo {
        let response: ProfileVideo = try await client.upload(
            "profile/videos",
            data: data,
            mimeType: mimeType,
            fileName: fileName
        )
        _ = try await reloadCurrentUser()
        return response
    }

    func deleteProfileVideo(videoId: UUID) async throws {
        try await client.delete("profile/videos/\(videoId.uuidString.lowercased())")
        _ = try await reloadCurrentUser()
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

    // MARK: – Verifications

    func loadVerifications() async throws -> [VerificationMethod] {
        let response: VerificationListResponse = try await client.get("verifications")
        return response.methods
    }

    func startVerificationAttempt(methodKey: String) async throws -> StartVerificationAttemptResponse {
        try await client.post(
            "verifications/\(methodKey)/attempts",
            body: StartVerificationAttemptRequest()
        )
    }

    func completeVerificationAttempt(
        methodKey: String,
        attemptId: UUID,
        decision: String,
        providerReference: String?
    ) async throws -> VerificationAttemptResponse {
        try await client.post(
            "verifications/\(methodKey)/attempts/\(attemptId.uuidString.lowercased())/complete",
            body: CompleteVerificationAttemptRequest(
                decision: decision,
                providerReference: providerReference
            )
        )
    }

    // MARK: – Impress Me

    func getImpressMeInbox() async throws -> ImpressMeInbox {
        let inbox: ImpressMeInbox = try await client.get("impress-me/inbox")
        syncImpressMeSummary(from: inbox)
        return inbox
    }

    func getImpressMeSignal(signalId: UUID) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.get("impress-me/\(signalId.uuidString.lowercased())")
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func loadImpressMeSummary() async throws -> ImpressMeSummary {
        let summary: ImpressMeSummary = try await client.get("impress-me/summary")
        impressMeSummary = summary
        return summary
    }

    func sendImpressMe(targetUserId: UUID, matchId: UUID? = nil) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.post(
            "impress-me",
            body: SendImpressMeRequest(targetUserId: targetUserId, matchId: matchId)
        )
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func respondToImpressMe(signalId: UUID, text: String) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.post(
            "impress-me/\(signalId.uuidString.lowercased())/respond",
            body: ImpressMeRespondRequest(textContent: text)
        )
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func reviewImpressMe(signalId: UUID) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.post(
            "impress-me/\(signalId.uuidString.lowercased())/review",
            body: EmptyRequest()
        )
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func acceptImpressMe(signalId: UUID) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.post(
            "impress-me/\(signalId.uuidString.lowercased())/accept",
            body: EmptyRequest()
        )
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func declineImpressMe(signalId: UUID) async throws -> ImpressMeSignal {
        let signal: ImpressMeSignal = try await client.post(
            "impress-me/\(signalId.uuidString.lowercased())/decline",
            body: EmptyRequest()
        )
        _ = try? await loadImpressMeSummary()
        return signal
    }

    func syncImpressMeSummary(from inbox: ImpressMeInbox) {
        impressMeSummary = inbox.summary
    }

    // MARK: – Notifications

    func loadNotifications(skip: Int = 0, take: Int = 50) async throws -> NotificationListResponse {
        let result: NotificationListResponse = try await client.get(
            "notifications",
            queryItems: [
                URLQueryItem(name: "skip", value: String(skip)),
                URLQueryItem(name: "take", value: String(take))
            ]
        )
        notificationUnreadCount = result.unreadCount
        return result
    }

    func markNotificationRead(notificationId: UUID) async throws {
        let _: EmptyResponse = try await client.post(
            "notifications/\(notificationId.uuidString.lowercased())/read",
            body: EmptyRequest()
        )
        if notificationUnreadCount > 0 { notificationUnreadCount -= 1 }
    }

    func markAllNotificationsRead() async throws {
        let _: EmptyResponse = try await client.post("notifications/read-all", body: EmptyRequest())
        notificationUnreadCount = 0
    }

    func refreshNotificationCount() async {
        guard let result = try? await loadNotifications(take: 1) else { return }
        notificationUnreadCount = result.unreadCount
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

    @discardableResult
    private func reloadCurrentUser() async throws -> UserProfile {
        let refreshed: UserProfile = try await client.get("profile")
        currentUser = refreshed
        return refreshed
    }
}

struct EmptyRequest: Encodable {}
