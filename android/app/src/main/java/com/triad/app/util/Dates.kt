package com.triad.app.util

import java.time.Duration
import java.time.LocalDateTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter

/**
 * Date utilities. The backend emits ISO-8601 strings (with or without
 * fractional seconds). iOS uses `formatted(date:time:)`; we approximate
 * the same formats here.
 */
object Dates {
    private val abbreviatedFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("MMM d, yyyy")
    private val timeFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("h:mm a")
    private val abbreviatedDateTimeFormatter: DateTimeFormatter =
        DateTimeFormatter.ofPattern("MMM d, yyyy 'at' h:mm a")

    /** Parses a backend ISO-8601 timestamp into the device local zone. */
    fun parse(value: String?): LocalDateTime? {
        if (value.isNullOrBlank()) return null
        return runCatching {
            OffsetDateTime.parse(value).atZoneSameInstant(ZoneId.systemDefault()).toLocalDateTime()
        }.getOrElse {
            runCatching { LocalDateTime.parse(value) }.getOrNull()
        }
    }

    fun abbreviated(value: String?): String =
        parse(value)?.format(abbreviatedFormatter).orEmpty()

    fun shortTime(value: String?): String =
        parse(value)?.format(timeFormatter).orEmpty()

    fun abbreviatedDateTime(value: String?): String =
        parse(value)?.format(abbreviatedDateTimeFormatter).orEmpty()

    /** Hours remaining until [expiresAt]. Returns 0 if already expired. */
    fun hoursRemaining(expiresAt: String?): Int {
        val target = parse(expiresAt) ?: return 0
        val now = LocalDateTime.now()
        if (target.isBefore(now)) return 0
        return Duration.between(now, target).toHours().toInt().coerceAtLeast(0)
    }

    fun isExpired(expiresAt: String?): Boolean {
        val target = parse(expiresAt) ?: return false
        return target.isBefore(LocalDateTime.now())
    }
}
