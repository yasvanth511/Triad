# Triad Android

Native Android client for Triad. Sibling to `IOSNative/ThirdWheelNative` (the
SwiftUI iOS app) and built for full feature parity with it.

The full iOS → Android parity audit lives in
[`docs/android/ios-parity-map.md`](../docs/android/ios-parity-map.md).

## Stack

- Kotlin 2.0 + Jetpack Compose (Material3, single-Activity).
- Coroutines + `StateFlow` for reactive state. No external DI framework — the
  `TriadApplication` exposes the small DI graph (`AppConfig`, `TokenStore`,
  `ApiClient`, `SessionStore`).
- `OkHttp` + `kotlinx.serialization` for HTTP and JSON. We use a small
  hand-rolled `ApiClient` (no Retrofit) so the request/response surface
  mirrors `IOSNative/.../APIClient.swift` line-for-line.
- `Coil` for images. `Media3 / ExoPlayer` for audio bio + highlight playback.
- `accompanist-permissions` for the location permission card.
- `androidx.security:security-crypto` (EncryptedSharedPreferences) for the JWT.

## Repo layout

```
android/
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/triad/app/
│       │   ├── TriadApplication.kt
│       │   ├── MainActivity.kt
│       │   ├── core/                  AppConfig, network/, storage/, location/
│       │   ├── data/                  Models.kt + Requests.kt
│       │   ├── session/SessionStore.kt
│       │   ├── ui/
│       │   │   ├── theme/             BrandStyle, Theme, Type
│       │   │   ├── components/        Reusable cards/badges/players
│       │   │   ├── auth/              AuthScreen
│       │   │   ├── root/              RootScreen + MainScaffold
│       │   │   ├── nav/Routes.kt
│       │   │   ├── discover/          DiscoverScreen
│       │   │   ├── saved/             SavedScreen
│       │   │   ├── matches/           MatchesScreen + MatchChatScreen
│       │   │   ├── impressme/         ImpressMeScreen + Respond + Review
│       │   │   ├── events/            EventsScreen
│       │   │   ├── notifications/     NotificationsScreen
│       │   │   └── profile/           ProfileScreen + Detail + Edit + Couple +
│       │   │                           ReportSheet + VerificationSheet +
│       │   │                           PreferencesRows
│       │   └── util/Dates.kt
│       └── res/                       themes, colors, strings, launcher
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── gradle/libs.versions.toml
```

## Setup

This repo does not include the Gradle wrapper. Bootstrap once before the first
build:

```bash
cd android
gradle wrapper --gradle-version 8.10
```

(Or open the `android/` folder in Android Studio Koala or later — it will
generate the wrapper as part of the initial sync.)

After that, the standard commands work:

```bash
./gradlew :app:assembleDebug
./gradlew :app:installDebug          # to a running emulator
./gradlew :app:lint
./gradlew :app:test
```

## Configuration

The backend origin is read from `BuildConfig.API_BASE_URL` (declared in
`app/build.gradle.kts`). Defaults:

- Emulator: `http://10.0.2.2:5127` (the magic alias for the host machine).
- Override at build time:
  ```bash
  ./gradlew :app:assembleDebug -Ptriad.apiBaseUrl=http://192.168.1.50:5127
  ```

The base URL is appended with `/api` automatically. `usesCleartextTraffic` is
set to `true` so HTTP development backends Just Work; switch to HTTPS for
production builds.

## Running locally end-to-end

1. Start the backend:
   ```bash
   docker compose up -d --build api
   # or: cd backend/ThirdWheel.API && dotnet run
   ```
   The API listens on `http://localhost:5127`.
2. Start an Android emulator with API ≥ 26 (Android 8).
3. From `android/`:
   ```bash
   ./gradlew :app:installDebug
   adb shell monkey -p com.triad.app -c android.intent.category.LAUNCHER 1
   ```

## Notes

- The Android app does not change any backend contracts. Every endpoint it
  hits is enumerated at the bottom of
  [`docs/android/ios-parity-map.md`](../docs/android/ios-parity-map.md).
- Audio bio and highlight upload use the Android Photo Picker (API 33+) and
  `GetContent("audio/*")` for older audio handling. We never request the
  legacy `READ_EXTERNAL_STORAGE` on API 33+.
- We do not register for FCM — push parity matches iOS, which doesn't use APNs
  yet.
- We do not use SignalR realtime — iOS doesn't either; chat is REST polling.
- The Verification flow uses the same placeholder vendor sheet as iOS
  (Approve / In review / Fail) until a real provider SDK is wired up on both
  clients.

## License

Same as the rest of the repo.
