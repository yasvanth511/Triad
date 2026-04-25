package com.triad.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.QuestionAnswer
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.ImpressMeSignal
import com.triad.app.data.ImpressMeStatus
import com.triad.app.data.UserProfile
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.InterestBadgeList
import com.triad.app.ui.components.PhotoCarouselView
import com.triad.app.ui.components.ProfileActionRow
import com.triad.app.ui.components.ProfileInfoRow
import com.triad.app.ui.components.ProfileMetricTile
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.components.SectionHeader
import com.triad.app.ui.components.VideoHighlights
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.ui.theme.triadCard
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileDetailScreen(
    navController: NavController,
    userId: String,
    receivedImpressMeSignalId: String? = null,
) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()
    val currentUser by session.currentUser.collectAsState()
    val viewerRedFlags = remember(currentUser) {
        (currentUser?.redFlags ?: emptyList()).map { it.lowercase() }.toSet()
    }

    var profile by remember { mutableStateOf<UserProfile?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf<String?>(null) }
    var receivedSignal by remember { mutableStateOf<ImpressMeSignal?>(null) }
    val outgoingSignals: SnapshotStateList<ImpressMeSignal> =
        remember { mutableListOf<ImpressMeSignal>().toMutableStateList() }
    var isSendingImpressMe by remember { mutableStateOf(false) }
    var showReportSheet by remember { mutableStateOf(false) }
    var showBlockConfirm by remember { mutableStateOf(false) }
    var isBlocking by remember { mutableStateOf(false) }

    val isViewingReceivedSignal = receivedImpressMeSignalId != null
    val pendingSentSignal = outgoingSignals
        .filter { it.status == ImpressMeStatus.Sent && !Dates.isExpired(it.expiresAt) }
        .maxByOrNull { it.createdAt }

    LaunchedEffect(userId, receivedImpressMeSignalId) {
        isLoading = true
        try {
            profile = session.loadProfile(userId)
            if (receivedImpressMeSignalId != null) {
                receivedSignal = session.getImpressMeSignal(receivedImpressMeSignalId)
            } else {
                val inbox = session.getImpressMeInbox()
                outgoingSignals.clear()
                outgoingSignals.addAll(inbox.sent.filter { it.receiverId == userId })
            }
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()) {
            TopAppBar(
                title = { Text("Profile", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
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
                if (isLoading && profile == null) {
                    Row(verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                        Text("Loading profile...", color = BrandStyle.TextSecondary)
                    }
                }

                notice?.let { EmptyStateCard("Update", it) }

                val current = profile
                if (current != null) {
                    HeaderCard(current, viewerRedFlags)
                    DetailsCard(current)
                    InterestsCard(current, viewerRedFlags)
                    DatingPreferencesCardForOther(current)

                    if (isViewingReceivedSignal) {
                        ReceivedImpressMeCard(
                            profile = current,
                            signal = receivedSignal,
                            onReply = { signal ->
                                navController.navigate(Routes.impressMeRespond(signal.id))
                            },
                        )
                    } else {
                        Column(
                            modifier = Modifier.fillMaxWidth().triadCard(),
                            verticalArrangement = Arrangement.spacedBy(14.dp),
                        ) {
                            SectionHeader(
                                "Impress Me",
                                "Send a playful challenge shaped by this profile's interests.",
                            )
                            Button(
                                onClick = {
                                    isSendingImpressMe = true
                                    scope.launch {
                                        try {
                                            session.sendImpressMe(current.id, null)
                                            val inbox = session.getImpressMeInbox()
                                            outgoingSignals.clear()
                                            outgoingSignals.addAll(
                                                inbox.sent.filter { it.receiverId == current.id },
                                            )
                                            notice = "Impress Me sent to ${current.username}. Check Sent once they reply."
                                        } catch (t: Throwable) {
                                            val msg = t.localizedMessage ?: ""
                                            if (msg.contains("pending impress me", ignoreCase = true)) {
                                                val inbox = session.getImpressMeInbox()
                                                outgoingSignals.clear()
                                                outgoingSignals.addAll(
                                                    inbox.sent.filter { it.receiverId == current.id },
                                                )
                                                notice = "You already sent ${current.username} an Impress Me challenge. Waiting for their reply."
                                            } else {
                                                session.presentError(t)
                                            }
                                        } finally {
                                            isSendingImpressMe = false
                                        }
                                    }
                                },
                                enabled = !isSendingImpressMe && pendingSentSignal == null,
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(BrandStyle.AccentGradient, RoundedCornerShape(22.dp)),
                                shape = RoundedCornerShape(22.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color.Transparent,
                                    contentColor = Color.White,
                                    disabledContainerColor = Color.Transparent,
                                    disabledContentColor = Color.White,
                                ),
                            ) {
                                if (isSendingImpressMe) {
                                    CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                                        modifier = Modifier.size(18.dp))
                                    Spacer(Modifier.size(8.dp))
                                }
                                if (pendingSentSignal != null) {
                                    Icon(Icons.Filled.Send, null, tint = Color.White)
                                    Spacer(Modifier.size(8.dp))
                                    Text("Challenge Sent", color = Color.White)
                                } else {
                                    Icon(Icons.Filled.AutoAwesome, null, tint = Color.White)
                                    Spacer(Modifier.size(8.dp))
                                    Text("Impress Me âœ¨", color = Color.White)
                                }
                            }

                            Text(
                                if (pendingSentSignal != null)
                                    "You already sent ${current.username} an Impress Me challenge. Waiting for their reply in Sent."
                                else "They'll get a personalised prompt to reply to. You decide if it's a match.",
                                style = MaterialTheme.typography.labelMedium,
                                color = BrandStyle.TextSecondary,
                                modifier = Modifier.fillMaxWidth(),
                            )
                        }
                    }

                    Column(
                        modifier = Modifier.fillMaxWidth().triadCard(),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        SectionHeader("Safety", "Use these options if something feels off or unsafe.")
                        ProfileActionRow(
                            title = "Report Profile",
                            subtitle = "Send this profile to moderation with a reason.",
                            icon = Icons.Filled.Flag,
                            tint = BrandStyle.Secondary,
                            onClick = { showReportSheet = true },
                        )
                        ProfileActionRow(
                            title = "Block User",
                            subtitle = "Remove this person from your experience right away.",
                            icon = Icons.Filled.Block,
                            tint = Color(0xFFEF4444),
                            isDestructive = true,
                            isDisabled = isBlocking,
                            onClick = { showBlockConfirm = true },
                        )
                    }
                } else if (!isLoading) {
                    EmptyStateCard(
                        title = "Profile unavailable",
                        message = "We couldn't load this profile right now.",
                    )
                }
            }
        }
    }

    if (showReportSheet && profile != null) {
        ReportProfileSheet(
            userId = profile!!.id,
            username = profile!!.username,
            onSubmitted = { msg ->
                notice = msg
                showReportSheet = false
            },
            onDismiss = { showReportSheet = false },
        )
    }

    if (showBlockConfirm && profile != null) {
        AlertDialog(
            onDismissRequest = { showBlockConfirm = false },
            confirmButton = {
                TextButton(onClick = {
                    showBlockConfirm = false
                    isBlocking = true
                    scope.launch {
                        try {
                            session.block(profile!!.id)
                            navController.popBackStack()
                        } catch (t: Throwable) {
                            session.presentError(t)
                        } finally {
                            isBlocking = false
                        }
                    }
                }) { Text("Block", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { showBlockConfirm = false }) { Text("Cancel") } },
            title = { Text("Block this profile?") },
            text = { Text("This will remove ${profile!!.username} from future interactions.") },
        )
    }
}

@Composable
private fun HeaderCard(profile: UserProfile, viewerRedFlags: Set<String>) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        PhotoCarouselView(photos = profile.orderedPhotos, height = 320.dp)
        Row {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(profile.username, style = MaterialTheme.typography.headlineMedium,
                    color = BrandStyle.TextPrimary)
                Text(
                    "${profile.ageMin}-${profile.ageMax} | ${profile.intent.replaceFirstChar { it.uppercase() }}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BrandStyle.TextSecondary,
                )
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Filled.LocationOn, null, tint = BrandStyle.TextSecondary)
                    Text(displayLocation(profile), style = MaterialTheme.typography.bodyMedium,
                        color = BrandStyle.TextSecondary)
                }
            }
            SectionBadge(
                if (profile.isCouple) "Couple" else "Single",
                if (profile.isCouple) BrandStyle.Secondary else BrandStyle.Accent,
            )
        }
        Text(
            if (profile.bio.isBlank())
                "No bio yet. This profile is still finding its voice."
            else profile.bio,
            style = MaterialTheme.typography.bodyMedium,
            color = BrandStyle.TextPrimary,
        )
        if (profile.orderedVideos.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader("Highlights", "Tap a clip to watch this profile in motion.")
                VideoHighlights(
                    videos = profile.orderedVideos,
                    fallbackImagePath = profile.orderedPhotos.firstOrNull()?.url,
                    titlePrefix = "Highlight",
                )
            }
        }
        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
            modifier = Modifier.height(168.dp),
        ) {
            item { ProfileMetricTile("Looking For", profile.lookingFor.replaceFirstChar { it.uppercase() }, BrandStyle.Accent) }
            item { ProfileMetricTile("Intent", profile.intent.replaceFirstChar { it.uppercase() }, BrandStyle.Secondary) }
            item { ProfileMetricTile("Profile Type", if (profile.isCouple) "Couple" else "Single", Color(0xFF3B82F6)) }
            item { ProfileMetricTile("Radius", "${profile.radiusMiles ?: 25} mi", BrandStyle.TextSecondary) }
        }
    }
}

@Composable
private fun DetailsCard(profile: UserProfile) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Profile Details", "A fuller look at the person behind the card.")
        ProfileInfoRow(Icons.Filled.LocationOn, "Location", displayLocation(profile))
        ProfileInfoRow(Icons.Filled.MailOutline, "Zip Code", profile.zipCode.ifBlank { "Not shared" })
        if (profile.isCouple) {
            ProfileInfoRow(Icons.Filled.People, "Coupled With", profile.couplePartnerName ?: "Couple profile")
        }
    }
}

@Composable
private fun InterestsCard(profile: UserProfile, viewerRedFlags: Set<String>) {
    val flagged = profile.interests.count { viewerRedFlags.contains(it.lowercase()) }
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader(
            "Interests",
            when {
                profile.interests.isEmpty() -> "No interests listed yet."
                flagged == 0 -> "A quick feel for what this profile is into."
                else -> "$flagged red flag${if (flagged == 1) "" else "s"} detected."
            },
        )
        if (flagged > 0) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFE11D48).copy(alpha = 0.08f), RoundedCornerShape(12.dp))
                    .padding(10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Icon(Icons.Filled.Flag, null, tint = Color(0xFFE11D48), modifier = Modifier.size(14.dp))
                Text(
                    "This profile shares ${if (flagged == 1) "an interest" else "interests"} you marked as a red flag.",
                    style = MaterialTheme.typography.labelMedium,
                    color = Color(0xFFE11D48),
                )
            }
        }
        if (profile.interests.isEmpty()) {
            Text("No interests added yet.", color = BrandStyle.TextSecondary)
        } else {
            InterestBadgeList(profile.interests, viewerRedFlags)
        }
    }
}

@Composable
private fun DatingPreferencesCardForOther(profile: UserProfile) {
    val rows = preferenceRows(profile).filter { it.value.isNotEmpty() }
    if (rows.isEmpty()) return
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Dating Preferences", "How ${profile.username} describes their lifestyle.")
        rows.forEach { row ->
            ProfileInfoRow(row.icon, row.title, row.value)
        }
    }
}

@Composable
private fun ReceivedImpressMeCard(
    profile: UserProfile,
    signal: ImpressMeSignal?,
    onReply: (ImpressMeSignal) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader(
            "Impress Me Challenge",
            "${profile.username} sent a challenge tied to this profile. Explore first, then reply.",
        )
        if (signal == null) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                Text("Loading challenge...", color = BrandStyle.TextSecondary)
            }
            return@Column
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Filled.AutoAwesome, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
            Text(signal.prompt.category, style = MaterialTheme.typography.labelMedium, color = BrandStyle.Accent)
        }
        Text(signal.prompt.promptText, style = MaterialTheme.typography.titleSmall,
            color = BrandStyle.TextPrimary)
        signal.prompt.senderContext?.let { ctx ->
            Text(
                ctx,
                style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary,
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BrandStyle.Accent.copy(alpha = 0.06f), RoundedCornerShape(14.dp))
                    .padding(10.dp),
            )
        }

        when (signal.status) {
            ImpressMeStatus.Sent -> {
                Button(
                    onClick = { onReply(signal) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandStyle.AccentGradient, RoundedCornerShape(22.dp)),
                    shape = RoundedCornerShape(22.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color.Transparent,
                        contentColor = Color.White,
                    ),
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowForward, null, tint = Color.White)
                    Spacer(Modifier.size(8.dp))
                    Text("Reply to Challenge")
                }
            }

            ImpressMeStatus.Responded, ImpressMeStatus.Viewed -> signal.response?.let { resp ->
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandStyle.Secondary.copy(alpha = 0.08f), RoundedCornerShape(18.dp))
                        .padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Filled.QuestionAnswer, null, tint = BrandStyle.Secondary, modifier = Modifier.size(14.dp))
                        Text("Your answer", style = MaterialTheme.typography.labelMedium,
                            color = BrandStyle.Secondary)
                    }
                    Text(resp.textContent, style = MaterialTheme.typography.bodyMedium,
                        color = BrandStyle.TextPrimary)
                    Text("Your reply is waiting for their decision.",
                        style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
                }
            }

            ImpressMeStatus.Accepted -> StatusBanner(
                icon = Icons.Filled.Verified,
                title = "Accepted",
                message = "They accepted your answer. Your new match is ready.",
                tint = Color(0xFF10B981),
            )

            ImpressMeStatus.Declined -> StatusBanner(
                icon = Icons.Filled.Cancel,
                title = "Passed",
                message = "They passed on this one after reading your answer.",
                tint = BrandStyle.TextSecondary,
            )

            ImpressMeStatus.Expired -> StatusBanner(
                icon = Icons.Filled.Schedule,
                title = "Expired",
                message = "This challenge expired before a reply was sent.",
                tint = Color(0xFFF59E0B),
            )
        }
    }
}

@Composable
private fun StatusBanner(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    message: String,
    tint: Color,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(tint.copy(alpha = 0.08f), RoundedCornerShape(18.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(icon, null, tint = tint)
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(title, style = MaterialTheme.typography.titleSmall, color = BrandStyle.TextPrimary)
            Text(message, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        }
    }
}
