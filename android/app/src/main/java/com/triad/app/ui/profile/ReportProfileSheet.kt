package com.triad.app.ui.profile

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExposedDropdownMenuBox
import androidx.compose.material3.ExposedDropdownMenuDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.theme.BrandStyle
import kotlinx.coroutines.launch

private enum class ReportReason(val label: String, val helper: String) {
    Spam("Spam", "Repeated unwanted promos, links, or low-quality blasts."),
    Harassment("Harassment", "Abusive, threatening, or uncomfortable behavior."),
    FakeProfile("Fake Profile", "Impersonation, stolen photos, or misleading identity."),
    Scam("Scam", "Money asks, manipulation, or suspicious off-platform behavior."),
    Other("Other", "Anything else that should be reviewed."),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReportProfileSheet(
    userId: String,
    username: String,
    onSubmitted: (String) -> Unit,
    onDismiss: () -> Unit,
) {
    val session = LocalSessionStore.current
    val scope = rememberCoroutineScope()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var reason by remember { mutableStateOf(ReportReason.Spam) }
    var details by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var dropdownOpen by remember { mutableStateOf(false) }

    val trimmed = details.trim().take(500)

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Text("Report $username", style = MaterialTheme.typography.titleLarge, color = BrandStyle.TextPrimary)
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Reason", style = MaterialTheme.typography.labelMedium, color = BrandStyle.TextSecondary)
                ExposedDropdownMenuBox(expanded = dropdownOpen, onExpandedChange = { dropdownOpen = !dropdownOpen }) {
                    TextField(
                        value = reason.label,
                        onValueChange = {},
                        readOnly = true,
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = dropdownOpen) },
                        shape = RoundedCornerShape(12.dp),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color.White.copy(alpha = 0.85f),
                            unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                        ),
                    )
                    androidx.compose.material3.DropdownMenu(
                        expanded = dropdownOpen,
                        onDismissRequest = { dropdownOpen = false },
                    ) {
                        ReportReason.values().forEach { option ->
                            DropdownMenuItem(
                                text = { Text(option.label) },
                                onClick = {
                                    reason = option
                                    dropdownOpen = false
                                },
                            )
                        }
                    }
                }
                Text(reason.helper, style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary)
            }

            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Additional Details", style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary)
                TextField(
                    value = details,
                    onValueChange = { details = it.take(500) },
                    placeholder = { Text("Share a little context if it helps moderation.") },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = TextFieldDefaults.colors(
                        focusedContainerColor = Color.White.copy(alpha = 0.85f),
                        unfocusedContainerColor = Color.White.copy(alpha = 0.85f),
                        focusedIndicatorColor = BrandStyle.Accent,
                        unfocusedIndicatorColor = BrandStyle.CardBorder,
                    ),
                )
                Text("${trimmed.length}/500", style = MaterialTheme.typography.labelMedium,
                    color = BrandStyle.TextSecondary)
            }

            Button(
                onClick = {
                    scope.launch {
                        isSubmitting = true
                        try {
                            session.report(
                                userId = userId,
                                reason = reason.label,
                                details = trimmed.ifBlank { null },
                            )
                            onSubmitted("Report submitted for $username.")
                        } catch (t: Throwable) {
                            session.presentError(t)
                        } finally {
                            isSubmitting = false
                        }
                    }
                },
                enabled = !isSubmitting,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = BrandStyle.Accent, contentColor = Color.White),
                shape = RoundedCornerShape(14.dp),
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(strokeWidth = 2.dp, color = Color.White,
                        modifier = Modifier.padding(end = 8.dp))
                }
                Text(if (isSubmitting) "Sending..." else "Submit")
            }
            TextButton(onClick = onDismiss, modifier = Modifier.fillMaxWidth()) { Text("Cancel") }
        }
    }
}
