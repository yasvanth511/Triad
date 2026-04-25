package com.triad.app.ui.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.triad.app.ui.theme.BrandStyle

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun VerificationVendorSheet(
    flow: ActiveVerificationFlow,
    onComplete: (decision: String, providerReference: String) -> Unit,
    onDismiss: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(
                    flow.method.displayName,
                    style = MaterialTheme.typography.titleLarge,
                    color = BrandStyle.TextPrimary,
                )
                Text(
                    "Vendor session started with client token:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = BrandStyle.TextSecondary,
                )
                Text(
                    flow.clientToken,
                    style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextPrimary,
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Color.White.copy(alpha = 0.72f), RoundedCornerShape(16.dp))
                        .padding(12.dp),
                )
            }
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ActionButton(
                    title = "Approve",
                    color = Color(0xFF10B981),
                    onClick = {
                        onComplete("approved", "${flow.providerReferencePrefix}_${flow.attemptId.take(8)}")
                    },
                )
                ActionButton(
                    title = "Send To Review",
                    color = BrandStyle.Accent,
                    onClick = {
                        onComplete("in_review", "${flow.providerReferencePrefix}_${flow.attemptId.take(8)}")
                    },
                )
                ActionButton(
                    title = "Fail",
                    color = Color(0xFFEF4444),
                    onClick = {
                        onComplete("failed", "${flow.providerReferencePrefix}_${flow.attemptId.take(8)}")
                    },
                )
            }
        }
    }
}

@Composable
private fun ActionButton(title: String, color: Color, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        colors = ButtonDefaults.buttonColors(containerColor = color, contentColor = Color.White),
    ) {
        Text(title, style = MaterialTheme.typography.titleSmall)
    }
}
