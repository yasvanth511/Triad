package com.triad.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.DeleteForever
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Flag
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MailOutline
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.AlertDialog
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.UserProfile
import com.triad.app.data.VerificationMethod
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.AudioBioPlayerCard
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.components.InterestBadgeList
import com.triad.app.ui.components.PhotoCarouselView
import com.triad.app.ui.components.ProfileActionRow
import com.triad.app.ui.components.ProfileInfoRow
import com.triad.app.ui.components.ProfileMetricTile
import com.triad.app.ui.components.RedFlagBadge
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.components.SectionHeader
import com.triad.app.ui.components.VideoHighlights
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.ui.theme.triadCard
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val user by session.currentUser.collectAsState()
    val scope = rememberCoroutineScope()

    val verificationMethods: SnapshotStateList<VerificationMethod> =
        remember { mutableListOf<VerificationMethod>().toMutableStateList() }
    var startingVerificationKey by remember { mutableStateOf<String?>(null) }
    var activeFlow by remember { mutableStateOf<ActiveVerificationFlow?>(null) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var isDeleting by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        try {
            val methods = session.loadVerifications()
            verificationMethods.clear()
            verificationMethods.addAll(methods)
        } catch (t: Throwable) {
            session.presentError(t)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding(),
        ) {
            TopAppBar(
                title = { Text("Profile", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            val current = user
            if (current == null) {
                Box(modifier = Modifier.padding(20.dp)) {
                    EmptyStateCard(
                        title = "No profile loaded",
                        message = "Sign in again or refresh your session.",
                    )
                }
            } else {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(horizontal = 20.dp, vertical = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    HeaderCard(
                        user = current,
                        verifiedMethods = verificationMethods.filter {
                            it.isVerified && it.supportsProfileEntryPoint
                        },
                    )
                    DetailsCard(current)
                    if (verificationMethods.any { it.supportsProfileEntryPoint && (it.isEnabled || it.isVerified) }) {
                        ProfileVerificationsCard(
                            methods = verificationMethods.filter {
                                it.supportsProfileEntryPoint && (it.isEnabled || it.isVerified)
                            }.sortedBy { it.displayName },
                            startingKey = startingVerificationKey,
                            onStart = { method ->
                                startingVerificationKey = method.key
                                scope.launch {
                                    try {
                                        val attempt = session.startVerificationAttempt(method.key)
                                        val token = attempt.clientToken
                                        if (token != null) {
                                            activeFlow = ActiveVerificationFlow(
                                                method = method,
                                                attemptId = attempt.attemptId,
                                                clientToken = token,
                                            )
                                        }
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        startingVerificationKey = null
                                    }
                                }
                            },
                        )
                    }
                    InterestsCard(current)
                    RedFlagsCard(current)
                    DatingPreferencesCard(current)

                    Column(
                        modifier = Modifier.fillMaxWidth().triadCard(),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        ProfileActionRow(
                            title = "Edit Profile",
                            subtitle = "Update your bio, preferences, and location.",
                            icon = Icons.Filled.Edit,
                            tint = BrandStyle.Accent,
                            onClick = { navController.navigate(Routes.PROFILE_EDIT) },
                        )
                        ProfileActionRow(
                            title = "Sign Out",
                            subtitle = "Leave the app and clear the current session.",
                            icon = Icons.AutoMirrored.Filled.Logout,
                            tint = BrandStyle.TextSecondary,
                            onClick = { session.signOut() },
                        )
                        ProfileActionRow(
                            title = "Delete Account",
                            subtitle = "Permanently remove your profile and matches.",
                            icon = Icons.Filled.DeleteForever,
                            tint = Color(0xFFE11D48),
                            isDestructive = true,
                            isDisabled = isDeleting,
                            onClick = { showDeleteConfirm = true },
                        )
                    }
                }
            }
        }
    }

    activeFlow?.let { flow ->
        VerificationVendorSheet(
            flow = flow,
            onComplete = { decision, providerReference ->
                scope.launch {
                    try {
                        session.completeVerificationAttempt(
                            methodKey = flow.method.key,
                            attemptId = flow.attemptId,
                            decision = decision,
                            providerReference = providerReference,
                        )
                        activeFlow = null
                        val refreshed = session.loadVerifications()
                        verificationMethods.clear()
                        verificationMethods.addAll(refreshed)
                    } catch (t: Throwable) {
                        session.presentError(t)
                    }
                }
            },
            onDismiss = { activeFlow = null },
        )
    }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            confirmButton = {
                TextButton(onClick = {
                    showDeleteConfirm = false
                    scope.launch {
                        isDeleting = true
                        try {
                            session.deleteAccount()
                        } catch (t: Throwable) {
                            session.presentError(t)
                        } finally {
                            isDeleting = false
                        }
                    }
                }) { Text("Delete", color = Color(0xFFE11D48)) }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) { Text("Cancel") }
            },
            title = { Text("Delete your account?") },
            text = { Text("This permanently removes your account and signs you out.") },
        )
    }
}

@Composable
private fun HeaderCard(
    user: UserProfile,
    verifiedMethods: List<VerificationMethod>,
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .triadCard(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        PhotoCarouselView(photos = user.orderedPhotos, height = 280.dp)

        Row {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    user.username,
                    style = MaterialTheme.typography.headlineMedium,
                    color = BrandStyle.TextPrimary,
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    Icon(Icons.Filled.LocationOn, null, tint = BrandStyle.TextSecondary)
                    Text(
                        displayLocation(user),
                        style = MaterialTheme.typography.bodyMedium,
                        color = BrandStyle.TextSecondary,
                    )
                }
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                SectionBadge(
                    if (user.isCouple) "Couple" else "Single",
                    if (user.isCouple) BrandStyle.Secondary else BrandStyle.Accent,
                )
                verifiedMethods.forEach { method ->
                    SectionBadge(
                        method.displayName,
                        verificationTint(method),
                        icon = Icons.Filled.Verified,
                    )
                }
            }
        }

        Text(
            if (user.bio.isBlank())
                "No bio yet. Add a short intro so your profile feels more like you."
            else user.bio,
            style = MaterialTheme.typography.bodyMedium,
            color = BrandStyle.TextPrimary,
        )

        user.audioBioUrl?.let { AudioBioPlayerCard(it) }

        if (user.orderedVideos.isNotEmpty()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                SectionHeader("Highlights", "Your profile videos show up as story-style highlights.")
                VideoHighlights(
                    videos = user.orderedVideos,
                    fallbackImagePath = user.orderedPhotos.firstOrNull()?.url,
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
            item {
                ProfileMetricTile("Age Range", "${user.ageMin}-${user.ageMax}", BrandStyle.Accent)
            }
            item {
                ProfileMetricTile("Intent", user.intent.replaceFirstChar { it.uppercase() }, BrandStyle.Secondary)
            }
            item {
                ProfileMetricTile("Looking For", user.lookingFor.replaceFirstChar { it.uppercase() }, Color(0xFF3B82F6))
            }
            item {
                ProfileMetricTile("Radius", "${user.radiusMiles ?: 25} mi", BrandStyle.TextSecondary)
            }
        }
    }
}

@Composable
private fun DetailsCard(user: UserProfile) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Profile Details", "The details other people will notice first.")
        ProfileInfoRow(Icons.Filled.LocationOn, "Location", displayLocation(user))
        ProfileInfoRow(Icons.Filled.MailOutline, "Zip Code", user.zipCode.ifBlank { "Not set" })
        if (user.isCouple) {
            ProfileInfoRow(Icons.Filled.People, "Coupled With", user.couplePartnerName ?: "Waiting for partner")
        }
    }
}

@Composable
private fun InterestsCard(user: UserProfile) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader(
            "Interests",
            if (user.interests.isEmpty())
                "Add a few interests to make your profile feel complete."
            else "A quick read on your energy and preferences.",
        )
        if (user.interests.isEmpty()) {
            Text("No interests added yet.", color = BrandStyle.TextSecondary)
        } else {
            InterestBadgeList(user.interests)
        }
    }
}

@OptIn(androidx.compose.foundation.layout.ExperimentalLayoutApi::class)
@Composable
private fun RedFlagsCard(user: UserProfile) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader(
            "Red Flags",
            if ((user.redFlags ?: emptyList()).isEmpty())
                "Add deal-breakers so we can warn you when a profile matches."
            else "These will be flagged when viewing other profiles.",
        )
        val flags = user.redFlags.orEmpty()
        if (flags.isEmpty()) {
            Text("No red flags set yet.", color = BrandStyle.TextSecondary)
        } else {
            androidx.compose.foundation.layout.FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                flags.forEach { RedFlagBadge(it) }
            }
        }
    }
}

@Composable
private fun DatingPreferencesCard(user: UserProfile) {
    val rows = preferenceRows(user).filter { it.value.isNotEmpty() }
    if (rows.isEmpty()) return
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Dating Preferences", "Your lifestyle and what you're looking for.")
        rows.forEach { row ->
            ProfileInfoRow(row.icon, row.title, row.value)
        }
    }
}

internal fun displayLocation(user: UserProfile): String {
    val parts = listOf(user.city, user.state).filter { it.isNotEmpty() }
    return if (parts.isEmpty()) "Location not set" else parts.joinToString(", ")
}

internal fun verificationTint(method: VerificationMethod): Color = when (method.key) {
    "age_verified" -> Color(0xFF3B82F6)
    "live_verified" -> Color(0xFF10B981)
    else -> BrandStyle.Accent
}

data class ActiveVerificationFlow(
    val method: VerificationMethod,
    val attemptId: String,
    val clientToken: String,
) {
    val providerReferencePrefix: String = when (method.key) {
        "age_verified" -> "age_session"
        "live_verified" -> "live_session"
        else -> "verification_session"
    }
}
