package com.triad.app.ui.profile

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.LinkOff
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import com.triad.app.data.CoupleStatus
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.SectionHeader
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@Composable
fun CoupleLinkCard() {
    val session = LocalSessionStore.current
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var status by remember { mutableStateOf<CoupleStatus?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var isMutating by remember { mutableStateOf(false) }
    var joinCode by remember { mutableStateOf("") }
    var didCopy by remember { mutableStateOf(false) }
    var showUnlink by remember { mutableStateOf(false) }
    var showCancelInvite by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        isLoading = true
        try {
            status = session.loadCoupleStatus()
        } catch (t: Throwable) {
            errorMessage = t.localizedMessage
        } finally {
            isLoading = false
        }
    }

    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Couple", subtitleFor(status))

        when {
            isLoading && status == null -> {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                    Text("Loading couple status...", color = BrandStyle.TextSecondary)
                }
            }

            status?.isComplete == true -> LinkedState(
                status = status!!,
                isMutating = isMutating,
                onUnlink = { showUnlink = true },
            )

            status?.coupleId != null && !status?.inviteCode.isNullOrBlank() -> WaitingState(
                code = status!!.inviteCode!!,
                didCopy = didCopy,
                isMutating = isMutating,
                onCopy = {
                    val cm = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                    cm.setPrimaryClip(ClipData.newPlainText("Triad invite code", status!!.inviteCode))
                    scope.launch {
                        didCopy = true
                        delay(1800)
                        didCopy = false
                    }
                },
                onShare = {
                    val intent = Intent(Intent.ACTION_SEND).apply {
                        type = "text/plain"
                        putExtra(Intent.EXTRA_TEXT, "Join me on Triad with invite code: ${status!!.inviteCode}")
                    }
                    context.startActivity(Intent.createChooser(intent, "Share invite code"))
                },
                onCancel = { showCancelInvite = true },
            )

            else -> UnlinkedState(
                joinCode = joinCode,
                isMutating = isMutating,
                onJoinCodeChange = { joinCode = it.uppercase() },
                onGenerate = {
                    scope.launch {
                        isMutating = true
                        errorMessage = null
                        try {
                            val response = session.createCouple()
                            status = CoupleStatus(
                                coupleId = response.coupleId,
                                inviteCode = response.inviteCode,
                                isComplete = false,
                                partnerName = null,
                                partnerUserId = null,
                            )
                        } catch (t: Throwable) {
                            errorMessage = t.localizedMessage
                        } finally {
                            isMutating = false
                        }
                    }
                },
                onJoin = {
                    val trimmed = joinCode.trim().uppercase()
                    if (trimmed.isEmpty()) return@UnlinkedState
                    scope.launch {
                        isMutating = true
                        errorMessage = null
                        try {
                            session.joinCouple(trimmed)
                            joinCode = ""
                            status = session.loadCoupleStatus()
                        } catch (t: Throwable) {
                            errorMessage = t.localizedMessage
                        } finally {
                            isMutating = false
                        }
                    }
                },
            )
        }

        errorMessage?.let { Text(it, style = MaterialTheme.typography.labelMedium, color = Color(0xFFEF4444)) }
    }

    if (showUnlink) {
        AlertDialog(
            onDismissRequest = { showUnlink = false },
            confirmButton = {
                TextButton(onClick = {
                    showUnlink = false
                    scope.launch {
                        isMutating = true
                        try {
                            session.leaveCouple()
                            status = CoupleStatus()
                        } catch (t: Throwable) {
                            errorMessage = t.localizedMessage
                        } finally {
                            isMutating = false
                        }
                    }
                }) { Text("Unlink", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { showUnlink = false }) { Text("Cancel") } },
            title = { Text("Unlink your partner?") },
            text = { Text("You'll be shown as single again. Your partner will also be unlinked.") },
        )
    }
    if (showCancelInvite) {
        AlertDialog(
            onDismissRequest = { showCancelInvite = false },
            confirmButton = {
                TextButton(onClick = {
                    showCancelInvite = false
                    scope.launch {
                        isMutating = true
                        try {
                            session.leaveCouple()
                            status = CoupleStatus()
                        } catch (t: Throwable) {
                            errorMessage = t.localizedMessage
                        } finally {
                            isMutating = false
                        }
                    }
                }) { Text("Cancel Invite", color = Color(0xFFEF4444)) }
            },
            dismissButton = { TextButton(onClick = { showCancelInvite = false }) { Text("Keep Code") } },
            title = { Text("Cancel invite?") },
            text = { Text("Your invite code will stop working. You can generate a new one any time.") },
        )
    }
}

private fun subtitleFor(status: CoupleStatus?): String = when {
    status == null -> "Link your account with your partner to appear as a couple."
    status.isComplete -> "You're linked with your partner."
    status.coupleId != null -> "Share your invite code so your partner can join."
    else -> "Generate a code to invite your partner, or enter theirs."
}

@Composable
private fun LinkedState(
    status: CoupleStatus,
    isMutating: Boolean,
    onUnlink: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            Icon(
                Icons.Filled.People,
                null,
                tint = BrandStyle.Secondary,
                modifier = Modifier
                    .size(44.dp)
                    .background(BrandStyle.Secondary.copy(alpha = 0.12f), CircleShape)
                    .padding(10.dp),
            )
            Column(modifier = Modifier.weight(1f)) {
                Text("Linked with", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
                Text(
                    status.partnerName ?: "Your partner",
                    style = MaterialTheme.typography.titleSmall,
                    color = BrandStyle.TextPrimary,
                )
            }
        }
        Button(
            onClick = onUnlink,
            enabled = !isMutating,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFEF4444).copy(alpha = 0.08f),
                contentColor = Color(0xFFEF4444),
            ),
            shape = RoundedCornerShape(14.dp),
        ) {
            if (isMutating) CircularProgressIndicator(strokeWidth = 2.dp, color = Color(0xFFEF4444),
                modifier = Modifier.size(14.dp))
            Icon(Icons.Filled.LinkOff, null, tint = Color(0xFFEF4444))
            Text("Unlink Partner")
        }
    }
}

@Composable
private fun WaitingState(
    code: String,
    didCopy: Boolean,
    isMutating: Boolean,
    onCopy: () -> Unit,
    onShare: () -> Unit,
    onCancel: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text("Your Invite Code", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(BrandStyle.Accent.copy(alpha = 0.08f), RoundedCornerShape(16.dp))
                    .padding(horizontal = 16.dp, vertical = 18.dp),
            ) {
                Text(
                    code,
                    style = MaterialTheme.typography.headlineMedium,
                    color = BrandStyle.TextPrimary,
                )
            }
        }
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            Button(
                onClick = onCopy,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandStyle.Accent.copy(alpha = 0.12f),
                    contentColor = BrandStyle.Accent,
                ),
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(if (didCopy) Icons.Filled.Check else Icons.Filled.ContentCopy, null, tint = BrandStyle.Accent)
                Text(if (didCopy) "Copied" else "Copy")
            }
            Button(
                onClick = onShare,
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = BrandStyle.Secondary.copy(alpha = 0.12f),
                    contentColor = BrandStyle.Secondary,
                ),
                shape = RoundedCornerShape(14.dp),
            ) {
                Icon(Icons.Filled.Share, null, tint = BrandStyle.Secondary)
                Text("Share")
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            CircularProgressIndicator(strokeWidth = 2.dp, color = BrandStyle.TextSecondary,
                modifier = Modifier.size(12.dp))
            Text("Waiting for partner to joinâ€¦", style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary)
        }
        Button(
            onClick = onCancel,
            enabled = !isMutating,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFEF4444).copy(alpha = 0.08f),
                contentColor = Color(0xFFEF4444),
            ),
            shape = RoundedCornerShape(14.dp),
        ) {
            Text("Cancel Invite")
        }
    }
}

@Composable
private fun UnlinkedState(
    joinCode: String,
    isMutating: Boolean,
    onJoinCodeChange: (String) -> Unit,
    onGenerate: () -> Unit,
    onJoin: () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Button(
            onClick = onGenerate,
            enabled = !isMutating,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = BrandStyle.Accent, contentColor = Color.White),
            shape = RoundedCornerShape(18.dp),
        ) {
            if (isMutating) CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                modifier = Modifier.size(14.dp))
            Icon(Icons.Filled.PersonAdd, null, tint = Color.White)
            Text("Generate Invite Code")
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Box(modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(BrandStyle.TextSecondary.copy(alpha = 0.25f)))
            Text("or", modifier = Modifier.padding(horizontal = 10.dp),
                style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
            Box(modifier = Modifier
                .weight(1f)
                .height(1.dp)
                .background(BrandStyle.TextSecondary.copy(alpha = 0.25f)))
        }

        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Enter Your Partner's Code", style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                TextField(
                    value = joinCode,
                    onValueChange = onJoinCodeChange,
                    placeholder = { Text("e.g. A2B4K7P9", color = BrandStyle.TextSecondary) },
                    modifier = Modifier.weight(1f),
                    shape = RoundedCornerShape(12.dp),
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters),
                    singleLine = true,
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = BrandStyle.TextSecondary.copy(alpha = 0.08f),
                        unfocusedContainerColor = BrandStyle.TextSecondary.copy(alpha = 0.08f),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                    ),
                )
                Button(
                    onClick = onJoin,
                    enabled = !isMutating && joinCode.trim().isNotEmpty(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandStyle.Secondary,
                        contentColor = Color.White,
                    ),
                    shape = RoundedCornerShape(12.dp),
                ) {
                    if (isMutating) {
                        CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                            modifier = Modifier.size(14.dp))
                    } else {
                        Text("Link")
                    }
                }
            }
        }
    }
}
