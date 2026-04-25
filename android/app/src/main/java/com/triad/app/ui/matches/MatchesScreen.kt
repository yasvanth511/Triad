package com.triad.app.ui.matches

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.snapshots.SnapshotStateList
import androidx.compose.runtime.toMutableStateList
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.MatchItem
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates

@Composable
fun MatchesScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val matches: SnapshotStateList<MatchItem> =
        remember { mutableListOf<MatchItem>().toMutableStateList() }
    var isLoading by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        isLoading = true
        try {
            val result = session.loadMatches()
            matches.clear()
            matches.addAll(result)
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    ScreenContainer(title = "Matches") {
        if (isLoading && matches.isEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading your matches...", color = BrandStyle.TextSecondary)
            }
        }

        if (matches.isEmpty() && !isLoading) {
            EmptyStateCard(
                title = "No matches yet",
                message = "Likes that become mutual matches will show up here.",
            )
        } else {
            matches.forEach { match ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .triadCard()
                        .clickable { navController.navigate(Routes.matchChat(match.matchId)) },
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Row(verticalAlignment = Alignment.Top) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                participantNames(match),
                                style = MaterialTheme.typography.titleMedium,
                                color = BrandStyle.TextPrimary,
                            )
                            Text(
                                Dates.abbreviatedDateTime(match.matchedAt),
                                style = MaterialTheme.typography.bodyMedium,
                                color = BrandStyle.TextSecondary,
                            )
                        }
                        SectionBadge(
                            if (match.isGroupChat) "Group" else "Direct",
                            if (match.isGroupChat) BrandStyle.Secondary else BrandStyle.Accent,
                        )
                    }

                    val primaryPhoto = match.participants.firstOrNull()?.photos?.firstOrNull()?.url
                    if (!primaryPhoto.isNullOrBlank()) {
                        RemoteMediaView(path = primaryPhoto, height = 180.dp)
                    }

                    match.participants.forEach { participant ->
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                participant.username,
                                style = MaterialTheme.typography.titleSmall,
                                color = BrandStyle.TextPrimary,
                            )
                            Text(
                                if (participant.bio.isBlank()) "No bio yet." else participant.bio,
                                style = MaterialTheme.typography.bodySmall,
                                color = BrandStyle.TextSecondary,
                                maxLines = 3,
                            )
                        }
                    }
                }
            }
        }
    }
}

private fun participantNames(match: MatchItem): String =
    match.participants.joinToString(", ") { it.username }.ifBlank { "Unknown match" }
