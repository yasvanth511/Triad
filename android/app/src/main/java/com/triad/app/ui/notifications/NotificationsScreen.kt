package com.triad.app.ui.notifications

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.AppNotification
import com.triad.app.data.AppNotificationType
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()

    val notifications: SnapshotStateList<AppNotification> =
        remember { mutableListOf<AppNotification>().toMutableStateList() }
    var unreadCount by remember { mutableStateOf(0) }
    var isLoading by remember { mutableStateOf(false) }

    suspend fun load() {
        isLoading = true
        try {
            val result = session.loadNotifications()
            notifications.clear()
            notifications.addAll(result.notifications)
            unreadCount = result.unreadCount
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) { load() }

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding(),
        ) {
            TopAppBar(
                title = { Text("Notifications", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (unreadCount > 0) {
                        TextButton(onClick = {
                            scope.launch {
                                try {
                                    session.markAllNotificationsRead()
                                    val updated = notifications.map { it.copy(isRead = true) }
                                    notifications.clear()
                                    notifications.addAll(updated)
                                    unreadCount = 0
                                } catch (t: Throwable) {
                                    session.presentError(t)
                                }
                            }
                        }) { Text("Mark all read", color = BrandStyle.Accent) }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 18.dp),
                verticalArrangement = Arrangement.spacedBy(18.dp),
            ) {
                if (isLoading && notifications.isEmpty()) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                        Text("Loading notifications...", color = BrandStyle.TextSecondary)
                    }
                }

                if (notifications.isNotEmpty()) {
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        SummaryCard(title = "Unread", value = "$unreadCount", subtitle = "Notifications", tint = BrandStyle.Accent, modifier = Modifier.weight(1f))
                        SummaryCard(title = "Total", value = "${notifications.size}", subtitle = "Recent", tint = BrandStyle.Secondary, modifier = Modifier.weight(1f))
                    }
                }

                if (notifications.isEmpty() && !isLoading) {
                    EmptyStateCard(
                        title = "All caught up",
                        message = "Likes, matches, messages, and Impress Me challenges will appear here.",
                    )
                } else {
                    notifications.forEach { notification ->
                        NotificationRow(
                            notification = notification,
                            onClick = {
                                if (!notification.isRead) {
                                    scope.launch {
                                        runCatching { session.markNotificationRead(notification.id) }
                                        val idx = notifications.indexOfFirst { it.id == notification.id }
                                        if (idx >= 0) {
                                            notifications[idx] = notifications[idx].copy(isRead = true)
                                            unreadCount = (unreadCount - 1).coerceAtLeast(0)
                                        }
                                    }
                                }
                                when (notification.type) {
                                    AppNotificationType.LikeReceived -> {
                                        notification.actorId?.let {
                                            navController.navigate(Routes.profileDetail(it))
                                        }
                                    }

                                    AppNotificationType.ImpressMeReceived -> {
                                        notification.actorId?.let {
                                            navController.navigate(
                                                Routes.profileDetail(it, signalId = notification.referenceId),
                                            )
                                        }
                                    }

                                    else -> Unit
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun SummaryCard(
    title: String,
    value: String,
    subtitle: String,
    tint: Color,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier
            .background(tint.copy(alpha = 0.10f), RoundedCornerShape(20.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(title, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        Text(value, style = MaterialTheme.typography.headlineMedium, color = BrandStyle.TextPrimary)
        Text(subtitle, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
    }
}

@Composable
private fun NotificationRow(notification: AppNotification, onClick: () -> Unit) {
    val (icon, tint, statusText) = appearance(notification.type)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .triadCard()
            .clickable(onClick = onClick)
            .let { if (notification.isRead) it else it },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box {
            Icon(
                icon,
                contentDescription = null,
                tint = tint,
                modifier = Modifier
                    .size(38.dp)
                    .background(tint.copy(alpha = 0.10f), RoundedCornerShape(12.dp))
                    .padding(8.dp),
            )
            if (!notification.isRead) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .size(8.dp)
                        .background(BrandStyle.Secondary, CircleShape),
                )
            }
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(verticalAlignment = Alignment.Top) {
                Text(
                    notification.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = BrandStyle.TextPrimary,
                    modifier = Modifier.weight(1f),
                )
                if (!statusText.isNullOrBlank()) {
                    Spacer(Modifier.size(8.dp))
                    SectionBadge(statusText, tint)
                }
            }
            Text(
                notification.body,
                style = MaterialTheme.typography.bodyMedium,
                color = BrandStyle.TextSecondary,
                maxLines = 2,
            )
            Text(
                Dates.abbreviatedDateTime(notification.createdAt),
                style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary,
            )
        }
    }
}

private fun appearance(type: AppNotificationType): Triple<ImageVector, Color, String?> = when (type) {
    AppNotificationType.LikeReceived -> Triple(Icons.Filled.Favorite, BrandStyle.Secondary, "Like")
    AppNotificationType.MatchCreated -> Triple(Icons.Filled.PersonAdd, BrandStyle.Accent, "Match")
    AppNotificationType.MessageReceived -> Triple(Icons.AutoMirrored.Filled.Chat, Color(0xFF3B82F6), "Message")
    AppNotificationType.ImpressMeReceived -> Triple(Icons.Filled.AutoAwesome, BrandStyle.Accent, "Challenge")
    AppNotificationType.Unknown -> Triple(Icons.Filled.Notifications, BrandStyle.TextSecondary, null)
}
