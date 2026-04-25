package com.triad.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.triad.app.data.VerificationMethod
import com.triad.app.ui.components.SectionBadge
import com.triad.app.ui.components.SectionHeader
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.triadCard

@Composable
fun ProfileVerificationsCard(
    methods: List<VerificationMethod>,
    startingKey: String?,
    onStart: (VerificationMethod) -> Unit,
) {
    Column(
        modifier = Modifier.fillMaxWidth().triadCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SectionHeader("Verifications", "Add trust signals to your profile.")
        methods.forEach { method ->
            VerificationRow(
                method = method,
                tint = verificationTint(method),
                isLoading = startingKey == method.key,
                onStart = if (method.canStart) ({ onStart(method) }) else null,
            )
        }
    }
}

@Composable
private fun VerificationRow(
    method: VerificationMethod,
    tint: Color,
    isLoading: Boolean,
    onStart: (() -> Unit)?,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White.copy(alpha = 0.48f), RoundedCornerShape(22.dp))
            .border(1.dp, Color.White.copy(alpha = 0.42f), RoundedCornerShape(22.dp))
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Icon(
            if (method.isVerified) Icons.Filled.Verified else Icons.Filled.Shield,
            contentDescription = null,
            tint = tint,
            modifier = Modifier
                .size(42.dp)
                .background(tint.copy(alpha = 0.12f), RoundedCornerShape(16.dp))
                .padding(10.dp),
        )
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                method.displayName,
                style = MaterialTheme.typography.titleSmall,
                color = BrandStyle.TextPrimary,
            )
            val helper = if (onStart != null) {
                method.failureReason ?: "Complete verification to add this badge to your profile."
            } else {
                method.failureReason ?: method.ineligibilityReason ?: method.displayStatus
            }
            Text(helper, style = MaterialTheme.typography.bodySmall, color = BrandStyle.TextSecondary)
        }
        Spacer(Modifier.size(8.dp))
        if (onStart != null) {
            Button(
                onClick = onStart,
                enabled = !isLoading,
                colors = ButtonDefaults.buttonColors(containerColor = tint, contentColor = Color.White),
            ) {
                if (isLoading) {
                    CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                        modifier = Modifier.size(14.dp))
                } else {
                    Text("Get ${method.displayName}", style = MaterialTheme.typography.labelMedium)
                }
            }
        } else {
            SectionBadge(
                if (method.isVerified) method.displayName else method.displayStatus,
                if (method.isVerified) tint else BrandStyle.TextSecondary,
                icon = if (method.isVerified) Icons.Filled.Verified else null,
            )
        }
    }
}
