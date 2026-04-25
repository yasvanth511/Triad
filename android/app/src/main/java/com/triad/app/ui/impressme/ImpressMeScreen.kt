package com.triad.app.ui.impressme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.ImpressMeInbox
import com.triad.app.data.ImpressMeStatus
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import kotlinx.coroutines.launch

private enum class InboxTab { Received, Sent }

@Composable
fun ImpressMeScreen(navController: NavController) {
    val session = LocalSessionStore.current

    var inbox by remember { mutableStateOf<ImpressMeInbox?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var tab by remember { mutableStateOf(InboxTab.Received) }
    suspend fun load() {
        isLoading = true
        try {
            inbox = session.getImpressMeInbox()
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) { load() }

    ScreenContainer(title = "Impress Me") {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color.White.copy(alpha = 0.38f), RoundedCornerShape(14.dp))
                .border(1.dp, BrandStyle.CardBorder, RoundedCornerShape(14.dp))
                .padding(4.dp),
        ) {
            TabPill(
                title = "Received",
                badge = inbox?.unreadCount ?: 0,
                selected = tab == InboxTab.Received,
                onClick = { tab = InboxTab.Received },
            )
            TabPill(
                title = "Sent",
                badge = inbox?.sentNeedsReviewCount ?: 0,
                selected = tab == InboxTab.Sent,
                onClick = { tab = InboxTab.Sent },
            )
        }

        if (isLoading && inbox == null) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading signals…", color = BrandStyle.TextSecondary)
            }
        } else if (tab == InboxTab.Received) {
            val items = inbox?.received.orEmpty()
            if (items.isEmpty() && !isLoading) {
                EmptyStateCard(
                    title = "No signals yet",
                    message = "When someone sends you an Impress Me, it shows up here.",
                )
            } else {
                items.forEach { signal ->
                    ImpressMeSignalCard(
                        signal = signal,
                        role = ImpressMeRole.Receiver,
                        onClick = {
                            navController.navigate(
                                Routes.profileDetail(signal.senderId, signalId = signal.id),
                            )
                        },
                    )
                }
            }
        } else {
            val items = inbox?.sent.orEmpty()
            if (items.isEmpty() && !isLoading) {
                EmptyStateCard(
                    title = "Nothing sent yet",
                    message = "Send an Impress Me from any profile to start a challenge.",
                )
            } else {
                items.forEach { signal ->
                    ImpressMeSignalCard(
                        signal = signal,
                        role = ImpressMeRole.Sender,
                        onClick = {
                            if (signal.status == ImpressMeStatus.Responded ||
                                signal.status == ImpressMeStatus.Viewed
                            ) {
                                navController.navigate(Routes.impressMeReview(signal.id))
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.TabPill(
    title: String,
    badge: Int,
    selected: Boolean,
    onClick: () -> Unit,
) {
    Row(
        modifier = Modifier
            .weight(1f)
            .background(
                if (selected) Brush.horizontalGradient(listOf(BrandStyle.Accent, BrandStyle.Secondary))
                else Brush.horizontalGradient(listOf(Color.Transparent, Color.Transparent)),
                RoundedCornerShape(10.dp),
            )
            .clickable(onClick = onClick)
            .padding(vertical = 9.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            title,
            color = if (selected) Color.White else BrandStyle.TextSecondary,
            style = MaterialTheme.typography.titleSmall,
        )
        if (badge > 0) {
            Row(
                modifier = Modifier
                    .padding(start = 6.dp)
                    .background(if (selected) Color.White else BrandStyle.Accent, CircleShape)
                    .padding(horizontal = 6.dp, vertical = 2.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    badge.toString(),
                    color = if (selected) BrandStyle.Accent else Color.White,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}
