package com.triad.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard

/** iOS `EmptyStateCard`. */
@Composable
fun EmptyStateCard(title: String, message: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .triadCard(),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(text = title, color = BrandStyle.TextPrimary,
            style = androidx.compose.material3.MaterialTheme.typography.titleMedium)
        Text(text = message, color = BrandStyle.TextSecondary,
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium)
    }
}
