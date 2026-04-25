package com.triad.app.ui.events

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
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
import com.triad.app.data.EventItem
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@Composable
fun EventsScreen() {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()
    val currentUser by session.currentUser.collectAsState()

    val events: SnapshotStateList<EventItem> =
        remember { mutableListOf<EventItem>().toMutableStateList() }
    var isLoading by remember { mutableStateOf(false) }
    var activeEventId by remember { mutableStateOf<String?>(null) }

    suspend fun reload() {
        isLoading = true
        try {
            val result = session.loadEvents()
            events.clear()
            events.addAll(result)
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(Unit) { reload() }

    val nearby = events.filter { it.distanceKm != null }
    val others = events.filter { it.distanceKm == null }
    val userHasLocation = currentUser?.let { it.radiusMiles != null } == true

    ScreenContainer(title = "Events") {
        if (isLoading && events.isEmpty()) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading nearby events...", color = BrandStyle.TextSecondary)
            }
        }

        if (events.isEmpty() && !isLoading) {
            EmptyStateCard(
                title = "No events are available.",
                message = "Check back later or expand your radius in Edit Profile.",
            )
        } else {
            // Per task spec: when nearby is empty but the user has a radius, surface
            // "No events are available nearby." and list any radius-bypass events that
            // were returned. Backend `/api/event` filters by radius when set.
            if (userHasLocation && nearby.isEmpty()) {
                EmptyStateCard(
                    title = "No events are available nearby.",
                    message = "Showing events further out so you don't miss anything.",
                )
            }

            (if (userHasLocation) nearby else events).forEach { event ->
                EventCard(
                    event = event,
                    isToggling = activeEventId == event.id,
                    onToggle = {
                        scope.launch {
                            activeEventId = event.id
                            try {
                                val response = session.toggleInterest(event.id)
                                val idx = events.indexOfFirst { it.id == event.id }
                                if (idx >= 0) {
                                    events[idx] = events[idx].copy(
                                        interestedCount = response.interestedCount,
                                        isInterested = response.isInterested,
                                    )
                                }
                            } catch (t: Throwable) {
                                session.presentError(t)
                            } finally {
                                activeEventId = null
                            }
                        }
                    },
                )
            }

            if (userHasLocation && nearby.isEmpty() && others.isNotEmpty()) {
                others.forEach { event ->
                    EventCard(
                        event = event,
                        isToggling = activeEventId == event.id,
                        onToggle = {
                            scope.launch {
                                activeEventId = event.id
                                try {
                                    val response = session.toggleInterest(event.id)
                                    val idx = events.indexOfFirst { it.id == event.id }
                                    if (idx >= 0) {
                                        events[idx] = events[idx].copy(
                                            interestedCount = response.interestedCount,
                                            isInterested = response.isInterested,
                                        )
                                    }
                                } catch (t: Throwable) {
                                    session.presentError(t)
                                } finally {
                                    activeEventId = null
                                }
                            }
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun EventCard(event: EventItem, isToggling: Boolean, onToggle: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        RemoteMediaView(path = event.bannerUrl, height = 180.dp)

        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(event.title, style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
            Text(event.description, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.TextSecondary)
        }

        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            SectionBadge(Dates.abbreviatedDateTime(event.eventDate), BrandStyle.Accent)
            if (event.city.isNotEmpty() || event.state.isNotEmpty()) {
                SectionBadge(listOf(event.city, event.state).filter { it.isNotEmpty() }.joinToString(", "), Color(0xFF3B82F6))
            }
            event.distanceKm?.let { d ->
                SectionBadge("${d.toInt()} km", BrandStyle.Secondary)
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(event.venue, style = MaterialTheme.typography.titleSmall, color = BrandStyle.TextPrimary)
                Text(
                    "${event.interestedCount} people interested",
                    style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary,
                )
            }
            Button(
                onClick = onToggle,
                enabled = !isToggling,
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (event.isInterested) BrandStyle.Secondary else BrandStyle.Accent,
                    contentColor = Color.White,
                ),
            ) {
                if (isToggling) {
                    CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White)
                    Spacer(Modifier.height(8.dp))
                }
                Text(if (event.isInterested) "Interested" else "Join")
            }
        }
    }
}
