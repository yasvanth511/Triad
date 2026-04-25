package com.triad.app.ui.discover

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
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
import com.triad.app.core.location.rememberTriadLocationPermissionState
import com.triad.app.data.DiscoveryCard
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.DiscoverActionButton
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.InterestBadgeList
import com.triad.app.ui.components.PhotoCarouselView
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import kotlinx.coroutines.launch

private enum class Audience(val label: String, val apiValue: String?) {
    All("All", null),
    Singles("Singles", "single"),
    Couples("Couples", "couple"),
}

@Composable
fun DiscoverScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val currentUser by session.currentUser.collectAsState()
    val viewerRedFlags = remember(currentUser) {
        (currentUser?.redFlags ?: emptyList()).map { it.lowercase() }.toSet()
    }
    val scope = rememberCoroutineScope()
    val location = rememberTriadLocationPermissionState()

    var audience by remember { mutableStateOf(Audience.All) }
    val cards: SnapshotStateList<DiscoveryCard> = remember { mutableListOf<DiscoveryCard>().toMutableStateList() }
    var isLoading by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf<String?>(null) }
    var inFlightUserId by remember { mutableStateOf<String?>(null) }
    var inFlightAction by remember { mutableStateOf<String?>(null) }

    suspend fun reload() {
        isLoading = true
        try {
            val result = session.loadDiscovery(audience.apiValue)
            cards.clear()
            cards.addAll(result)
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(audience) { reload() }

    ScreenContainer(title = "Discover") {
        Column(
            modifier = Modifier.triadCard(),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Text("Audience", style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
            SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                Audience.values().forEachIndexed { index, current ->
                    SegmentedButton(
                        selected = audience == current,
                        onClick = { audience = current },
                        shape = SegmentedButtonDefaults.itemShape(
                            index = index,
                            count = Audience.values().size,
                        ),
                    ) {
                        Text(current.label)
                    }
                }
            }
        }

        if (!location.isAuthorized) {
            Column(
                modifier = Modifier.triadCard(),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("Location Permission", style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
                        Text(location.statusDescription, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.TextSecondary)
                    }
                    Button(
                        onClick = { location.onRequest() },
                        colors = ButtonDefaults.buttonColors(containerColor = BrandStyle.Accent, contentColor = Color.White),
                    ) { Text("Enable") }
                }
                Text(
                    "Triad uses your coarse location for nearby discovery and events.",
                    style = MaterialTheme.typography.bodySmall,
                    color = BrandStyle.TextSecondary,
                )
            }
        }

        if (isLoading) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading people nearby...", color = BrandStyle.TextSecondary)
            }
        }

        notice?.let { EmptyStateCard(title = "Update", message = it) }

        if (cards.isEmpty() && !isLoading) {
            EmptyStateCard(
                title = "No profiles right now",
                message = "Try a different audience filter or refresh after seeding more users.",
            )
        } else {
            cards.forEach { card ->
                Column(
                    modifier = Modifier.triadCard(),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    Column(
                        modifier = Modifier.clickable {
                            navController.navigate(Routes.profileDetail(card.userId))
                        },
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                    ) {
                        PhotoCarouselView(photos = card.photos, height = 220.dp)

                        Row {
                            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                                Text(card.username, style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
                                Text(
                                    "${card.ageMin}-${card.ageMax} | ${card.intent.replaceFirstChar { it.uppercase() }}",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = BrandStyle.TextSecondary,
                                )
                            }
                            Column(verticalArrangement = Arrangement.spacedBy(6.dp), horizontalAlignment = Alignment.End) {
                                SectionBadge(
                                    if (card.isCouple) "Couple" else "Single",
                                    if (card.isCouple) BrandStyle.Secondary else BrandStyle.Accent,
                                )
                                val flagged = card.interests.count { viewerRedFlags.contains(it.lowercase()) }
                                if (flagged > 0) {
                                    SectionBadge(
                                        "$flagged Red Flag${if (flagged == 1) "" else "s"}",
                                        Color(0xFFE11D48),
                                    )
                                }
                            }
                        }

                        Text(
                            text = if (card.bio.isBlank()) "No bio yet." else card.bio,
                            style = MaterialTheme.typography.bodyMedium,
                            color = BrandStyle.TextPrimary,
                        )

                        Row(
                            modifier = Modifier.horizontalScroll(rememberScrollState()),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            val location = listOf(card.city, card.state).filter { it.isNotEmpty() }
                            if (location.isNotEmpty()) {
                                SectionBadge(location.joinToString(", "), Color(0xFF3B82F6))
                            }
                            card.approximateDistanceKm?.let { d ->
                                SectionBadge("${d.toInt()} km away", BrandStyle.Accent)
                            }
                        }

                        if (card.interests.isNotEmpty()) {
                            InterestBadgeList(card.interests, viewerRedFlags)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.End,
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                "View full profile",
                                style = MaterialTheme.typography.labelLarge,
                                color = BrandStyle.Accent,
                            )
                            Spacer(modifier = Modifier.padding(end = 4.dp))
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = BrandStyle.Accent)
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                    ) {
                        DiscoverActionButton(
                            icon = Icons.Filled.Close,
                            tint = BrandStyle.TextSecondary,
                            background = Color.White.copy(alpha = 0.75f),
                            contentDescription = "Skip profile",
                            onClick = {
                                cards.removeAll { it.userId == card.userId }
                                notice = null
                            },
                        )
                        DiscoverActionButton(
                            icon = Icons.Filled.Bookmark,
                            tint = Color.White,
                            background = BrandStyle.Accent,
                            contentDescription = "Save profile",
                            enabled = inFlightUserId != card.userId,
                            onClick = {
                                inFlightUserId = card.userId
                                inFlightAction = "save"
                                scope.launch {
                                    try {
                                        session.saveProfile(card.userId)
                                        cards.removeAll { it.userId == card.userId }
                                        notice = "${card.username} was saved for later."
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        inFlightUserId = null
                                        inFlightAction = null
                                    }
                                }
                            },
                            overlay = {
                                if (inFlightUserId == card.userId && inFlightAction == "save") {
                                    CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp)
                                }
                            },
                        )
                        DiscoverActionButton(
                            icon = Icons.Filled.Favorite,
                            tint = Color.White,
                            background = BrandStyle.Secondary,
                            contentDescription = "Like profile",
                            enabled = inFlightUserId != card.userId,
                            onClick = {
                                inFlightUserId = card.userId
                                inFlightAction = "like"
                                scope.launch {
                                    try {
                                        val result = session.like(card.userId)
                                        cards.removeAll { it.userId == card.userId }
                                        notice = if (result.matched)
                                            "You matched with ${card.username}."
                                        else "Like sent to ${card.username}."
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        inFlightUserId = null
                                        inFlightAction = null
                                    }
                                }
                            },
                            overlay = {
                                if (inFlightUserId == card.userId && inFlightAction == "like") {
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
