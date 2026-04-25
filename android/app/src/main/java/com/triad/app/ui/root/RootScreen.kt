package com.triad.app.ui.root

import androidx.compose.animation.Crossfade
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.triad.app.session.LocalSessionStore
import com.triad.app.session.SessionStore
import com.triad.app.ui.auth.AuthScreen
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.ui.theme.triadCard

/**
 * iOS `RootView` equivalent: gates the UI on the session phase and shows a
 * single error dialog driven by [SessionStore.lastErrorMessage].
 */
@Composable
fun RootScreen() {
    val session = LocalSessionStore.current
    val phase by session.phase.collectAsState()
    val error by session.lastErrorMessage.collectAsState()

    LaunchedEffect(Unit) {
        session.bootstrapIfNeeded()
    }

    Box(modifier = Modifier.fillMaxSize()) {
        Crossfade(targetState = phase, label = "root_phase") { current ->
            when (current) {
                SessionStore.Phase.Loading -> LoadingState()
                SessionStore.Phase.SignedOut -> AuthScreen()
                SessionStore.Phase.Authenticated -> MainScaffold()
            }
        }

        if (error != null) {
            AlertDialog(
                onDismissRequest = { session.clearError() },
                confirmButton = {
                    TextButton(onClick = { session.clearError() }) { Text("OK") }
                },
                title = { Text("Something went wrong") },
                text = { Text(error.orEmpty()) },
            )
        }
    }
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            contentAlignment = Alignment.Center,
        ) {
            Box(modifier = Modifier.triadCard()) {
                CircularProgressIndicator(color = BrandStyle.Accent, strokeWidth = 3.dp)
            }
        }
    }
}
