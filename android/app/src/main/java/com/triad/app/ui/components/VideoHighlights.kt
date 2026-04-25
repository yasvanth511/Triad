package com.triad.app.ui.components

import android.app.Activity
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.media3.common.MediaItem
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import com.triad.app.TriadApplication
import com.triad.app.data.ProfileVideo
import com.triad.app.ui.theme.BrandStyle

/** iOS `VideoHighlightsView` (Stories-style horizontal bubbles). */
@Composable
fun VideoHighlights(
    videos: List<ProfileVideo>,
    fallbackImagePath: String?,
    titlePrefix: String = "Clip",
) {
    val ordered = remember(videos) { videos.sortedWith(compareBy({ it.sortOrder }, { it.id })) }
    var activePath by remember { mutableStateOf<String?>(null) }

    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ordered.forEachIndexed { index, video ->
            VideoHighlightBubble(
                title = "$titlePrefix ${index + 1}",
                fallbackImagePath = fallbackImagePath,
                onTap = { activePath = video.url },
            )
        }
    }

    if (activePath != null) {
        VideoPlayerDialog(path = activePath!!) {
            activePath = null
        }
    }
}

@Composable
private fun VideoHighlightBubble(
    title: String,
    fallbackImagePath: String?,
    onTap: () -> Unit,
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.clickable(onClick = onTap),
    ) {
        Box(modifier = Modifier.size(82.dp), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(82.dp)
                    .background(
                        Brush.linearGradient(listOf(BrandStyle.Secondary, BrandStyle.Accent)),
                        CircleShape,
                    ),
            )
            Box(
                modifier = Modifier
                    .size(74.dp)
                    .background(Color.White.copy(alpha = 0.92f), CircleShape),
            )
            Box(
                Modifier
                    .size(68.dp)
                    .clip(CircleShape),
            ) {
                if (fallbackImagePath != null) {
                    RemoteMediaView(
                        path = fallbackImagePath,
                        height = 68.dp,
                        cornerRadius = 0.dp,
                    )
                } else {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        BrandStyle.Secondary.copy(alpha = 0.3f),
                                        BrandStyle.Accent.copy(alpha = 0.2f),
                                    ),
                                ),
                            ),
                    )
                }
            }
            Box(
                modifier = Modifier
                    .size(26.dp)
                    .background(Color.Black.copy(alpha = 0.45f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.PlayArrow, contentDescription = null, tint = Color.White)
            }
        }
        Text(title, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextPrimary)
    }
}

/** Full-screen video player dialog mirroring iOS `VideoPlayerSheet`. */
@Composable
fun VideoPlayerDialog(path: String, onDismiss: () -> Unit) {
    val context = LocalContext.current
    val appConfig = remember { (context.applicationContext as TriadApplication).appConfig }
    val resolved = remember(path) { appConfig.mediaUrl(path) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false),
    ) {
        val player = remember {
            ExoPlayer.Builder(context).build().apply {
                resolved?.let {
                    setMediaItem(MediaItem.fromUri(it))
                    prepare()
                    playWhenReady = true
                }
            }
        }
        DisposableEffect(player) { onDispose { player.release() } }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
        ) {
            AndroidView(
                modifier = Modifier.fillMaxSize(),
                factory = { ctx ->
                    PlayerView(ctx).apply { this.player = player }
                },
            )
            Icon(
                Icons.Filled.Close,
                contentDescription = "Close",
                tint = Color.White.copy(alpha = 0.85f),
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(16.dp)
                    .size(30.dp)
                    .clickable(onClick = onDismiss),
            )
        }
    }
}

@Suppress("unused")
private fun activityFromContext(context: android.content.Context): Activity? {
    var c = context
    while (c is android.content.ContextWrapper) {
        if (c is Activity) return c
        c = c.baseContext
    }
    return null
}
