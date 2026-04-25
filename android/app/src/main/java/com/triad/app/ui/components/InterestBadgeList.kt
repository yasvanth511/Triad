package com.triad.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Flag
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Mirrors iOS `interestColor(for:)` palette. */
private val InterestPalette = listOf(
    Color(0xFF6189FF), // indigo-blue
    Color(0xFF38C09E), // teal
    Color(0xFFF27266), // coral
    Color(0xFF8C66E6), // violet
    Color(0xFF33C770), // mint green
    Color(0xFFFF9438), // amber
    Color(0xFFE65AA6), // rose
    Color(0xFF4DAEE6), // sky blue
)

fun interestColor(tag: String): Color {
    val sum = tag.lowercase().sumOf { it.code }
    return InterestPalette[(sum % InterestPalette.size + InterestPalette.size) % InterestPalette.size]
}

/** Mirrors iOS `InterestBadgeList`. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun InterestBadgeList(
    interests: List<String>,
    flaggedSet: Set<String> = emptySet(),
    spacing: androidx.compose.ui.unit.Dp = 8.dp,
    modifier: Modifier = Modifier,
) {
    FlowRow(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(spacing),
        verticalArrangement = Arrangement.spacedBy(spacing),
    ) {
        interests.forEach { interest ->
            val flagged = flaggedSet.contains(interest.lowercase())
            SectionBadge(
                text = interest,
                color = if (flagged) Color(0xFFE11D48) else interestColor(interest),
                icon = if (flagged) Icons.Filled.Flag else null,
            )
        }
    }
}
