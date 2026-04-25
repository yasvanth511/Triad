package com.triad.app

import android.app.Application
import com.triad.app.core.AppConfig
import com.triad.app.core.network.ApiClient
import com.triad.app.core.storage.TokenStore
import com.triad.app.session.SessionStore

class TriadApplication : Application() {
    val appConfig: AppConfig by lazy { AppConfig.from(BuildConfig.API_BASE_URL) }
    val tokenStore: TokenStore by lazy { TokenStore(applicationContext) }
    val apiClient: ApiClient by lazy { ApiClient(appConfig) }
    val sessionStore: SessionStore by lazy { SessionStore(apiClient, tokenStore) }
}
