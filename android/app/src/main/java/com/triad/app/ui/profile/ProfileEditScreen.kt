package com.triad.app.ui.profile

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Audiotrack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.UnfoldMore
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.Photo
import com.triad.app.data.ProfileVideo
import com.triad.app.data.UpdateProfileRequest
import com.triad.app.data.UserProfile
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.AudioBioPlayerCard
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.components.ScreenContainer
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileEditScreen(navController: NavController) {
    val session = LocalSessionStore.current
    val user by session.currentUser.collectAsState()
    val current = user ?: run {
        Box(modifier = Modifier.fillMaxSize().padding(20.dp)) {
            Text("No profile loaded.", color = BrandStyle.TextPrimary)
        }
        return
    }

    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    // Editable state
    var bio by remember { mutableStateOf(current.bio) }
    var ageMin by remember { mutableStateOf(maxOf(current.ageMin, 18)) }
    var ageMax by remember { mutableStateOf(maxOf(current.ageMax, maxOf(current.ageMin, 18))) }
    var intent by remember { mutableStateOf(current.intent.lowercase()) }
    var lookingFor by remember { mutableStateOf(current.lookingFor.lowercase()) }
    var radiusMiles by remember {
        mutableStateOf(((current.radiusMiles ?: 25).coerceIn(5, 100)))
    }
    var interestsText by remember { mutableStateOf(current.interests.joinToString(", ")) }
    var redFlagsText by remember { mutableStateOf((current.redFlags ?: emptyList()).joinToString(", ")) }
    var city by remember { mutableStateOf(current.city) }
    var state by remember { mutableStateOf(current.state) }
    var zipCode by remember { mutableStateOf(current.zipCode) }

    var interestedIn by remember { mutableStateOf(current.interestedIn.orEmpty()) }
    var neighborhood by remember { mutableStateOf(current.neighborhood.orEmpty()) }
    var ethnicity by remember { mutableStateOf(current.ethnicity.orEmpty()) }
    var religion by remember { mutableStateOf(current.religion.orEmpty()) }
    var relationshipType by remember { mutableStateOf(current.relationshipType.orEmpty()) }
    var height by remember { mutableStateOf(current.height.orEmpty()) }
    var children by remember { mutableStateOf(current.children.orEmpty()) }
    var familyPlans by remember { mutableStateOf(current.familyPlans.orEmpty()) }
    var drugs by remember { mutableStateOf(current.drugs.orEmpty()) }
    var smoking by remember { mutableStateOf(current.smoking.orEmpty()) }
    var marijuana by remember { mutableStateOf(current.marijuana.orEmpty()) }
    var drinking by remember { mutableStateOf(current.drinking.orEmpty()) }
    var politics by remember { mutableStateOf(current.politics.orEmpty()) }
    var educationLevel by remember { mutableStateOf(current.educationLevel.orEmpty()) }
    var weight by remember { mutableStateOf(current.weight.orEmpty()) }
    var physique by remember { mutableStateOf(current.physique.orEmpty()) }
    var sexualPreference by remember { mutableStateOf(current.sexualPreference.orEmpty()) }
    var comfortWithIntimacy by remember { mutableStateOf(current.comfortWithIntimacy.orEmpty()) }

    var isSaving by remember { mutableStateOf(false) }
    var isUploadingPhoto by remember { mutableStateOf(false) }
    var isUploadingVideo by remember { mutableStateOf(false) }
    var isDeletingAudio by remember { mutableStateOf(false) }
    var photoToDelete by remember { mutableStateOf<Photo?>(null) }
    var videoToDelete by remember { mutableStateOf<ProfileVideo?>(null) }
    var audioBioError by remember { mutableStateOf<String?>(null) }

    val photoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            isUploadingPhoto = true
            try {
                val (bytes, mime) = readBytesWithMime(context, uri, "image/jpeg")
                val ext = extensionForMime(mime, "jpg")
                session.uploadProfilePhoto(bytes, mime, "photo.$ext")
            } catch (t: Throwable) {
                session.presentError(t)
            } finally {
                isUploadingPhoto = false
            }
        }
    }
    val videoLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.PickVisualMedia(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            isUploadingVideo = true
            try {
                val (bytes, mime) = readBytesWithMime(context, uri, "video/mp4")
                val ext = extensionForMime(mime, "mp4")
                session.uploadProfileVideo(bytes, mime, "highlight.$ext")
            } catch (t: Throwable) {
                session.presentError(t)
            } finally {
                isUploadingVideo = false
            }
        }
    }
    val audioLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.GetContent(),
    ) { uri ->
        if (uri == null) return@rememberLauncherForActivityResult
        scope.launch {
            audioBioError = null
            try {
                val (bytes, mime) = readBytesWithMime(context, uri, "audio/mpeg")
                val name = uri.lastPathSegment ?: "bio"
                session.uploadAudioBio(bytes, mime, name)
            } catch (t: Throwable) {
                audioBioError = t.localizedMessage
            }
        }
    }

    LaunchedEffect(Unit) {
        // Refresh in case the photo grid lags behind.
        runCatching { session.refreshProfile() }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Column(modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()) {
            TopAppBar(
                title = { Text("Edit Profile") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            ScreenContainer(title = "Edit Profile") {
                PhotosCard(
                    photos = current.orderedPhotos,
                    isUploading = isUploadingPhoto,
                    onAdd = {
                        photoLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly),
                        )
                    },
                    onRemove = { photoToDelete = it },
                )

                HighlightsCard(
                    videos = current.orderedVideos,
                    isUploading = isUploadingVideo,
                    onAdd = {
                        videoLauncher.launch(
                            PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly),
                        )
                    },
                    onRemove = { videoToDelete = it },
                )

                EditCard(title = "About", subtitle = "How you introduce yourself.") {
                    EditRow("Username") { Text(current.username, color = BrandStyle.TextSecondary) }
                    Divider()
                    LabeledMultilineField("Bio", bio, "Write a short introâ€¦") { bio = it }
                }

                CoupleLinkCard()

                EditCard(title = "Preferences", subtitle = "Who you're looking to meet.") {
                    StepperRow("Min Age $ageMin", value = ageMin, range = 18..80) { v ->
                        ageMin = v
                        if (ageMax < v) ageMax = v
                    }
                    Divider()
                    StepperRow("Max Age $ageMax", value = ageMax, range = ageMin..90) { ageMax = it }
                    Divider()
                    EditRow("Intent") {
                        PrefMenu(value = intent, options = PreferenceOptions.intent, placeholder = "Select",
                            display = { it.replaceFirstChar { c -> c.uppercase() } }) { intent = it }
                    }
                    Divider()
                    EditRow("Looking For") {
                        PrefMenu(value = lookingFor, options = PreferenceOptions.lookingFor, placeholder = "Select",
                            display = { it.replaceFirstChar { c -> c.uppercase() } }) { lookingFor = it }
                    }
                    Divider()
                    StepperRow("Radius $radiusMiles mi", value = radiusMiles, range = 5..100, step = 5) {
                        radiusMiles = it
                    }
                }

                EditCard(title = "Location", subtitle = "Where you're based.") {
                    LabeledField("City", city, "City") { city = it }
                    Divider()
                    LabeledField("State", state, "State") { state = it }
                    Divider()
                    LabeledField("Zip Code", zipCode, "Zip Code", keyboardType = KeyboardType.Number) {
                        zipCode = it
                    }
                }

                EditCard(title = "Basics", subtitle = "Who you're interested in and where you live.") {
                    EditRow("Interested in") {
                        PrefMenu(value = interestedIn, options = PreferenceOptions.interestedIn,
                            placeholder = "Select") { interestedIn = it }
                    }
                    Divider()
                    LabeledField("Neighborhood", neighborhood, "e.g. Brooklyn, Midtownâ€¦") {
                        neighborhood = it
                    }
                }

                EditCard(title = "Identity", subtitle = "How you describe yourself.") {
                    LabeledField("Height", height, "e.g. 5'10\"") { height = it }
                    Divider()
                    LabeledField("Weight", weight, "e.g. 160 lbs") { weight = it }
                    Divider()
                    EditRow("Physique") {
                        PrefMenu(value = physique, options = PreferenceOptions.physique,
                            placeholder = "Select") { physique = it }
                    }
                    Divider()
                    EditRow("Ethnicity") {
                        PrefMenu(value = ethnicity, options = PreferenceOptions.ethnicity,
                            placeholder = "Select") { ethnicity = it }
                    }
                    Divider()
                    EditRow("Education") {
                        PrefMenu(value = educationLevel, options = PreferenceOptions.education,
                            placeholder = "Select") { educationLevel = it }
                    }
                    Divider()
                    EditRow("Religion") {
                        PrefMenu(value = religion, options = PreferenceOptions.religion,
                            placeholder = "Select") { religion = it }
                    }
                }

                EditCard(title = "Relationship", subtitle = "Your relationship style and family plans.") {
                    EditRow("Relationship type") {
                        PrefMenu(value = relationshipType, options = PreferenceOptions.relationshipType,
                            placeholder = "Select") { relationshipType = it }
                    }
                    Divider()
                    EditRow("Children") {
                        PrefMenu(value = children, options = PreferenceOptions.children,
                            placeholder = "Select") { children = it }
                    }
                    Divider()
                    EditRow("Family plans") {
                        PrefMenu(value = familyPlans, options = PreferenceOptions.familyPlans,
                            placeholder = "Select") { familyPlans = it }
                    }
                    Divider()
                    EditRow("Comfort with intimacy") {
                        PrefMenu(value = comfortWithIntimacy, options = PreferenceOptions.comfortWithIntimacy,
                            placeholder = "Select") { comfortWithIntimacy = it }
                    }
                }

                EditCard(title = "Lifestyle", subtitle = "Your habits and values.") {
                    EditRow("Drinking") {
                        PrefMenu(value = drinking, options = PreferenceOptions.drinking,
                            placeholder = "Select") { drinking = it }
                    }
                    Divider()
                    EditRow("Smoking") {
                        PrefMenu(value = smoking, options = PreferenceOptions.substance,
                            placeholder = "Select") { smoking = it }
                    }
                    Divider()
                    EditRow("Marijuana") {
                        PrefMenu(value = marijuana, options = PreferenceOptions.substance,
                            placeholder = "Select") { marijuana = it }
                    }
                    Divider()
                    EditRow("Drugs") {
                        PrefMenu(value = drugs, options = PreferenceOptions.substance,
                            placeholder = "Select") { drugs = it }
                    }
                    Divider()
                    EditRow("Politics") {
                        PrefMenu(value = politics, options = PreferenceOptions.politics,
                            placeholder = "Select") { politics = it }
                    }
                    Divider()
                    EditRow("Sexual preference") {
                        PrefMenu(value = sexualPreference, options = PreferenceOptions.sexualPreference,
                            placeholder = "Select") { sexualPreference = it }
                    }
                }

                EditCard(title = "Interests", subtitle = "Comma-separated â€” e.g. hiking, coffee, art") {
                    LabeledMultilineField(
                        label = "Interests",
                        value = interestsText,
                        placeholder = "hiking, coffee, artâ€¦",
                    ) { interestsText = it }
                }

                EditCard(title = "Red Flags", subtitle = "Deal-breakers flagged on other profiles.") {
                    LabeledMultilineField(
                        label = "Red Flags",
                        value = redFlagsText,
                        placeholder = "smoking, heavy drinkingâ€¦",
                    ) { redFlagsText = it }
                }

                AudioBioCard(
                    audioBioUrl = current.audioBioUrl,
                    isDeleting = isDeletingAudio,
                    error = audioBioError,
                    onPick = { audioLauncher.launch("audio/*") },
                    onDelete = {
                        scope.launch {
                            isDeletingAudio = true
                            audioBioError = null
                            try {
                                session.deleteAudioBio()
                            } catch (t: Throwable) {
                                audioBioError = t.localizedMessage
                            } finally {
                                isDeletingAudio = false
                            }
                        }
                    },
                )

                Button(
                    onClick = {
                        scope.launch {
                            isSaving = true
                            try {
                                val interests = interestsText.split(",").map { it.trim() }
                                    .filter { it.isNotEmpty() }
                                val redFlags = redFlagsText.split(",").map { it.trim() }
                                    .filter { it.isNotEmpty() }
                                val request = UpdateProfileRequest(
                                    bio = bio.trim(),
                                    ageMin = ageMin,
                                    ageMax = maxOf(ageMin, ageMax),
                                    intent = intent,
                                    lookingFor = lookingFor,
                                    interests = interests,
                                    latitude = null,
                                    longitude = null,
                                    city = city.trim(),
                                    state = state.trim(),
                                    zipCode = zipCode.trim(),
                                    radiusMiles = radiusMiles,
                                    redFlags = redFlags,
                                    interestedIn = interestedIn,
                                    neighborhood = neighborhood.trim(),
                                    ethnicity = ethnicity.trim(),
                                    religion = religion,
                                    relationshipType = relationshipType,
                                    height = height.trim(),
                                    children = children,
                                    familyPlans = familyPlans,
                                    drugs = drugs,
                                    smoking = smoking,
                                    marijuana = marijuana,
                                    drinking = drinking,
                                    politics = politics,
                                    educationLevel = educationLevel,
                                    weight = weight.trim(),
                                    physique = physique,
                                    sexualPreference = sexualPreference,
                                    comfortWithIntimacy = comfortWithIntimacy,
                                )
                                session.updateProfile(request)
                                navController.popBackStack()
                            } catch (t: Throwable) {
                                session.presentError(t)
                            } finally {
                                isSaving = false
                            }
                        }
                    },
                    enabled = !isSaving,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = BrandStyle.Accent, contentColor = Color.White),
                    shape = RoundedCornerShape(22.dp),
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                            modifier = Modifier.size(18.dp))
                        Spacer(Modifier.size(8.dp))
                    }
                    Text("Save Changes")
                }
            }
        }
    }

    photoToDelete?.let { p ->
        AlertDialog(
            onDismissRequest = { photoToDelete = null },
            confirmButton = {
                TextButton(onClick = {
                    photoToDelete = null
                    scope.launch {
                        try { session.deleteProfilePhoto(p.id) } catch (t: Throwable) { session.presentError(t) }
                    }
                }) { Text("Remove", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { photoToDelete = null }) { Text("Cancel") } },
            title = { Text("Remove this photo?") },
        )
    }
    videoToDelete?.let { v ->
        AlertDialog(
            onDismissRequest = { videoToDelete = null },
            confirmButton = {
                TextButton(onClick = {
                    videoToDelete = null
                    scope.launch {
                        try { session.deleteProfileVideo(v.id) } catch (t: Throwable) { session.presentError(t) }
                    }
                }) { Text("Remove", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { videoToDelete = null }) { Text("Cancel") } },
            title = { Text("Remove this highlight?") },
        )
    }
}

@Composable
private fun PhotosCard(
    photos: List<Photo>,
    isUploading: Boolean,
    onAdd: () -> Unit,
    onRemove: (Photo) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("Photos", style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
                Text(
                    if (photos.isEmpty()) "Add up to 6 photos."
                    else "${photos.size} / 6 â€” tap Ã— to remove.",
                    style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary,
                )
            }
            if (isUploading) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            verticalArrangement = Arrangement.spacedBy(6.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            modifier = Modifier.height(((photos.size / 3 + 2) * 114).coerceAtMost(380).dp),
        ) {
            items(items = photos, key = { it.id }) { photo ->
                Box(modifier = Modifier.height(108.dp)) {
                    RemoteMediaView(path = photo.url, height = 108.dp, cornerRadius = 14.dp)
                    Box(
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(6.dp)
                            .size(26.dp)
                            .background(Color.Black.copy(alpha = 0.55f), CircleShape)
                            .clickable { onRemove(photo) },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(Icons.Filled.Close, null, tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                }
            }
            if (photos.size < 6) {
                item {
                    AddPhotoCell(onClick = onAdd)
                }
            }
        }
    }
}

@Composable
private fun AddPhotoCell(onClick: () -> Unit) {
    Box(
        modifier = Modifier
            .height(108.dp)
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .background(BrandStyle.Accent.copy(alpha = 0.06f))
            .border(
                width = 1.5.dp,
                brush = androidx.compose.ui.graphics.SolidColor(BrandStyle.Accent.copy(alpha = 0.28f)),
                shape = RoundedCornerShape(14.dp),
            )
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Filled.Add, null, tint = BrandStyle.Accent)
            Text("Add", style = MaterialTheme.typography.labelMedium, color = BrandStyle.Accent)
        }
    }
}

@Composable
private fun HighlightsCard(
    videos: List<ProfileVideo>,
    isUploading: Boolean,
    onAdd: () -> Unit,
    onRemove: (ProfileVideo) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text("Highlights", style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
                Text("Short clips shown on your profile.", style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary)
            }
            if (isUploading) CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
        }
        Row(modifier = Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            AddHighlightBubble(onClick = onAdd)
            videos.forEach { video ->
                HighlightBubble(video = video, onRemove = { onRemove(video) })
            }
        }
    }
}

@Composable
private fun AddHighlightBubble(onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
        modifier = Modifier.clickable(onClick = onClick),
    ) {
        Box(
            modifier = Modifier
                .size(76.dp)
                .background(
                    Brush.linearGradient(listOf(BrandStyle.Accent, BrandStyle.Secondary)),
                    CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .background(BrandStyle.Accent.copy(alpha = 0.07f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.Add, null, tint = BrandStyle.Accent)
            }
        }
        Text("Add Clip", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
    }
}

@Composable
private fun HighlightBubble(video: ProfileVideo, onRemove: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Box(modifier = Modifier.size(76.dp), contentAlignment = Alignment.Center) {
            Box(
                modifier = Modifier
                    .size(76.dp)
                    .background(
                        Brush.linearGradient(listOf(BrandStyle.Secondary, BrandStyle.Accent)),
                        CircleShape,
                    ),
            )
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .background(BrandStyle.Secondary.copy(alpha = 0.12f), CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.PlayArrow, null, tint = BrandStyle.Secondary)
            }
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(22.dp)
                    .background(Color.Black.copy(alpha = 0.55f), CircleShape)
                    .clickable(onClick = onRemove),
                contentAlignment = Alignment.Center,
            ) {
                Icon(Icons.Filled.Close, null, tint = Color.White, modifier = Modifier.size(10.dp))
            }
        }
        Text("Clip", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
    }
}

@Composable
private fun AudioBioCard(
    audioBioUrl: String?,
    isDeleting: Boolean,
    error: String?,
    onPick: () -> Unit,
    onDelete: () -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text("Audio Bio", style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
        Text("A short voice clip to introduce yourself.", style = MaterialTheme.typography.labelMedium,
            color = BrandStyle.TextSecondary)

        if (audioBioUrl != null) {
            AudioBioPlayerCard(audioBioUrl)
            TextButton(onClick = onDelete, enabled = !isDeleting) {
                Icon(Icons.Filled.Delete, null, tint = Color(0xFFEF4444))
                Spacer(Modifier.size(6.dp))
                Text(if (isDeleting) "Removingâ€¦" else "Remove Audio Bio", color = Color(0xFFEF4444))
            }
        } else {
            TextButton(onClick = onPick) {
                Icon(Icons.Filled.Audiotrack, null, tint = BrandStyle.Accent)
                Spacer(Modifier.size(8.dp))
                Text("Upload Audio Bio", color = BrandStyle.Accent)
            }
        }

        error?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = Color(0xFFEF4444)) }
    }
}

@Composable
private fun EditCard(title: String, subtitle: String, content: @Composable () -> Unit) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(title, style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
            Text(subtitle, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        }
        content()
    }
}

@Composable
private fun EditRow(label: String, content: @Composable () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween,
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.TextPrimary)
        content()
    }
}

@Composable
private fun StepperRow(label: String, value: Int, range: IntRange, step: Int = 1, onChange: (Int) -> Unit) {
    EditRow(label) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            IconButton(onClick = { onChange((value - step).coerceIn(range)) }) {
                Icon(Icons.Filled.Close, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
            }
            Text(value.toString(), color = BrandStyle.TextPrimary, style = MaterialTheme.typography.titleSmall)
            IconButton(onClick = { onChange((value + step).coerceIn(range)) }) {
                Icon(Icons.Filled.Add, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
            }
        }
    }
}

@Composable
private fun PrefMenu(
    value: String,
    options: List<String>,
    placeholder: String,
    display: (String) -> String = { it },
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }
    Box {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            modifier = Modifier.clickable { expanded = true },
        ) {
            Text(
                if (value.isEmpty()) placeholder else display(value),
                style = MaterialTheme.typography.bodyMedium,
                color = if (value.isEmpty()) BrandStyle.TextSecondary else BrandStyle.Accent,
            )
            Icon(Icons.Filled.UnfoldMore, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            DropdownMenuItem(text = { Text(placeholder) }, onClick = {
                onSelect("")
                expanded = false
            })
            options.forEach { option ->
                DropdownMenuItem(
                    text = { Text(display(option)) },
                    onClick = {
                        onSelect(option)
                        expanded = false
                    },
                )
            }
        }
    }
}

@Composable
private fun LabeledField(
    label: String,
    value: String,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    onValueChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = BrandStyle.TextSecondary) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.White.copy(alpha = 0.85f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
            ),
            keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = keyboardType),
        )
    }
}

@Composable
private fun LabeledMultilineField(
    label: String,
    value: String,
    placeholder: String,
    onValueChange: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = BrandStyle.TextSecondary) },
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            shape = RoundedCornerShape(16.dp),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.White.copy(alpha = 0.85f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
            ),
        )
    }
}

private fun readBytesWithMime(
    context: Context,
    uri: android.net.Uri,
    fallbackMime: String,
): Pair<ByteArray, String> {
    val resolver = context.contentResolver
    val mime = resolver.getType(uri) ?: fallbackMime
    val bytes = resolver.openInputStream(uri)?.use { it.readBytes() } ?: ByteArray(0)
    return bytes to mime
}

private fun extensionForMime(mime: String, fallback: String): String =
    when (mime.lowercase()) {
        "image/jpeg", "image/jpg" -> "jpg"
        "image/png" -> "png"
        "image/webp" -> "webp"
        "video/mp4" -> "mp4"
        "video/quicktime" -> "mov"
        "audio/mpeg", "audio/mp3" -> "mp3"
        "audio/m4a", "audio/x-m4a" -> "m4a"
        "audio/aac" -> "aac"
        "audio/wav", "audio/x-wav" -> "wav"
        else -> fallback
    }
