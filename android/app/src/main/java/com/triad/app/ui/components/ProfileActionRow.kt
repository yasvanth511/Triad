package com.triad.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.Error
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.triad.app.ui.theme.BrandStyle

/** Mirrors iOS `ProfileActionRow` / `ProfileDetailActionRow`. */
@Composable
fun ProfileActionRow(
    title: String,
    subtitle: String,
    icon: ImageVector,
    tint: Color,
    isDestructive: Boolean = false,
    isDisabled: Boolean = false,
    onClick: () -> Unit,
) {
    val container = Color.White.copy(alpha = 0.48f)
    val border = Color.White.copy(alpha = 0.42f)

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(container, RoundedCornerShape(22.dp))
            .border(1.dp, border, RoundedCornerShape(22.dp))
            .clickable(enabled = !isDisabled, onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = tint,
            modifier = Modifier
                .size(42.dp)
                .background(
                    tint.copy(alpha = if (isDestructive) 0.14f else 0.12f),
                    RoundedCornerShape(16.dp),
                )
                .padding(10.dp),
        )
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(3.dp),
        ) {
            Text(
                title,
                style = MaterialTheme.typography.titleSmall,
                color = if (isDestructive) Color(0xFFE11D48) else BrandStyle.TextPrimary,
            )
            Text(
                subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = BrandStyle.TextSecondary,
            )
        }
        if (isDisabled) {
            CircularProgressIndicator(modifier = Modifier.size(18.dp), color = tint, strokeWidth = 2.dp)
        } else {
            Icon(
                if (isDestructive) Icons.Filled.Error else Icons.AutoMirrored.Filled.KeyboardArrowRight,
                contentDescription = null,
                tint = if (isDestructive) Color(0xFFE11D48).copy(alpha = 0.9f) else BrandStyle.TextSecondary,
            )
        }
    }
}
