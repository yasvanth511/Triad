package com.triad.app.core.network

import kotlinx.serialization.json.Json

/**
 * JSON config aligned with backend defaults. The backend sends camelCase
 * property names, so we don't apply any naming strategy. Unknown keys are
 * tolerated — same as iOS where we ignore them via Codable nullability.
 */
val TriadJson: Json = Json {
    ignoreUnknownKeys = true
    explicitNulls = false
    encodeDefaults = false
    isLenient = true
    coerceInputValues = true
}
