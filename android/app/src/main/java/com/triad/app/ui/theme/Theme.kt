package com.triad.app.ui.theme

import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.systemBars
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val TriadColorScheme = lightColorScheme(
    primary = BrandStyle.Accent,
    secondary = BrandStyle.Secondary,
    onPrimary = Color.White,
    onSecondary = Color.White,
    background = BrandStyle.BackdropTopLeft,
    surface = Color.White,
    onBackground = BrandStyle.TextPrimary,
    onSurface = BrandStyle.TextPrimary,
)

@Composable
fun TriadTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = TriadColorScheme,
        typography = TriadTypography,
        content = content,
    )
}

@Suppress("unused")
val TriadSystemBars: WindowInsets
    @Composable get() = WindowInsets.systemBars
