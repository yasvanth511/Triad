package com.triad.app.ui.theme

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/** Mirrors iOS `BrandStyle.swift` color tokens and gradients. */
object BrandStyle {
    val Accent = Color(red = 125, green = 59, blue = 237)         // 0.49, 0.23, 0.93
    val Secondary = Color(red = 219, green = 38, blue = 120)      // 0.86, 0.15, 0.47
    val TextPrimary = Color(red = 31, green = 18, blue = 51)      // 0.12, 0.07, 0.20
    val TextSecondary = Color(red = 110, green = 92, blue = 138)  // 0.43, 0.36, 0.54
    val CardFill = Color.White.copy(alpha = 0.76f)
    val CardBorder = Color.White.copy(alpha = 0.55f)

    val BackdropTopLeft = Color(red = 250, green = 245, blue = 255)
    val BackdropMiddle = Color(red = 252, green = 242, blue = 247)
    val BackdropBottomRight = Color(red = 242, green = 247, blue = 255)

    val BackdropGradient: Brush = Brush.linearGradient(
        colors = listOf(BackdropTopLeft, BackdropMiddle, BackdropBottomRight),
    )

    val AccentGradient: Brush = Brush.horizontalGradient(
        colors = listOf(Accent, Secondary),
    )
}

/** Equivalent of iOS `triadCard()` modifier. */
fun Modifier.triadCard(
    cornerRadius: androidx.compose.ui.unit.Dp = 26.dp,
    padding: androidx.compose.ui.unit.Dp = 18.dp,
): Modifier = this
    .shadow(
        elevation = 12.dp,
        shape = RoundedCornerShape(cornerRadius),
        ambientColor = Color.Black.copy(alpha = 0.08f),
        spotColor = Color.Black.copy(alpha = 0.08f),
        clip = false,
    )
    .background(BrandStyle.CardFill, RoundedCornerShape(cornerRadius))
    .border(1.dp, BrandStyle.CardBorder, RoundedCornerShape(cornerRadius))
    .padding(padding)

/** Equivalent of iOS `ScreenBackdrop` view. */
@Composable
fun ScreenBackdrop(content: @Composable () -> Unit) {
    Surface(modifier = Modifier.fillMaxSize(), color = Color.Transparent) {
        Box(
            Modifier
                .fillMaxSize()
                .background(BrandStyle.BackdropGradient),
        ) {
            // Top-left soft accent blob
            Box(
                Modifier
                    .offset(x = (-120).dp, y = (-240).dp)
                    .size(240.dp)
                    .background(BrandStyle.Accent.copy(alpha = 0.14f), CircleShape),
            )
            // Top-right soft secondary blob
            Box(
                Modifier
                    .offset(x = 150.dp, y = (-180).dp)
                    .size(280.dp)
                    .background(BrandStyle.Secondary.copy(alpha = 0.14f), CircleShape),
            )
            // Bottom soft blue blob
            Box(
                Modifier
                    .offset(x = 110.dp, y = 420.dp)
                    .size(220.dp)
                    .background(Color(0xFF3B82F6).copy(alpha = 0.10f), CircleShape),
            )

            content()
        }
    }
}
