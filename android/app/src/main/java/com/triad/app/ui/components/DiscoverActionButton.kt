package com.triad.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp

/** Mirrors iOS `DiscoverActionButton` (skip / save / like circle button). */
@Composable
fun DiscoverActionButton(
    icon: ImageVector,
    tint: Color,
    background: Color,
    contentDescription: String,
    enabled: Boolean = true,
    onClick: () -> Unit,
    overlay: @Composable (() -> Unit)? = null,
) {
    Box(
        Modifier
            .size(62.dp)
            .shadow(8.dp, CircleShape)
            .background(background, CircleShape)
            .border(BorderStroke(1.dp, Color.White.copy(alpha = 0.55f)), CircleShape)
            .clickable(enabled = enabled, onClick = onClick)
            .semantics { this.contentDescription = contentDescription },
        contentAlignment = Alignment.Center,
    ) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(24.dp))
        overlay?.invoke()
    }
}
