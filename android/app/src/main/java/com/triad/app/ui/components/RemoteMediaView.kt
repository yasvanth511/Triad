package com.triad.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Image
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.triad.app.TriadApplication
import com.triad.app.ui.theme.BrandStyle

/**
 * Mirrors iOS `RemoteMediaView`. Resolves relative server paths against
 * `AppConfig.originBaseUrl`, supports `data:` URIs and absolute URLs,
 * and clips to a 22dp rounded rectangle.
 */
@Composable
fun RemoteMediaView(
    path: String?,
    height: Dp,
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 22.dp,
    placeholderIcon: ImageVector = Icons.Filled.Image,
) {
    val context = LocalContext.current
    val appConfig = remember { (context.applicationContext as TriadApplication).appConfig }
    val resolved = remember(path) { appConfig.mediaUrl(path) }

    Box(
        modifier
            .fillMaxWidth()
            .height(height)
            .clip(RoundedCornerShape(cornerRadius)),
        contentAlignment = Alignment.Center,
    ) {
        if (resolved.isNullOrBlank()) {
            placeholder(placeholderIcon)
        } else {
            AsyncImage(
                model = resolved,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop,
                onError = { /* Coil keeps placeholder. */ },
            )
        }
    }
}

@Composable
private fun placeholder(icon: ImageVector) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.linearGradient(
                    listOf(
                        BrandStyle.Accent.copy(alpha = 0.22f),
                        BrandStyle.Secondary.copy(alpha = 0.18f),
                    ),
                ),
            ),
        contentAlignment = Alignment.Center,
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = BrandStyle.TextSecondary,
        )
    }
}
