package com.triad.app.data

import kotlinx.serialization.Serializable

/**
 * Mirrors iOS request bodies. Property names are kept identical to the
 * backend DTO contracts.
 */

@Serializable
data class LoginRequest(
    val email: String,
    val password: String,
)

@Serializable
data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
)

@Serializable
data class UpdateProfileRequest(
    val bio: String? = null,
    val ageMin: Int? = null,
    val ageMax: Int? = null,
    val intent: String? = null,
    val lookingFor: String? = null,
    val interests: List<String>? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String? = null,
    val state: String? = null,
    val zipCode: String? = null,
    val radiusMiles: Int? = null,
    val redFlags: List<String>? = null,
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
)

@Serializable
data class LikeRequest(val targetUserId: String)

@Serializable
data class SaveProfileRequest(val targetUserId: String)

@Serializable
data class BlockUserRequest(val userId: String)

@Serializable
data class ReportUserRequest(
    val userId: String,
    val reason: String,
    val details: String? = null,
)

@Serializable
data class SendMessageRequest(val content: String)

@Serializable
data class JoinCoupleRequest(val inviteCode: String)

@Serializable
data class SendImpressMeRequest(
    val targetUserId: String,
    val matchId: String? = null,
)

@Serializable
data class ImpressMeRespondRequest(val textContent: String)

@Serializable
data class StartVerificationAttemptRequest(
    val idempotencyKey: String? = null,
)

@Serializable
data class CompleteVerificationAttemptRequest(
    val decision: String,
    val providerToken: String? = null,
    val providerReference: String? = null,
)

@Serializable
class EmptyRequest
