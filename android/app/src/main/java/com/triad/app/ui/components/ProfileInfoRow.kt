package com.triad.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.triad.app.ui.theme.BrandStyle

/** iOS `ProfileInfoRow` / `ProfileDetailRow`. */
@Composable
fun ProfileInfoRow(icon: ImageVector, title: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(
            icon,
            contentDescription = null,
            tint = BrandStyle.Accent,
            modifier = Modifier
                .size(38.dp)
                .background(BrandStyle.Accent.copy(alpha = 0.12f), RoundedCornerShape(14.dp))
                .padding(8.dp),
        )
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Text(
                title,
                style = MaterialTheme.typography.labelMedium,
                color = BrandStyle.TextSecondary,
            )
            Text(
                value,
                style = MaterialTheme.typography.bodyMedium,
                color = BrandStyle.TextPrimary,
            )
        }
        Spacer(Modifier.weight(0f))
    }
}

@Composable
fun SectionHeader(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(title, style = MaterialTheme.typography.titleMedium, color = BrandStyle.TextPrimary)
        Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = BrandStyle.TextSecondary)
    }
}
