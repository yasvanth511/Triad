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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FormatQuote
import androidx.compose.material.icons.filled.Person
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
import com.triad.app.data.ImpressMeFlow
import com.triad.app.data.ImpressMeResponseModel
import com.triad.app.data.ImpressMeSignal
import com.triad.app.data.ImpressMeStatus
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.RemoteMediaView
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ImpressMeReviewScreen(navController: NavController, signalId: String) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()

    var signal by remember { mutableStateOf<ImpressMeSignal?>(null) }
    var isAccepting by remember { mutableStateOf(false) }
    var isDeclining by remember { mutableStateOf(false) }
    var isMarkingViewed by remember { mutableStateOf(false) }
    var showDeclineConfirm by remember { mutableStateOf(false) }

    LaunchedEffect(signalId) {
        try {
            signal = session.getImpressMeSignal(signalId)
            // Auto-mark reviewed if responded
            val current = signal
            if (current != null && current.status == ImpressMeStatus.Responded) {
                isMarkingViewed = true
                signal = session.reviewImpressMe(current.id)
                isMarkingViewed = false
            }
        } catch (t: Throwable) {
            session.presentError(t)
            isMarkingViewed = false
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
                title = { Text("Their Answer", style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Close",
                            tint = BrandStyle.TextSecondary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            val current = signal ?: run {
                    Box(modifier = Modifier.fillMaxSize().padding(20.dp)) {
                    if (!isMarkingViewed) {
                        CircularProgressIndicator(color = BrandStyle.Accent)
                    }
                }
                return@Column
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp, vertical = 20.dp),
                verticalArrangement = Arrangement.spacedBy(20.dp),
            ) {
                Header(current)
                PromptCard(current)
                current.response?.let { ResponseCard(current.receiverUsername, it) }

                when {
                    current.response == null -> WaitingBanner(isMarkingViewed)
                    current.status != ImpressMeStatus.Accepted &&
                        current.status != ImpressMeStatus.Declined -> {
                        ActionButtons(
                            flow = current.flow,
                            isBusy = isAccepting || isDeclining || isMarkingViewed,
                            isAccepting = isAccepting,
                            isDeclining = isDeclining,
                            onAccept = {
                                scope.launch {
                                    isAccepting = true
                                    try {
                                        signal = session.acceptImpressMe(current.id)
                                    } catch (t: Throwable) {
                                        session.presentError(t)
                                    } finally {
                                        isAccepting = false
                                    }
                                }
                            },
                            onDecline = { showDeclineConfirm = true },
                        )
                    }

                    else -> ResolvedBanner(current.status)
                }
            }
        }
    }

    if (showDeclineConfirm) {
        val current = signal
        AlertDialog(
            onDismissRequest = { showDeclineConfirm = false },
            confirmButton = {
                TextButton(onClick = {
                    showDeclineConfirm = false
                    if (current == null) return@TextButton
                    scope.launch {
                        isDeclining = true
                        try {
                            signal = session.declineImpressMe(current.id)
                        } catch (t: Throwable) {
                            session.presentError(t)
                        } finally {
                            isDeclining = false
                        }
                    }
                }) { Text("Yes, Pass", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { showDeclineConfirm = false }) { Text("Cancel") } },
            title = { Text("Pass on this one?") },
            text = {
                Text("You can't undo this. ${current?.receiverUsername ?: "they"} won't know you passed.")
            },
        )
    }
}

@Composable
private fun Header(signal: ImpressMeSignal) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Avatar(signal.receiverPhotoUrl)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                if (signal.response == null) "Challenge sent" else "${signal.receiverUsername} replied!",
                style = MaterialTheme.typography.titleSmall,
                color = BrandStyle.TextPrimary,
            )
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(Icons.Filled.AutoAwesome, null, tint = BrandStyle.Accent, modifier = Modifier.size(14.dp))
                Text(signal.prompt.category, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.Accent)
            }
        }
    }
}

@Composable
private fun PromptCard(signal: ImpressMeSignal) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandStyle.Accent.copy(alpha = 0.06f), RoundedCornerShape(16.dp))
            .border(1.dp, BrandStyle.Accent.copy(alpha = 0.14f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Filled.FormatQuote, null, tint = BrandStyle.TextSecondary, modifier = Modifier.size(14.dp))
            Text("Your challenge", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
        }
        Text(signal.prompt.promptText, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.TextPrimary)
    }
}

@Composable
private fun ResponseCard(receiverUsername: String, response: ImpressMeResponseModel) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(
                Brush.linearGradient(
                    listOf(
                        BrandStyle.Secondary.copy(alpha = 0.10f),
                        BrandStyle.Accent.copy(alpha = 0.06f),
                    ),
                ),
                RoundedCornerShape(20.dp),
            )
            .border(1.dp, BrandStyle.Secondary.copy(alpha = 0.18f), RoundedCornerShape(20.dp))
            .padding(18.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(Icons.Filled.FormatQuote, null, tint = BrandStyle.Secondary, modifier = Modifier.size(14.dp))
            Text("$receiverUsername's answer", style = MaterialTheme.typography.titleSmall, color = BrandStyle.Secondary)
        }
        Text(response.textContent, style = MaterialTheme.typography.bodyLarge, color = BrandStyle.TextPrimary)
        Text(
            Dates.abbreviatedDateTime(response.createdAt),
            style = MaterialTheme.typography.labelMedium,
            color = BrandStyle.TextSecondary,
        )
    }
}

@Composable
private fun WaitingBanner(isMarkingViewed: Boolean) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(BrandStyle.Accent.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (isMarkingViewed) {
            CircularProgressIndicator(strokeWidth = 2.dp, color = BrandStyle.Accent, modifier = Modifier.size(18.dp))
        } else {
            Icon(Icons.Filled.Verified, null, tint = BrandStyle.Accent)
        }
        Text(
            "Your challenge is live. We'll bring their answer into Sent as soon as they reply.",
            style = MaterialTheme.typography.bodyMedium,
            color = BrandStyle.TextSecondary,
        )
    }
}

@Composable
private fun ActionButtons(
    flow: ImpressMeFlow,
    isBusy: Boolean,
    isAccepting: Boolean,
    isDeclining: Boolean,
    onAccept: () -> Unit,
    onDecline: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Button(
            onClick = onAccept,
            enabled = !isBusy,
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
            if (isAccepting) {
                CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp, modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
            }
            Icon(Icons.Filled.CheckCircle, null, tint = Color.White)
            Spacer(Modifier.size(8.dp))
            Text(
                if (flow == ImpressMeFlow.PreMatch) "Accept & Create Match" else "Accept",
                color = Color.White,
            )
        }

        Button(
            onClick = onDecline,
            enabled = !isBusy,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.White.copy(alpha = 0.45f),
                contentColor = BrandStyle.TextSecondary,
            ),
        ) {
            if (isDeclining) {
                CircularProgressIndicator(strokeWidth = 2.dp, color = BrandStyle.TextSecondary,
                    modifier = Modifier.size(18.dp))
                Spacer(Modifier.size(8.dp))
            }
            Text("Pass", color = BrandStyle.TextSecondary)
        }

        if (flow == ImpressMeFlow.PreMatch) {
            Text(
                "Accepting creates the match immediately.",
                style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary,
                modifier = Modifier.fillMaxWidth(),
            )
        }
    }
}

@Composable
private fun ResolvedBanner(status: ImpressMeStatus) {
    val accepted = status == ImpressMeStatus.Accepted
    val tint = if (accepted) Color(0xFF10B981) else BrandStyle.TextSecondary
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(tint.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Icon(if (accepted) Icons.Filled.Verified else Icons.Filled.Cancel, null, tint = tint)
        Text(
            if (accepted) "You accepted this answer âœ¨" else "You passed on this one.",
            style = MaterialTheme.typography.titleSmall,
            color = tint,
        )
    }
}

@Composable
private fun Avatar(url: String?) {
    if (url != null) {
        Box(modifier = Modifier.size(46.dp)) {
            RemoteMediaView(path = url, height = 46.dp, cornerRadius = 23.dp)
        }
    } else {
        Box(
            modifier = Modifier
                .size(46.dp)
                .background(BrandStyle.Secondary.copy(alpha = 0.15f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(Icons.Filled.Person, null, tint = BrandStyle.Secondary)
        }
    }
}
