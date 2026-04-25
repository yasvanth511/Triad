package com.triad.app.ui.impressme

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.FormatQuote
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.triad.app.data.ImpressMeFlow
import com.triad.app.data.ImpressMeSignal
import com.triad.app.data.ImpressMeStatus
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates

enum class ImpressMeRole { Sender, Receiver }

@Composable
fun ImpressMeSignalCard(
    signal: ImpressMeSignal,
    role: ImpressMeRole,
    onClick: () -> Unit,
) {
    val otherUsername = if (role == ImpressMeRole.Receiver) signal.senderUsername else signal.receiverUsername
    val otherPhoto = if (role == ImpressMeRole.Receiver) signal.senderPhotoUrl else signal.receiverPhotoUrl
    val isExpired = Dates.isExpired(signal.expiresAt) || signal.status == ImpressMeStatus.Expired
    val hoursLeft = Dates.hoursRemaining(signal.expiresAt)

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .triadCard()
            .clickable(onClick = onClick),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Avatar(otherPhoto)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(otherUsername, style = MaterialTheme.typography.titleSmall, color = BrandStyle.TextPrimary)
                    SectionBadge(
                        if (signal.flow == ImpressMeFlow.PreMatch) "Pre-match" else "Post-match",
                        if (signal.flow == ImpressMeFlow.PreMatch) BrandStyle.Secondary else BrandStyle.Accent,
                    )
                }
                Text(signal.status.displayLabel, style = MaterialTheme.typography.labelMedium,
                    color = statusColor(signal.status))
            }
            if (!isExpired && !signal.status.isTerminal) {
                TimerBadge(hoursLeft)
            }
        }

        // Prompt preview
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(BrandStyle.Accent.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
                .padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(Icons.Filled.AutoAwesome, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
                Text(signal.prompt.category, style = MaterialTheme.typography.labelMedium, color = BrandStyle.Accent)
            }
            Text(
                signal.prompt.promptText,
                style = MaterialTheme.typography.bodyMedium,
                color = BrandStyle.TextPrimary,
                maxLines = 3,
            )
        }

        // Sender side: response preview
        if (role == ImpressMeRole.Sender && signal.response != null) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BrandStyle.Secondary.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
                    .padding(12.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Filled.FormatQuote, null, tint = BrandStyle.Secondary, modifier = Modifier.size(14.dp))
                    Text("Their answer", style = MaterialTheme.typography.labelMedium, color = BrandStyle.Secondary)
                }
                Text(
                    signal.response.textContent,
                    style = MaterialTheme.typography.bodyMedium,
                    color = BrandStyle.TextPrimary,
                    maxLines = 4,
                )
            }
        }

        when {
            role == ImpressMeRole.Receiver && signal.status == ImpressMeStatus.Sent -> {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
                    Text("View profile & reply", style = MaterialTheme.typography.labelLarge, color = BrandStyle.Accent)
                }
            }

            role == ImpressMeRole.Sender &&
                (signal.status == ImpressMeStatus.Responded || signal.status == ImpressMeStatus.Viewed) -> {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Filled.Visibility, null, tint = BrandStyle.Secondary, modifier = Modifier.size(14.dp))
                    Text("Review their answer", style = MaterialTheme.typography.labelLarge, color = BrandStyle.Secondary)
                }
            }
        }
        Spacer(Modifier.size(0.dp))
    }
}

@Composable
private fun statusColor(status: ImpressMeStatus): Color = when (status) {
    ImpressMeStatus.Responded -> Color(0xFFF59E0B)
    ImpressMeStatus.Accepted -> Color(0xFF10B981)
    ImpressMeStatus.Declined -> Color(0xFFEF4444)
    else -> BrandStyle.TextSecondary
}

@Composable
private fun Avatar(url: String?) {
    if (url != null) {
        Box(
            modifier = Modifier
                .size(46.dp)
                .background(Color.White, CircleShape),
        ) {
            RemoteMediaView(path = url, height = 46.dp, cornerRadius = 23.dp)
        }
    } else {
        Box(
            modifier = Modifier
                .size(46.dp)
                .background(BrandStyle.Accent.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Person, null, tint = BrandStyle.Accent)
        }
    }
}

@Composable
private fun TimerBadge(hoursLeft: Int) {
    val tint = if (hoursLeft < 6) Color(0xFFEF4444) else BrandStyle.TextSecondary
    Row(
        modifier = Modifier
            .background(tint.copy(alpha = 0.10f), CircleShape)
            .padding(horizontal = 8.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Icon(Icons.Filled.AccessTime, null, tint = tint, modifier = Modifier.size(12.dp))
        Text("${hoursLeft}h", style = MaterialTheme.typography.labelSmall, color = tint)
    }
}
