package com.triad.app.ui.nav

object Routes {
    const val MAIN = "main"
    const val DISCOVER = "discover"
    const val SAVED = "saved"
    const val MATCHES = "matches"
    const val IMPRESS = "impress"
    const val EVENTS = "events"
    const val NOTIFICATIONS = "notifications"
    const val PROFILE_OWN = "profile/own"
    const val PROFILE_EDIT = "profile/edit"

    fun profileDetail(userId: String, signalId: String? = null): String {
        val s = if (signalId.isNullOrBlank()) "" else "?signalId=$signalId"
        return "profile/$userId$s"
    }

    const val PROFILE_DETAIL = "profile/{userId}?signalId={signalId}"

    fun matchChat(matchId: String): String = "match/$matchId"
    const val MATCH_CHAT = "match/{matchId}"

    fun impressMeRespond(signalId: String): String = "impress/respond/$signalId"
    const val IMPRESS_RESPOND = "impress/respond/{signalId}"

    fun impressMeReview(signalId: String): String = "impress/review/$signalId"
    const val IMPRESS_REVIEW = "impress/review/{signalId}"
}
