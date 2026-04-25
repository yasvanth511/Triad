package com.triad.app.session

import androidx.compose.runtime.staticCompositionLocalOf
import com.triad.app.core.network.ApiClient
import com.triad.app.core.network.ApiClientException
import com.triad.app.core.storage.TokenStore
import com.triad.app.data.AppNotification
import com.triad.app.data.AuthResponse
import com.triad.app.data.BlockUserRequest
import com.triad.app.data.CompleteVerificationAttemptRequest
import com.triad.app.data.CoupleStatus
import com.triad.app.data.CreateCoupleResponse
import com.triad.app.data.DiscoveryCard
import com.triad.app.data.EmptyRequest
import com.triad.app.data.EventInterestToggleResponse
import com.triad.app.data.EventItem
import com.triad.app.data.ImpressMeInbox
import com.triad.app.data.ImpressMeRespondRequest
import com.triad.app.data.ImpressMeSignal
import com.triad.app.data.ImpressMeSummary
import com.triad.app.data.JoinCoupleRequest
import com.triad.app.data.LikeRequest
import com.triad.app.data.LikeResult
import com.triad.app.data.LoginRequest
import com.triad.app.data.MatchItem
import com.triad.app.data.MessageItem
import com.triad.app.data.NotificationListResponse
import com.triad.app.data.Photo
import com.triad.app.data.ProfileVideo
import com.triad.app.data.RegisterRequest
import com.triad.app.data.ReportUserRequest
import com.triad.app.data.SaveProfileRequest
import com.triad.app.data.SavedProfileItem
import com.triad.app.data.SendImpressMeRequest
import com.triad.app.data.SendMessageRequest
import com.triad.app.data.StartVerificationAttemptRequest
import com.triad.app.data.StartVerificationAttemptResponse
import com.triad.app.data.UpdateProfileRequest
import com.triad.app.data.UploadAudioBioResponse
import com.triad.app.data.UserProfile
import com.triad.app.data.VerificationAttemptResponse
import com.triad.app.data.VerificationListResponse
import com.triad.app.data.VerificationMethod
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

/**
 * Equivalent of iOS [SessionStore.swift]. Coordinates auth state, the
 * current user, and dispatches every backend call. Exposed as
 * `StateFlow`s so Compose can observe changes via `collectAsState`.
 */
class SessionStore(
    private val client: ApiClient,
    private val tokenStore: TokenStore,
) {
    enum class Phase { Loading, SignedOut, Authenticated }

    private val _phase = MutableStateFlow(Phase.Loading)
    val phase: StateFlow<Phase> = _phase.asStateFlow()

    private val _currentUser = MutableStateFlow<UserProfile?>(null)
    val currentUser: StateFlow<UserProfile?> = _currentUser.asStateFlow()

    private val _impressMeSummary = MutableStateFlow(ImpressMeSummary.empty)
    val impressMeSummary: StateFlow<ImpressMeSummary> = _impressMeSummary.asStateFlow()

    private val _notificationUnreadCount = MutableStateFlow(0)
    val notificationUnreadCount: StateFlow<Int> = _notificationUnreadCount.asStateFlow()

    private val _lastErrorMessage = MutableStateFlow<String?>(null)
    val lastErrorMessage: StateFlow<String?> = _lastErrorMessage.asStateFlow()

    private val _isAuthenticating = MutableStateFlow(false)
    val isAuthenticating: StateFlow<Boolean> = _isAuthenticating.asStateFlow()

    @Volatile
    private var hasBootstrapped = false

    suspend fun bootstrapIfNeeded() {
        if (hasBootstrapped) return
        hasBootstrapped = true
        val token = tokenStore.loadToken()
        if (token == null) {
            _phase.value = Phase.SignedOut
            return
        }
        client.authToken = token
        try {
            _currentUser.value = client.get<UserProfile>("profile")
            _phase.value = Phase.Authenticated
        } catch (t: Throwable) {
            tokenStore.deleteToken()
            client.authToken = null
            _currentUser.value = null
            _phase.value = Phase.SignedOut
            _lastErrorMessage.value = t.localizedMessage
        }
    }

    suspend fun login(email: String, password: String) {
        if (_isAuthenticating.value) return
        _isAuthenticating.value = true
        try {
            val response: AuthResponse = client.post(
                "auth/login",
                LoginRequest(email = email, password = password),
            )
            persistSession(response)
        } catch (t: Throwable) {
            _lastErrorMessage.value = t.localizedMessage
        } finally {
            _isAuthenticating.value = false
        }
    }

    suspend fun register(username: String, email: String, password: String) {
        if (_isAuthenticating.value) return
        _isAuthenticating.value = true
        try {
            val response: AuthResponse = client.post(
                "auth/register",
                RegisterRequest(username = username, email = email, password = password),
            )
            persistSession(response)
        } catch (t: Throwable) {
            _lastErrorMessage.value = t.localizedMessage
        } finally {
            _isAuthenticating.value = false
        }
    }

    fun signOut() {
        tokenStore.deleteToken()
        client.authToken = null
        _currentUser.value = null
        _impressMeSummary.value = ImpressMeSummary.empty
        _notificationUnreadCount.value = 0
        _phase.value = Phase.SignedOut
    }

    suspend fun refreshProfile() {
        try {
            _currentUser.value = client.get<UserProfile>("profile")
        } catch (t: Throwable) {
            _lastErrorMessage.value = t.localizedMessage
        }
    }

    suspend fun loadProfile(userId: String): UserProfile =
        client.get("profile/${userId.lowercase()}")

    suspend fun updateProfile(request: UpdateProfileRequest): UserProfile {
        val updated: UserProfile = client.put("profile", request)
        _currentUser.value = updated
        return updated
    }

    suspend fun deleteAccount() {
        client.delete("profile")
        signOut()
    }

    // -------- Audio bio
    suspend fun uploadAudioBio(bytes: ByteArray, mimeType: String, fileName: String): String {
        val response: UploadAudioBioResponse =
            client.upload("profile/audio-bio", bytes, mimeType, fileName)
        reloadCurrentUser()
        return response.url
    }

    suspend fun deleteAudioBio() {
        client.delete("profile/audio-bio")
        reloadCurrentUser()
    }

    // -------- Photo
    suspend fun uploadProfilePhoto(bytes: ByteArray, mimeType: String, fileName: String): Photo {
        val photo: Photo = client.upload("profile/photos", bytes, mimeType, fileName)
        reloadCurrentUser()
        return photo
    }

    suspend fun deleteProfilePhoto(photoId: String) {
        client.delete("profile/photos/${photoId.lowercase()}")
        reloadCurrentUser()
    }

    // -------- Video
    suspend fun uploadProfileVideo(bytes: ByteArray, mimeType: String, fileName: String): ProfileVideo {
        val video: ProfileVideo = client.upload("profile/videos", bytes, mimeType, fileName)
        reloadCurrentUser()
        return video
    }

    suspend fun deleteProfileVideo(videoId: String) {
        client.delete("profile/videos/${videoId.lowercase()}")
        reloadCurrentUser()
    }

    // -------- Discovery / Like / Save
    suspend fun loadDiscovery(userType: String?): List<DiscoveryCard> {
        val q = mutableListOf("skip" to "0", "take" to "20")
        if (!userType.isNullOrBlank()) q += "userType" to userType
        return client.get("discovery", q)
    }

    suspend fun like(userId: String): LikeResult =
        client.post("match/like", LikeRequest(userId.lowercase()))

    suspend fun saveProfile(userId: String) {
        client.postEmptyResult("saved", SaveProfileRequest(userId.lowercase()))
    }

    suspend fun loadSavedProfiles(): List<SavedProfileItem> = client.get("saved")

    suspend fun removeSavedProfile(userId: String) =
        client.delete("saved/${userId.lowercase()}")

    // -------- Safety
    suspend fun block(userId: String) {
        client.postEmptyResult("safety/block", BlockUserRequest(userId.lowercase()))
    }

    suspend fun report(userId: String, reason: String, details: String?) {
        client.postEmptyResult(
            "safety/report",
            ReportUserRequest(userId.lowercase(), reason, details),
        )
    }

    // -------- Matches & messages
    suspend fun loadMatches(): List<MatchItem> = client.get("match")

    suspend fun loadMessages(matchId: String, skip: Int = 0, take: Int = 50): List<MessageItem> =
        client.get(
            "message/${matchId.lowercase()}",
            listOf("skip" to skip.toString(), "take" to take.toString()),
        )

    suspend fun sendMessage(matchId: String, content: String): MessageItem =
        client.post("message/${matchId.lowercase()}", SendMessageRequest(content))

    // -------- Events
    suspend fun loadEvents(): List<EventItem> = client.get("event")

    suspend fun toggleInterest(eventId: String): EventInterestToggleResponse =
        client.post("event/${eventId.lowercase()}/interest", EmptyRequest())

    // -------- Verifications
    suspend fun loadVerifications(): List<VerificationMethod> {
        val response: VerificationListResponse = client.get("verifications")
        return response.methods
    }

    suspend fun startVerificationAttempt(methodKey: String): StartVerificationAttemptResponse =
        client.post(
            "verifications/$methodKey/attempts",
            StartVerificationAttemptRequest(),
        )

    suspend fun completeVerificationAttempt(
        methodKey: String,
        attemptId: String,
        decision: String,
        providerReference: String?,
    ): VerificationAttemptResponse = client.post(
        "verifications/$methodKey/attempts/${attemptId.lowercase()}/complete",
        CompleteVerificationAttemptRequest(
            decision = decision,
            providerReference = providerReference,
        ),
    )

    // -------- Impress Me
    suspend fun getImpressMeInbox(): ImpressMeInbox {
        val inbox: ImpressMeInbox = client.get("impress-me/inbox")
        syncImpressMeSummary(inbox)
        return inbox
    }

    suspend fun getImpressMeSignal(signalId: String): ImpressMeSignal {
        val signal: ImpressMeSignal = client.get("impress-me/${signalId.lowercase()}")
        runCatching { loadImpressMeSummary() }
        return signal
    }

    suspend fun loadImpressMeSummary(): ImpressMeSummary {
        val summary: ImpressMeSummary = client.get("impress-me/summary")
        _impressMeSummary.value = summary
        return summary
    }

    suspend fun sendImpressMe(targetUserId: String, matchId: String? = null): ImpressMeSignal {
        val signal: ImpressMeSignal = client.post(
            "impress-me",
            SendImpressMeRequest(targetUserId.lowercase(), matchId?.lowercase()),
        )
        runCatching { loadImpressMeSummary() }
        return signal
    }

    suspend fun respondToImpressMe(signalId: String, text: String): ImpressMeSignal {
        val signal: ImpressMeSignal = client.post(
            "impress-me/${signalId.lowercase()}/respond",
            ImpressMeRespondRequest(text),
        )
        runCatching { loadImpressMeSummary() }
        return signal
    }

    suspend fun reviewImpressMe(signalId: String): ImpressMeSignal {
        val signal: ImpressMeSignal = client.post(
            "impress-me/${signalId.lowercase()}/review",
            EmptyRequest(),
        )
        runCatching { loadImpressMeSummary() }
        return signal
    }

    suspend fun acceptImpressMe(signalId: String): ImpressMeSignal {
        val signal: ImpressMeSignal = client.post(
            "impress-me/${signalId.lowercase()}/accept",
            EmptyRequest(),
        )
        runCatching { loadImpressMeSummary() }
        return signal
    }

    suspend fun declineImpressMe(signalId: String): ImpressMeSignal {
        val signal: ImpressMeSignal = client.post(
            "impress-me/${signalId.lowercase()}/decline",
            EmptyRequest(),
        )
        runCatching { loadImpressMeSummary() }
        return signal
    }

    fun syncImpressMeSummary(inbox: ImpressMeInbox) {
        _impressMeSummary.value = inbox.summary
    }

    // -------- Notifications
    suspend fun loadNotifications(skip: Int = 0, take: Int = 50): NotificationListResponse {
        val result: NotificationListResponse = client.get(
            "notifications",
            listOf("skip" to skip.toString(), "take" to take.toString()),
        )
        _notificationUnreadCount.value = result.unreadCount
        return result
    }

    suspend fun markNotificationRead(notificationId: String) {
        client.postEmptyResult(
            "notifications/${notificationId.lowercase()}/read",
            EmptyRequest(),
        )
        _notificationUnreadCount.update { (it - 1).coerceAtLeast(0) }
    }

    suspend fun markAllNotificationsRead() {
        client.postEmptyResult("notifications/read-all", EmptyRequest())
        _notificationUnreadCount.value = 0
    }

    suspend fun refreshNotificationCount() {
        val result = runCatching { loadNotifications(take = 1) }.getOrNull() ?: return
        _notificationUnreadCount.value = result.unreadCount
    }

    // -------- Couple
    suspend fun loadCoupleStatus(): CoupleStatus = client.get("couple")

    suspend fun createCouple(): CreateCoupleResponse {
        val response: CreateCoupleResponse = client.post("couple", EmptyRequest())
        runCatching { reloadCurrentUser() }
        return response
    }

    suspend fun joinCouple(inviteCode: String): CreateCoupleResponse {
        val response: CreateCoupleResponse = client.post(
            "couple/join",
            JoinCoupleRequest(inviteCode),
        )
        runCatching { reloadCurrentUser() }
        return response
    }

    suspend fun leaveCouple() {
        client.delete("couple")
        runCatching { reloadCurrentUser() }
    }

    fun clearError() {
        _lastErrorMessage.value = null
    }

    fun presentError(t: Throwable) {
        _lastErrorMessage.value = t.localizedMessage ?: when (t) {
            is ApiClientException -> "Request failed (${t.statusCode}): ${t.serverMessage}"
            else -> t.toString()
        }
    }

    private fun persistSession(response: AuthResponse) {
        client.authToken = response.token
        _currentUser.value = response.user
        _phase.value = Phase.Authenticated
        _lastErrorMessage.value = null
        runCatching { tokenStore.saveToken(response.token) }
            .onFailure { error ->
                _lastErrorMessage.value =
                    "Signed in, but the session could not be saved for next launch. ${error.localizedMessage}"
            }
    }

    private suspend fun reloadCurrentUser(): UserProfile {
        val refreshed: UserProfile = client.get("profile")
        _currentUser.value = refreshed
        return refreshed
    }
}

/** Inject SessionStore into the Compose tree. */
val LocalSessionStore = staticCompositionLocalOf<SessionStore> {
    error("SessionStore not provided")
}
