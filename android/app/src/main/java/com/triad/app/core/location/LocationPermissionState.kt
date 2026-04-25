package com.triad.app.core.location

import android.Manifest
import androidx.compose.runtime.Composable
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.PermissionStatus
import com.google.accompanist.permissions.rememberMultiplePermissionsState

/** Mirrors iOS `LocationPermissionManager`. */
data class TriadLocationPermissionState(
    val isAuthorized: Boolean,
    val statusDescription: String,
    val onRequest: () -> Unit,
)

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun rememberTriadLocationPermissionState(): TriadLocationPermissionState {
    val state = rememberMultiplePermissionsState(
        listOf(
            Manifest.permission.ACCESS_COARSE_LOCATION,
            Manifest.permission.ACCESS_FINE_LOCATION,
        ),
    )

    val granted = state.permissions.any { it.status is PermissionStatus.Granted }
    val anyDenied = state.permissions.any {
        val s = it.status
        s is PermissionStatus.Denied && !s.shouldShowRationale
    }
    val description = when {
        granted -> "Allowed while using the app"
        anyDenied -> "Denied"
        else -> "Not requested"
    }
    return TriadLocationPermissionState(
        isAuthorized = granted,
        statusDescription = description,
        onRequest = { state.launchMultiplePermissionRequest() },
    )
}
