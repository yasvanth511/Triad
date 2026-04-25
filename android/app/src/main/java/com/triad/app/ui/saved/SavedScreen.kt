package com.triad.app.ui.saved

import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
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
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.SavedProfileItem
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.DiscoverActionButton
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@Composable
fun SavedScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()

    val items: SnapshotStateList<SavedProfileItem> =
        remember { mutableListOf<SavedProfileItem>().toMutableStateList() }
    var isLoading by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf<String?>(null) }
    var inFlightUserId by remember { mutableStateOf<String?>(null) }
    var inFlightAction by remember { mutableStateOf<String?>(null) }

    suspend fun reload() {
        isLoading = true
        try {
            val result = session.loadSavedProfiles()
            items.clear()
            items.addAll(result)
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) { reload() }

    ScreenContainer(title = "Saved") {
        if (isLoading && items.isEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading saved profiles...", color = BrandStyle.TextSecondary)
            }
        }

        notice?.let { EmptyStateCard("Update", it) }

        if (items.isEmpty() && !isLoading) {
            EmptyStateCard(
                title = "Nothing saved yet",
                message = "Bookmarks from Discover will land here so you can revisit them later.",
            )
        } else {
            items.forEach { profile ->
                Column(
                    modifier = Modifier.triadCard(),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Column(
                        modifier = Modifier.clickable {
                            navController.navigate(Routes.profileDetail(profile.userId))
                        },
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        RemoteMediaView(path = profile.photos.firstOrNull()?.url, height = 220.dp)

                        Row {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(profile.username, style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
                                Text(
                                    "${profile.ageMin}-${profile.ageMax} | ${profile.intent.replaceFirstChar { it.uppercase() }}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = BrandStyle.TextSecondary,
                                )
                            }
                            SectionBadge(
                                if (profile.isCouple) "Couple" else "Single",
                                if (profile.isCouple) BrandStyle.Secondary else BrandStyle.Accent,
                            )
                        }

                        Text(
                            if (profile.bio.isBlank()) "No bio yet." else profile.bio,
                            style = MaterialTheme.typography.bodyMedium,
                            color = BrandStyle.TextPrimary,
                        )

                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            SectionBadge("Saved ${Dates.abbreviated(profile.savedAt)}", BrandStyle.Accent)
                            val location = listOf(profile.city, profile.state).filter { it.isNotEmpty() }
                            if (location.isNotEmpty()) {
                                SectionBadge(location.joinToString(", "), Color(0xFF3B82F6))
                            }
                            profile.approximateDistanceKm?.let { d ->
                                SectionBadge("${d.toInt()} km away", BrandStyle.TextSecondary)
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text("View full profile", style = MaterialTheme.typography.labelLarge, color = BrandStyle.Accent)
                            Spacer(Modifier.padding(end = 4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = BrandStyle.Accent)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                    ) {
                        DiscoverActionButton(
                            icon = Icons.Filled.BookmarkBorder,
                            tint = BrandStyle.TextPrimary,
                            background = Color.White.copy(alpha = 0.78f),
                            contentDescription = "Remove saved profile",
                            enabled = inFlightUserId != profile.userId,
                            onClick = {
                                inFlightUserId = profile.userId
                                inFlightAction = "remove"
                                scope.launch {
                                    try {
                                        session.removeSavedProfile(profile.userId)
                                        items.removeAll { it.userId == profile.userId }
                                        notice = "${profile.username} was removed from saved profiles."
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        inFlightUserId = null
                                        inFlightAction = null
                                    }
                                }
                            },
                            overlay = {
                                if (inFlightUserId == profile.userId && inFlightAction == "remove") {
                                    CircularProgressIndicator(color = BrandStyle.TextPrimary, strokeWidth = 2.dp)
                                }
                            },
                        )
                        DiscoverActionButton(
                            icon = Icons.Filled.Favorite,
                            tint = Color.White,
                            background = BrandStyle.Secondary,
                            contentDescription = "Like saved profile",
                            enabled = inFlightUserId != profile.userId,
                            onClick = {
                                inFlightUserId = profile.userId
                                inFlightAction = "like"
                                scope.launch {
                                    try {
                                        val result = session.like(profile.userId)
                                        items.removeAll { it.userId == profile.userId }
                                        notice = if (result.matched)
                                            "You matched with ${profile.username}."
                                        else "Like sent to ${profile.username}."
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        inFlightUserId = null
                                        inFlightAction = null
                                    }
                                }
                            },
                            overlay = {
                                if (inFlightUserId == profile.userId && inFlightAction == "like") {
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp)
                                }
                            },
                        )
                    }
                }
            }
        }
    }
}
