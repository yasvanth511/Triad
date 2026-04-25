package com.triad.app.core

/**
 * Equivalent of iOS [AppConfig.swift]. Resolves the backend origin and the
 * `/api` prefix used by [com.triad.app.core.network.ApiClient].
 *
 * The Android emulator default (`http://10.0.2.2:5127`) maps the host machine
 * port 5127 used by `dotnet run` for the backend. Override at build time via:
 *
 *     ./gradlew :app:assembleDebug -Ptriad.apiBaseUrl=http://192.168.1.50:5127
 */
data class AppConfig(
    val originBaseUrl: String,
    val apiBaseUrl: String,
) {
    /**
     * Resolves a relative media path (e.g. "/uploads/abc.jpg") to a fully
     * qualified URL using the API origin. Returns the absolute URL unchanged
     * when [path] already includes a scheme. Returns `null` for blank input.
     */
    fun mediaUrl(path: String?): String? {
        if (path.isNullOrBlank()) return null
        if (path.startsWith("http://") || path.startsWith("https://") ||
            path.startsWith("data:")) return path
        val normalized = if (path.startsWith("/")) path else "/$path"
        return originBaseUrl.trimEnd('/') + normalized
    }

    companion object {
        fun from(rawOrigin: String): AppConfig {
            val origin = rawOrigin.trim().trimEnd('/')
            val api = if (origin.endsWith("/api")) origin else "$origin/api"
            return AppConfig(originBaseUrl = origin, apiBaseUrl = api)
        }
    }
}
