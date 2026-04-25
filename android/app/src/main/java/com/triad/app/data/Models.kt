package com.triad.app.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * Mirrors iOS `Models.swift`. Uses kotlinx.serialization with camelCase JSON
 * (the backend serializes camelCase by default).
 */

@Serializable
data class Photo(
    val id: String,
    val url: String,
    val sortOrder: Int = 0,
)

@Serializable
data class ProfileVideo(
    val id: String,
    val url: String,
    val sortOrder: Int = 0,
)

@Serializable
data class UserProfile(
    val id: String,
    val username: String,
    val bio: String = "",
    val ageMin: Int = 18,
    val ageMax: Int = 99,
    val intent: String = "",
    val lookingFor: String = "",
    val interests: List<String> = emptyList(),
    val photos: List<Photo> = emptyList(),
    val coupleId: String? = null,
    val isCouple: Boolean = false,
    val city: String = "",
    val state: String = "",
    val zipCode: String = "",
    val radiusMiles: Int? = null,
    val couplePartnerName: String? = null,
    val audioBioUrl: String? = null,
    val videoBioUrl: String? = null,
    val videos: List<ProfileVideo> = emptyList(),
    val redFlags: List<String>? = null,
    // Dating preferences
    val interestedIn: String? = null,
    val neighborhood: String? = null,
    val ethnicity: String? = null,
    val religion: String? = null,
    val relationshipType: String? = null,
    val height: String? = null,
    val children: String? = null,
    val familyPlans: String? = null,
    val drugs: String? = null,
    val smoking: String? = null,
    val marijuana: String? = null,
    val drinking: String? = null,
    val politics: String? = null,
    val educationLevel: String? = null,
    val weight: String? = null,
    val physique: String? = null,
    val sexualPreference: String? = null,
    val comfortWithIntimacy: String? = null,
) {
    val orderedPhotos: List<Photo>
        get() = photos.sortedWith(compareBy({ it.sortOrder }, { it.id }))

    /**
     * iOS `orderedVideos` keeps backwards compatibility with the legacy
     * `videoBioUrl` field, surfacing it as a synthetic ProfileVideo when
     * there are no native videos. We do the same for parity.
     */
    val orderedVideos: List<ProfileVideo>
        get() {
            val sorted = videos.sortedWith(compareBy({ it.sortOrder }, { it.id }))
            if (sorted.isNotEmpty()) return sorted
            val legacy = videoBioUrl
            if (legacy.isNullOrBlank()) return emptyList()
            return listOf(
                ProfileVideo(
                    id = "00000000-0000-0000-0000-000000000001",
                    url = legacy,
                    sortOrder = 0,
                ),
            )
        }
}

@Serializable
data class AuthResponse(
    val token: String,
    val user: UserProfile,
)

@Serializable
data class DiscoveryCard(
    val userId: String,
    val username: String,
    val bio: String = "",
    val ageMin: Int = 18,
    val ageMax: Int = 99,
    val intent: String = "",
    val lookingFor: String = "",
    val interests: List<String> = emptyList(),
    val photos: List<Photo> = emptyList(),
    val isCouple: Boolean = false,
    val approximateDistanceKm: Double? = null,
    val city: String = "",
    val state: String = "",
)

@Serializable
data class SavedProfileItem(
    val userId: String,
    val username: String,
    val bio: String = "",
    val ageMin: Int = 18,
    val ageMax: Int = 99,
    val intent: String = "",
    val lookingFor: String = "",
    val interests: List<String> = emptyList(),
    val photos: List<Photo> = emptyList(),
    val isCouple: Boolean = false,
    val approximateDistanceKm: Double? = null,
    val city: String = "",
    val state: String = "",
    val savedAt: String,
)

@Serializable
data class ParticipantInfo(
    val userId: String,
    val username: String,
    val bio: String = "",
    val photos: List<Photo> = emptyList(),
    val isCouple: Boolean = false,
    val coupleId: String? = null,
)

@Serializable
data class MatchItem(
    val matchId: String,
    val participants: List<ParticipantInfo>,
    val matchedAt: String,
    val isGroupChat: Boolean = false,
)

@Serializable
data class MessageItem(
    val id: String,
    val senderId: String,
    val senderUsername: String,
    val senderPhotoUrl: String? = null,
    val content: String,
    val sentAt: String,
    val isRead: Boolean = false,
)

@Serializable
data class EventItem(
    val id: String,
    val title: String,
    val description: String = "",
    val bannerUrl: String = "",
    val eventDate: String,
    val city: String = "",
    val state: String = "",
    val venue: String = "",
    val latitude: Double? = null,
    val longitude: Double? = null,
    val distanceKm: Double? = null,
    val interestedCount: Int = 0,
    val isInterested: Boolean = false,
)

@Serializable
data class EventInterestToggleResponse(
    val isInterested: Boolean,
    val interestedCount: Int,
)

@Serializable
data class LikeResult(
    val matched: Boolean,
    val match: MatchItem? = null,
)

@Serializable
enum class AppNotificationType {
    @SerialName("LikeReceived") LikeReceived,
    @SerialName("MatchCreated") MatchCreated,
    @SerialName("MessageReceived") MessageReceived,
    @SerialName("ImpressMeReceived") ImpressMeReceived,
    @SerialName("Unknown") Unknown,
}

@Serializable
data class AppNotification(
    val id: String,
    val type: AppNotificationType = AppNotificationType.Unknown,
    val title: String,
    val body: String,
    val referenceId: String? = null,
    val actorId: String? = null,
    val actorName: String? = null,
    val actorPhotoUrl: String? = null,
    val isRead: Boolean = false,
    val createdAt: String,
)

@Serializable
data class NotificationListResponse(
    val notifications: List<AppNotification>,
    val unreadCount: Int = 0,
)

// MARK: – Verifications

@Serializable
data class VerificationMethod(
    val key: String,
    val displayName: String,
    val status: String,
    val isEnabled: Boolean = false,
    val isEligible: Boolean = false,
    val ineligibilityReason: String? = null,
    val version: String = "",
    val capabilities: List<String> = emptyList(),
    val failureReason: String? = null,
    val verifiedAt: String? = null,
    val expiresAt: String? = null,
    val updatedAt: String,
) {
    val supportsProfileEntryPoint: Boolean
        get() = key == "live_verified" || key == "age_verified"

    val isVerified: Boolean
        get() = status == "verified"

    val canStart: Boolean
        get() = isEnabled && isEligible && status in setOf("not_started", "failed", "expired")

    val displayStatus: String
        get() = status.replace('_', ' ').replaceFirstChar { it.uppercase() }
}

@Serializable
data class VerificationListResponse(
    val methods: List<VerificationMethod>,
)

@Serializable
data class StartVerificationAttemptResponse(
    val attemptId: String,
    val methodKey: String,
    val status: String,
    val clientToken: String? = null,
    val expiresAt: String? = null,
)

@Serializable
data class VerificationAttemptResponse(
    val attemptId: String,
    val methodKey: String,
    val status: String,
    val failureReason: String? = null,
    val verifiedAt: String? = null,
    val expiresAt: String? = null,
)

// MARK: – Couple

@Serializable
data class CoupleStatus(
    val coupleId: String? = null,
    val inviteCode: String? = null,
    val isComplete: Boolean = false,
    val partnerName: String? = null,
    val partnerUserId: String? = null,
)

@Serializable
data class CreateCoupleResponse(
    val coupleId: String,
    val inviteCode: String,
)

// MARK: – Impress Me

@Serializable
enum class ImpressMeStatus {
    @SerialName("Sent") Sent,
    @SerialName("Responded") Responded,
    @SerialName("Viewed") Viewed,
    @SerialName("Accepted") Accepted,
    @SerialName("Declined") Declined,
    @SerialName("Expired") Expired;

    val displayLabel: String
        get() = when (this) {
            Sent -> "Waiting for reply"
            Responded -> "New response!"
            Viewed -> "Response reviewed"
            Accepted -> "Accepted ✨"
            Declined -> "Passed"
            Expired -> "Expired"
        }

    val isActionable: Boolean get() = this == Responded || this == Viewed
    val isTerminal: Boolean
        get() = this == Accepted || this == Declined || this == Expired
}

@Serializable
enum class ImpressMeFlow {
    @SerialName("PreMatch") PreMatch,
    @SerialName("PostMatch") PostMatch,
}

@Serializable
data class ImpressMePromptModel(
    val id: String,
    val category: String,
    val promptText: String,
    val senderContext: String? = null,
)

@Serializable
data class ImpressMeResponseModel(
    val id: String,
    val textContent: String,
    val mediaUrl: String? = null,
    val mediaType: String? = null,
    val createdAt: String,
)

@Serializable
data class ImpressMeSignal(
    val id: String,
    val senderId: String,
    val senderUsername: String,
    val senderPhotoUrl: String? = null,
    val receiverId: String,
    val receiverUsername: String,
    val receiverPhotoUrl: String? = null,
    val matchId: String? = null,
    val flow: ImpressMeFlow = ImpressMeFlow.PreMatch,
    val status: ImpressMeStatus = ImpressMeStatus.Sent,
    val prompt: ImpressMePromptModel,
    val response: ImpressMeResponseModel? = null,
    val createdAt: String,
    val expiresAt: String,
    val respondedAt: String? = null,
    val viewedAt: String? = null,
    val resolvedAt: String? = null,
)

@Serializable
data class ImpressMeInbox(
    val received: List<ImpressMeSignal> = emptyList(),
    val sent: List<ImpressMeSignal> = emptyList(),
    val unreadCount: Int = 0,
) {
    val sentNeedsReviewCount: Int
        get() = sent.count { it.status == ImpressMeStatus.Responded }

    val summary: ImpressMeSummary
        get() = ImpressMeSummary(unreadCount, sentNeedsReviewCount)
}

@Serializable
data class ImpressMeSummary(
    val receivedUnreadCount: Int = 0,
    val sentNeedsReviewCount: Int = 0,
) {
    val totalBadgeCount: Int get() = receivedUnreadCount + sentNeedsReviewCount

    companion object { val empty = ImpressMeSummary() }
}

@Serializable
data class UploadAudioBioResponse(val url: String)

@Serializable
data class UploadVideoBioResponse(val url: String)

@Serializable
data class ApiErrorResponse(
    val error: String? = null,
    val message: String? = null,
)
