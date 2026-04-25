package com.triad.app.ui.matches

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import com.triad.app.data.MatchItem
import com.triad.app.data.MessageItem
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.components.EmptyStateCard
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.util.Dates
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchChatScreen(navController: NavController, matchId: String) {
    val session = LocalSessionStore.current
    val currentUser by session.currentUser.collectAsState()
    val scope = rememberCoroutineScope()

    var match by remember { mutableStateOf<MatchItem?>(null) }
    val messages: SnapshotStateList<MessageItem> =
        remember { mutableListOf<MessageItem>().toMutableStateList() }
    var draft by remember { mutableStateOf("") }
    var isLoading by remember { mutableStateOf(false) }
    var isSending by remember { mutableStateOf(false) }
    var isSendingImpressMe by remember { mutableStateOf(false) }
    var notice by remember { mutableStateOf<String?>(null) }
    var profilesMenuOpen by remember { mutableStateOf(false) }

    val listState = rememberLazyListState()

    LaunchedEffect(matchId) {
        isLoading = true
        try {
            // Hydrate the match from the server's match list (we don't have a single-match endpoint).
            val all = session.loadMatches()
            match = all.firstOrNull { it.matchId == matchId }
            messages.clear()
            messages.addAll(session.loadMessages(matchId))
        } catch (t: Throwable) {
            session.presentError(t)
        } finally {
            isLoading = false
        }
    }

    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    val title = match?.participants?.joinToString(", ") { it.username } ?: "Chat"

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(modifier = Modifier
            .fillMaxSize()
            .statusBarsPadding()
            .imePadding()) {
            TopAppBar(
                title = { Text(title, style = MaterialTheme.typography.titleMedium) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(
                        enabled = !isSendingImpressMe && match != null,
                        onClick = {
                            val target = match?.participants?.firstOrNull() ?: return@IconButton
                            isSendingImpressMe = true
                            scope.launch {
                                try {
                                    session.sendImpressMe(target.userId, matchId)
                                    notice = "Impress Me sent to ${target.username}. We'll surface their answer in Sent."
                                } catch (t: Throwable) {
                                    session.presentError(t)
                                } finally {
                                    isSendingImpressMe = false
                                }
                            }
                        },
                    ) {
                        if (isSendingImpressMe) {
                            CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(20.dp))
                        } else {
                            Icon(Icons.Filled.AutoAwesome, contentDescription = "Send Impress Me")
                        }
                    }

                    val participants = match?.participants.orEmpty()
                    if (participants.size == 1) {
                        IconButton(onClick = {
                            navController.navigate(Routes.profileDetail(participants.first().userId))
                        }) {
                            Icon(Icons.Filled.Person, contentDescription = "Open profile")
                        }
                    } else if (participants.size > 1) {
                        Box {
                            IconButton(onClick = { profilesMenuOpen = true }) {
                                Icon(Icons.Filled.Person, contentDescription = "Open profile")
                            }
                            DropdownMenu(
                                expanded = profilesMenuOpen,
                                onDismissRequest = { profilesMenuOpen = false },
                            ) {
                                participants.forEach { p ->
                                    DropdownMenuItem(
                                        text = { Text(p.username) },
                                        onClick = {
                                            profilesMenuOpen = false
                                            navController.navigate(Routes.profileDetail(p.userId))
                                        },
                                    )
                                }
                            }
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
            )

            Box(modifier = Modifier
                .weight(1f)
                .fillMaxWidth()) {
                if (isLoading && messages.isEmpty()) {
                    Row(verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.padding(20.dp)) {
                        CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 2.dp)
                        Text("Loading conversation...", color = BrandStyle.TextSecondary)
                    }
                } else if (notice != null) {
                    Box(modifier = Modifier.padding(20.dp)) {
                        EmptyStateCard("Update", notice!!)
                    }
                } else if (messages.isEmpty()) {
                    Box(modifier = Modifier.padding(20.dp)) {
                        EmptyStateCard("No messages yet", "Say hi to start the conversation.")
                    }
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        items(messages, key = { it.id }) { message ->
                            MessageBubble(
                                message = message,
                                isCurrentUser = message.senderId == currentUser?.id,
                            )
                        }
                    }
                }
            }

            // Composer
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 14.dp),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                TextField(
                    value = draft,
                    onValueChange = { draft = it },
                    placeholder = { Text("Send a message", color = BrandStyle.TextSecondary) },
                    modifier = Modifier
                        .weight(1f)
                        .border(1.dp, BrandStyle.CardBorder, RoundedCornerShape(18.dp)),
                    shape = RoundedCornerShape(18.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.White.copy(alpha = 0.82f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.82f),
                        focusedIndicatorColor = Color.Transparent,
                        unfocusedIndicatorColor = Color.Transparent,
                    ),
                    maxLines = 4,
                )
                IconButton(
                    enabled = draft.trim().isNotEmpty() && !isSending,
                    onClick = {
                        val text = draft.trim()
                        if (text.isEmpty()) return@IconButton
                        isSending = true
                        scope.launch {
                            try {
                                val message = session.sendMessage(matchId, text)
                                draft = ""
                                messages.add(message)
                            } catch (t: Throwable) {
                                session.presentError(t)
                            } finally {
                                isSending = false
                            }
                        }
                    },
                    modifier = Modifier
                        .size(46.dp)
                        .background(BrandStyle.Accent, CircleShape),
                ) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send", tint = Color.White)
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: MessageItem, isCurrentUser: Boolean) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isCurrentUser) Alignment.End else Alignment.Start,
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(
            if (isCurrentUser) "You" else message.senderUsername,
            style = MaterialTheme.typography.labelSmall,
            color = BrandStyle.TextSecondary,
        )
        Text(
            message.content,
            style = MaterialTheme.typography.bodyMedium,
            color = if (isCurrentUser) Color.White else BrandStyle.TextPrimary,
            modifier = Modifier
                .background(
                    if (isCurrentUser) BrandStyle.Accent else Color.White.copy(alpha = 0.82f),
                    RoundedCornerShape(18.dp),
                )
                .padding(horizontal = 14.dp, vertical = 10.dp),
        )
        Text(
            Dates.shortTime(message.sentAt),
            style = MaterialTheme.typography.labelSmall,
            color = BrandStyle.TextSecondary,
        )
        Spacer(Modifier.size(0.dp))
    }
}
