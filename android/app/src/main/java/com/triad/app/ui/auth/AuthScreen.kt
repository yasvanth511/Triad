package com.triad.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.theme.BrandStyle
import com.triad.app.ui.theme.ScreenBackdrop
import com.triad.app.ui.theme.triadCard
import kotlinx.coroutines.launch

private enum class AuthMode(val label: String) {
    Login("Sign In"),
    Register("Create Account"),
}

@Composable
fun AuthScreen() {
    val session = LocalSessionStore.current
    val isAuthenticating by session.isAuthenticating.collectAsState()
    val scope = rememberCoroutineScope()

    var mode by remember { mutableStateOf(AuthMode.Login) }
    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    val canSubmit = email.trim().isNotEmpty() && password.isNotEmpty() &&
        (mode == AuthMode.Login || username.trim().isNotEmpty())

    Box(modifier = Modifier.fillMaxSize()) {
        ScreenBackdrop {}
        Column(
            modifier = Modifier
                .fillMaxSize()
                .statusBarsPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp, vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Text(
                text = "Triad",
                fontSize = 66.sp,
                fontWeight = FontWeight.Black,
                color = BrandStyle.TextPrimary,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 18.dp, bottom = 6.dp),
            )

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .triadCard(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                    AuthMode.values().forEachIndexed { index, current ->
                        SegmentedButton(
                            selected = mode == current,
                            onClick = { mode = current },
                            shape = SegmentedButtonDefaults.itemShape(
                                index = index,
                                count = AuthMode.values().size,
                            ),
                        ) {
                            Text(current.label)
                        }
                    }
                }

                if (mode == AuthMode.Register) {
                    LabeledTextField(
                        label = "Username",
                        value = username,
                        onValueChange = { username = it },
                        placeholder = "pick-an-alias",
                    )
                }

                LabeledTextField(
                    label = "Email",
                    value = email,
                    onValueChange = { email = it },
                    placeholder = "you@example.com",
                    keyboardType = KeyboardType.Email,
                )

                LabeledTextField(
                    label = "Password",
                    value = password,
                    onValueChange = { password = it },
                    placeholder = "At least 8 characters",
                    keyboardType = KeyboardType.Password,
                    isPassword = true,
                )

                Button(
                    onClick = {
                        scope.launch {
                            when (mode) {
                                AuthMode.Login -> session.login(email.trim(), password)
                                AuthMode.Register -> session.register(
                                    username = username.trim(),
                                    email = email.trim(),
                                    password = password,
                                )
                            }
                        }
                    },
                    enabled = canSubmit && !isAuthenticating,
                    shape = RoundedCornerShape(18.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = BrandStyle.Accent,
                        contentColor = Color.White,
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(BrandStyle.AccentGradient, RoundedCornerShape(18.dp)),
                ) {
                    if (isAuthenticating) {
                        CircularProgressIndicator(color = Color.White, strokeWidth = 2.dp,
                            modifier = Modifier.padding(end = 8.dp))
                    }
                    Text(
                        if (mode == AuthMode.Login) "Sign In" else "Create Account",
                        style = MaterialTheme.typography.titleSmall,
                        modifier = Modifier.padding(vertical = 4.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun LabeledTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    keyboardType: KeyboardType = KeyboardType.Text,
    isPassword: Boolean = false,
) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Text(
            label,
            style = MaterialTheme.typography.labelMedium,
            color = BrandStyle.TextSecondary,
        )
        TextField(
            value = value,
            onValueChange = onValueChange,
            placeholder = { Text(placeholder, color = BrandStyle.TextSecondary) },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.White.copy(alpha = 0.82f),
                unfocusedContainerColor = Color.White.copy(alpha = 0.82f),
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent,
            ),
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            visualTransformation = if (isPassword) PasswordVisualTransformation() else androidx.compose.ui.text.input.VisualTransformation.None,
        )
    }
}
