package com.triad.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.CompositionLocalProvider
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.root.RootScreen
import com.triad.app.ui.theme.TriadTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val app = application as TriadApplication
        setContent {
            CompositionLocalProvider(LocalSessionStore provides app.sessionStore) {
                TriadTheme {
                    RootScreen()
                }
            }
        }
    }
}
