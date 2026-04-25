package com.triad.app.ui.impressme

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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.FormatQuote
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.triad.app.data.ImpressMeSignal
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImpressMeRespondScreen(navController: NavController, signalId: String) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()

    var signal by remember { mutableStateOf<ImpressMeSignal?>(null) }
    var responseText by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }

    LaunchedEffect(signalId) {
        try {
            signal = session.getImpressMeSignal(signalId)
        } catch (t: Throwable) {
            session.presentError(t)
        }
    }

    val canSubmit = responseText.trim().length >= 10 && !isSubmitting

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding(),
        ) {
            TopAppBar(
                title = { Text("Your Challenge", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Cancel", tint = BrandStyle.TextSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                signal?.let { s ->
                    // Header
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Avatar(s.senderPhotoUrl)
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(
                                "${s.senderUsername} sent you a challenge",
                                style = MaterialTheme.typography.titleSmall,
                                color = BrandStyle.TextPrimary,
                            )
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Filled.AutoAwesome, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
                                Text(s.prompt.category, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.Accent)
                            }
                        }
                        if (!Dates.isExpired(s.expiresAt)) {
                            val hoursLeft = Dates.hoursRemaining(s.expiresAt)
                            val tint = if (hoursLeft < 6) Color(0xFFEF4444) else BrandStyle.TextSecondary
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Icon(Icons.Filled.AccessTime, null, tint = tint, modifier = Modifier.size(14.dp))
                                Text("${hoursLeft}h left", style = MaterialTheme.typography.labelSmall, color = tint)
                            }
                        }
                    }

                    // Prompt card
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.linearGradient(
                                    listOf(
                                        BrandStyle.Accent.copy(alpha = 0.10f),
                                        BrandStyle.Secondary.copy(alpha = 0.06f),
                                    ),
                                ),
                                RoundedCornerShape(20.dp),
                            )
                            .border(1.dp, BrandStyle.Accent.copy(alpha = 0.18f), RoundedCornerShape(20.dp))
                            .padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(Icons.Filled.FormatQuote, null, tint = BrandStyle.TextSecondary, modifier = Modifier.size(14.dp))
                            Text("The prompt", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
                        }
                        Text(
                            s.prompt.promptText,
                            style = MaterialTheme.typography.titleMedium,
                            color = BrandStyle.TextPrimary,
                        )
                    }

                    s.prompt.senderContext?.let { ctx ->
                        Row(
                            modifier = Modifier
                                .background(BrandStyle.Accent.copy(alpha = 0.06f), RoundedCornerShape(12.dp))
                                .padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            Icon(Icons.Filled.Info, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
                            Text(ctx, style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
                        }
                    }

                    // Editor
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Row(modifier = Modifier.weight(1f),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Filled.Edit, null, tint = BrandStyle.TextPrimary, modifier = Modifier.size(14.dp))
                                Text("Your reply", style = MaterialTheme.typography.titleSmall, color = BrandStyle.TextPrimary)
                            }
                            Text(
                                "${responseText.length} / 1000",
                                style = MaterialTheme.typography.labelSmall,
                                color = if (responseText.length > 900) Color(0xFFF59E0B) else BrandStyle.TextSecondary,
                            )
                        }
                        TextField(
                            value = responseText,
                            onValueChange = { if (it.length <= 1000) responseText = it },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(180.dp),
                            shape = RoundedCornerShape(16.dp),
                            colors = TextFieldDefaults.colors(
                                focusedContainerColor = Color.White.copy(alpha = 0.85f),
                                unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                                focusedIndicatorColor = BrandStyle.Accent,
                                unfocusedIndicatorColor = BrandStyle.CardBorder,
                            ),
                        )
                        if (responseText.isNotEmpty() && responseText.trim().length < 10) {
                            Text(
                                "Write at least 10 characters to make it count.",
                                style = MaterialTheme.typography.labelMedium,
                                color = Color(0xFFF59E0B),
                            )
                        }
                    }

                    // Submit
                    Button(
                        onClick = {
                            scope.launch {
                                isSubmitting = true
                                try {
                                    session.respondToImpressMe(s.id, responseText.trim())
                                    navController.popBackStack()
                                } catch (t: Throwable) {
                                    session.presentError(t)
                                } finally {
                                    isSubmitting = false
                                }
                            }
                        },
                        enabled = canSubmit,
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BrandStyle.AccentGradient, RoundedCornerShape(22.dp)),
                        shape = RoundedCornerShape(22.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = Color.Transparent,
                            disabledContainerColor = Color.Transparent,
                            contentColor = Color.White,
                            disabledContentColor = Color.White,
                        ),
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp,
                                modifier = Modifier.size(18.dp))
                            Spacer(Modifier.size(8.dp))
                        }
                        Icon(Icons.Filled.AutoAwesome, null, tint = Color.White)
                        Spacer(Modifier.size(4.dp))
                        Text("Send My Answer", color = Color.White)
                    }

                    Text(
                        "Your answer goes directly to ${s.senderUsername}. They'll decide if it's a match.",
                        style = MaterialTheme.typography.labelMedium,
                        color = BrandStyle.TextSecondary,
                        modifier = Modifier.fillMaxWidth(),
                    )
                }
            }
        }
    }
}

@Composable
private fun Avatar(url: String?) {
    if (url != null) {
        Box(modifier = Modifier.size(42.dp)) {
            RemoteMediaView(path = url, height = 42.dp, cornerRadius = 21.dp)
        }
    } else {
        Box(
            modifier = Modifier
                .size(42.dp)
                .background(BrandStyle.Accent.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Person, null, tint = BrandStyle.Accent)
        }
    }
}
