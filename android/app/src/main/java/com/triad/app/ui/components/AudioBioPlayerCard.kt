package com.triad.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GraphicEq
import androidx.compose.material.icons.filled.Pause
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.triad.app.TriadApplication
import com.triad.app.ui.theme.BrandStyle

/** Mirrors iOS `AudioBioPlayerCard`. Streams the audio bio via ExoPlayer. */
@Composable
fun AudioBioPlayerCard(url: String) {
    val context = LocalContext.current
    val appConfig = remember { (context.applicationContext as TriadApplication).appConfig }
    val resolved = remember(url) { appConfig.mediaUrl(url) }

    val player = remember {
        ExoPlayer.Builder(context).build().apply { volume = 1f }
    }
    var isPlaying by remember { mutableStateOf(false) }
    var durationMs by remember { mutableStateOf(0L) }
    var positionMs by remember { mutableStateOf(0L) }

    DisposableEffect(player) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(playing: Boolean) {
                isPlaying = playing
            }

            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY) {
                    durationMs = player.duration.coerceAtLeast(0L)
                }
                if (playbackState == Player.STATE_ENDED) {
                    isPlaying = false
                    player.seekTo(0)
                }
            }
        }
        player.addListener(listener)
        onDispose {
            player.removeListener(listener)
            player.release()
        }
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandStyle.Accent.copy(alpha = 0.07f), RoundedCornerShape(18.dp))
            .border(1.dp, BrandStyle.Accent.copy(alpha = 0.15f), RoundedCornerShape(18.dp))
            .padding(14.dp),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(
            if (isPlaying) Icons.Filled.Pause else Icons.Filled.PlayArrow,
            contentDescription = if (isPlaying) "Pause" else "Play audio bio",
            tint = BrandStyle.Accent,
            modifier = Modifier
                .size(38.dp)
                .clickable {
                    if (isPlaying) {
                        player.pause()
                    } else {
                        if (player.mediaItemCount == 0 && resolved != null) {
                            player.setMediaItem(MediaItem.fromUri(resolved))
                            player.prepare()
                        }
                        player.play()
                    }
                },
        )
        Column(modifier = Modifier.weight(1f)) {
            Text("Audio Bio", style = MaterialTheme.typography.titleSmall, color = BrandStyle.TextPrimary)
            val durationText = formatTime(durationMs)
            val positionText = formatTime(positionMs)
            Text(
                text = if (isPlaying)
                    "Playing $positionText / $durationText"
                else if (durationMs > 0) durationText
                else "Tap to listen",
                style = MaterialTheme.typography.bodySmall,
                color = BrandStyle.TextSecondary,
            )
        }
        Icon(
            Icons.Filled.GraphicEq,
            contentDescription = null,
            tint = if (isPlaying) BrandStyle.Accent else BrandStyle.TextSecondary,
        )
    }
}

private fun formatTime(ms: Long): String {
    if (ms <= 0) return "0:00"
    val total = (ms / 1000).toInt()
    val m = total / 60
    val s = total % 60
    return "%d:%02d".format(m, s)
}
