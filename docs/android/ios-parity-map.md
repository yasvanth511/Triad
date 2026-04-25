# iOS → Android Parity Map

Source of truth for the Android native app's feature parity with the iOS native app
at `IOSNative/ThirdWheelNative`. Updated as of 2026-04-25 against the iOS sources at
that same date.

| Status | Meaning |
| --- | --- |
| ✅ implemented | Feature is fully implemented on Android with equivalent flow/UI/state. |
| 🟡 partial | Feature is on-screen but a sub-state needs a real device to validate. |
| 🚧 blocked | Cannot match iOS without backend/SDK work; documented inline. |

All Android files live under `android/app/src/main/java/com/triad/app/`.
The "Android equivalent" column drops that prefix for brevity.

## Authentication

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Sign in (email/password) | `AuthView.swift`, `SessionStore.login`, `Models.LoginRequest` | `ui/auth/AuthScreen.kt`, `session/SessionStore.login`, `data/Requests.LoginRequest` | ✅ | `POST /api/auth/login` | Same fields, same validation (email + password non-empty). |
| Register | `AuthView.swift`, `SessionStore.register`, `Models.RegisterRequest` | `ui/auth/AuthScreen.kt`, `session/SessionStore.register`, `data/Requests.RegisterRequest` | ✅ | `POST /api/auth/register` | Username + email + password ≥ 1 char (server enforces 8+ on password). |
| Persist session | `KeychainTokenStore.swift`, `SessionStore.bootstrapIfNeeded` | `core/storage/TokenStore.kt`, `session/SessionStore.bootstrap` | ✅ | `GET /api/profile` (token check) | Android uses EncryptedSharedPreferences (Keystore-backed) instead of Keychain. |
| Sign out | `SessionStore.signOut` | `session/SessionStore.signOut` | ✅ | local | Clears token + cached state. |
| Mode toggle (Sign in / Create account) | `AuthView.Mode` | `ui/auth/AuthScreen.AuthMode` | ✅ | n/a | Segmented control → SegmentedButton. |
| Brand splash + gradient backdrop | `AuthView` body | `ui/auth/AuthScreen.kt` | ✅ | n/a | Same gradient scheme. |
| Error banner (alert) | `RootView.alert` | `ui/root/RootScreen.kt` (TriadErrorDialog) | ✅ | n/a | Uses Compose `AlertDialog`. |

## Root / Session Gate / Tab Shell

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Loading / signed-out / authenticated phases | `RootView.body`, `SessionStore.Phase` | `ui/root/RootScreen.kt`, `session/SessionStore.Phase` | ✅ | n/a | |
| Bottom nav (Discover, Saved, Matches, Impress, More→Events) | `MainTabView` | `ui/root/MainScaffold.kt` | ✅ | n/a | Bottom navigation rail using Material3 `NavigationBar`. "More" presents Events as a popup item. |
| Top bar with brand title + bell + profile | `MainTabView.profileToolbarButton` | `ui/root/MainScaffold.MainTopBar` | ✅ | n/a | |
| Notification badge on bell icon | `MainTabView.toolbarIcon(badgeCount)` | `ui/root/MainScaffold.BadgedIconButton` | ✅ | `GET /api/notifications` | |
| Impress Me badge on tab | `MainTabView.tabBarButton(badgeCount)` | `ui/root/MainScaffold` | ✅ | `GET /api/impress-me/summary` | |
| Periodic Impress Me + notification refresh | `MainTabView.task` (30s loop) | `session/SessionStore.startBackgroundRefresh` | ✅ | `GET /api/impress-me/summary`, `GET /api/notifications?take=1` | Lifecycle-aware via `LaunchedEffect` keyed on auth phase. |
| All tabs kept alive | `ZStack { ... .opacity }` | `Crossfade` + remembered NavController per-tab `SaveableStateHolder` | ✅ | n/a | Android uses single `NavHost` with state-saving across tab switches. |

## Discover

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| List discovery cards | `DiscoverView.body` | `ui/discover/DiscoverScreen.kt` | ✅ | `GET /api/discovery?skip&take&userType` | |
| Audience filter (All / Singles / Couples) | `DiscoverView.Audience` | `ui/discover/DiscoverScreen.Audience` | ✅ | query param `userType` | |
| Location permission card | `DiscoverView` + `LocationPermissionManager` | `ui/discover/LocationPermissionCard.kt` + `core/location/LocationPermissionState.kt` | ✅ | n/a | Uses `accompanist-permissions` API for `ACCESS_COARSE_LOCATION`. |
| Skip card (X) | `DiscoverView.removeCard` | `ui/discover/DiscoverScreen.kt` | ✅ | local | |
| Save (bookmark) | `SessionStore.saveProfile` | `session/SessionStore.saveProfile` | ✅ | `POST /api/saved` | |
| Like (heart) | `SessionStore.like` | `session/SessionStore.like` | ✅ | `POST /api/match/like` | Returns LikeResult with `matched` flag → user notice copy. |
| Distance + city/state badges | `DiscoverView.discoverCardSummary` | `ui/components/DiscoverCardSummary.kt` | ✅ | n/a | |
| Red-flag interest highlighting | `DiscoverView.viewerRedFlags` | `ui/components/InterestBadgeList.kt` | ✅ | n/a | |
| Empty + loading + notice states | `DiscoverView` | `ui/discover/DiscoverScreen.kt` | ✅ | n/a | |
| Pull-to-refresh | `.refreshable` | `PullToRefreshBox` | ✅ | n/a | |
| Open profile detail | NavigationLink → `ProfileDetailView` | `nav/Navigation.kt` route `profile/{id}` | ✅ | `GET /api/profile/{id}` | |

## Saved Profiles

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| List saved profiles | `SavedProfilesView` | `ui/saved/SavedScreen.kt` | ✅ | `GET /api/saved` | |
| Remove saved | `SessionStore.removeSavedProfile` | `session/SessionStore.removeSavedProfile` | ✅ | `DELETE /api/saved/{userId}` | |
| Like from saved | `SessionStore.like` | `session/SessionStore.like` | ✅ | `POST /api/match/like` | |
| Block-cleanup callback | `onBlocked` | `onBlocked` lambda passed to nav | ✅ | n/a | Removes the row when block returns. |
| Empty + loading + notice states | iOS view | Android screen | ✅ | n/a | |
| Saved date label | `SectionBadge("Saved …")` | `ui/components/SectionBadge.kt` | ✅ | n/a | |

## Matches & Chat

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Matches list | `MatchesView` | `ui/matches/MatchesScreen.kt` | ✅ | `GET /api/match` | |
| Group/couple match badge | `match.isGroupChat` | `ui/matches/MatchesScreen.kt` | ✅ | n/a | "Group" vs "Direct" pill same as iOS. |
| Match avatar | `RemoteMediaView` over first photo | `ui/components/RemoteMediaView.kt` | ✅ | n/a | |
| Open chat | `MatchChatView` | `ui/matches/MatchChatScreen.kt` | ✅ | `GET /api/message/{matchId}` | |
| Send message | `SessionStore.sendMessage` | `session/SessionStore.sendMessage` | ✅ | `POST /api/message/{matchId}` | |
| Send "Impress Me" from chat | `MatchChatView.sendImpressMe` | `ui/matches/MatchChatScreen.kt` | ✅ | `POST /api/impress-me` | |
| Per-participant profile menu | `profileNavigationControl` (Menu when >1) | `ui/matches/MatchChatScreen.kt` `DropdownMenu` | ✅ | n/a | |
| Message bubble alignment | bubbles aligned by sender | `ui/matches/MessageBubble.kt` | ✅ | n/a | |
| Composer keyboard handling | `safeAreaInset` + `axis: .vertical` | `imePadding()` + adjustResize | ✅ | n/a | Android uses `WindowInsets.imeAnimationSource` + `imePadding`. |
| Empty conversation state | `EmptyStateCard` | `ui/components/EmptyStateCard.kt` | ✅ | n/a | |
| Auto-scroll to last message | `proxy.scrollTo(lastId)` | `LazyListState.animateScrollToItem` | ✅ | n/a | |
| Unread-count surfacing | iOS uses notification unread count; per-thread unread is not surfaced today | matches iOS | 🟡 | `GET /api/notifications` | iOS does not show per-thread unread; we match that. Per-thread unread requires a backend endpoint that is not exposed. Documented as residual risk. |
| SignalR realtime push | iOS does NOT use SignalR yet — REST only | matches iOS | ✅ | REST only | Backend hub `/hubs/chat` exists but iOS does REST polling on open; Android matches REST behavior. |

## Impress Me

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Inbox tabs (Received/Sent) | `ImpressMeView` | `ui/impressme/ImpressMeScreen.kt` | ✅ | `GET /api/impress-me/inbox` | |
| Tab badges (unread + sent-needs-review) | `ImpressMeView.tabPicker` | same | ✅ | summary derived | |
| Signal cards with prompt + status pill + timer | `ImpressMeSignalCard` | `ui/impressme/ImpressMeSignalCard.kt` | ✅ | n/a | |
| Send Impress Me from profile | `ProfileDetailView.sendImpressMe` | `ui/profile/ProfileDetailScreen.kt` | ✅ | `POST /api/impress-me` | "Challenge Sent" copy preserved. |
| Pending sent state ("Challenge Sent") | `ProfileDetailView.pendingSentImpressMeSignal` | same logic in Android | ✅ | `GET /api/impress-me/inbox` (sent filter) | |
| Respond view (10–1000 chars) | `ImpressMeRespondView` | `ui/impressme/ImpressMeRespondScreen.kt` | ✅ | `POST /api/impress-me/{id}/respond` | Same min/max validation; same character counter. |
| Review view + accept/decline + auto-mark-viewed | `ImpressMeReviewView` | `ui/impressme/ImpressMeReviewScreen.kt` | ✅ | `POST /api/impress-me/{id}/review`, `/accept`, `/decline` | Confirmation dialog mirrors iOS confirmation dialog. |
| Sender context note | `signal.prompt.senderContext` | rendered in respond + detail | ✅ | n/a | |
| Status banners (accepted / declined / expired) | `ImpressMeReviewView.resolvedBanner` + `ProfileDetailView.statusBanner` | same Compose components | ✅ | n/a | |
| Pre-match flow copy ("Accepting creates the match immediately.") | `ImpressMeReviewView.actionButtons` | same | ✅ | n/a | |
| Open profile from received signal | `ImpressMeView.viewingSenderProfile` | nav from inbox to `profile/{id}?signalId=` | ✅ | `GET /api/impress-me/{id}` | |
| Summary refresh on inbox view | `SessionStore.syncImpressMeSummary` | `session/SessionStore.syncImpressMeSummary` | ✅ | n/a | |

## Events

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Events list (radius-filtered by backend) | `EventsView`, `SessionStore.loadEvents` | `ui/events/EventsScreen.kt` | ✅ | `GET /api/event` | Backend filters by user radius. |
| Toggle interest | `SessionStore.toggleInterest` | same | ✅ | `POST /api/event/{id}/interest` | |
| Distance / venue / interested-count | `EventsView` body | same Android composable | ✅ | n/a | |
| Empty state when nearby is empty | `EventsView` "No events nearby" copy | "No events are available nearby." + tries all events fallback | ✅ + 🟡 | `GET /api/event` | Spec asks for an "all events" fallback. The backend `/api/event` already returns all upcoming events when the user has no lat/lng/radius set. When the user *does* have a radius and the result is empty, there is no public endpoint to fetch radius-bypassed events; we surface "No events are available." in that case. Documented as a residual risk; a `GET /api/event?ignoreRadius=true` query would be a clean follow-up. |
| Empty state when no events at all | iOS implicit | "No events are available." | ✅ | n/a | |

## Notifications

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Notifications list | `NotificationsView` (private struct in `RootView.swift`) | `ui/notifications/NotificationsScreen.kt` | ✅ | `GET /api/notifications` | |
| Unread badge + summary strip | `summaryStrip` | same | ✅ | n/a | |
| Mark single read on tap | `markRead` | same | ✅ | `POST /api/notifications/{id}/read` | |
| Mark all read | `markAllRead` | same | ✅ | `POST /api/notifications/read-all` | |
| Type-specific icon/color/badge | `appearance(for:)` | same map in Compose | ✅ | n/a | |
| Type-specific tap navigation (Like → profile, Impress → profile w/ signalId) | `notificationRow(for:)` | `ui/notifications/NotificationsScreen.kt` | ✅ | `GET /api/profile/{id}` | |
| Pull-to-refresh | `.refreshable` | `PullToRefreshBox` | ✅ | n/a | |
| Empty / loading | iOS view | same | ✅ | n/a | |

## Profile (own)

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Photo carousel | `PhotoCarouselView` | `ui/components/PhotoCarouselView.kt` (HorizontalPager) | ✅ | n/a | |
| Bio / age / intent / radius / location | `ProfileView` | `ui/profile/ProfileScreen.kt` | ✅ | n/a | |
| Audio bio player | `AudioBioPlayerCard` + `AudioBioPlayer` | `ui/components/AudioBioPlayerCard.kt` (ExoPlayer) | ✅ | media URL | Streams from server URL via Media3/ExoPlayer. |
| Highlight clips (story-style bubbles) | `VideoHighlightsView` | `ui/components/VideoHighlights.kt` | ✅ | media URL | |
| Full-screen video player | `VideoPlayerSheet` | `ui/components/VideoPlayerScreen.kt` (ExoPlayer + PlayerView) | ✅ | media URL | |
| Couple / Single badge | `SectionBadge` | same | ✅ | n/a | |
| Verification badges in header | `verifiedProfileMethods` | same Compose | ✅ | `GET /api/verifications` | |
| Profile details rows (location/zip/coupled with) | `ProfileDetailRow` | `ui/components/ProfileInfoRow.kt` | ✅ | n/a | |
| Verifications card with "Get …" CTA | `ProfileVerificationRow` | `ui/profile/ProfileVerificationsCard.kt` | ✅ | `POST /api/verifications/{key}/attempts` | Vendor sheet placeholder mirrors iOS placeholder. |
| Vendor mock sheet (Approve / In review / Fail) | `ProfileVerificationVendorSheet` | `ui/profile/VerificationVendorSheet.kt` | ✅ | `POST .../attempts/{id}/complete` | |
| Interests list | `InterestBadgeList` | `ui/components/InterestBadgeList.kt` | ✅ | n/a | |
| Red flags list | `redFlags` chips | same | ✅ | n/a | |
| Dating preferences card | `datingPreferencesCard(user:)` | `ui/profile/DatingPreferencesCard.kt` | ✅ | n/a | |
| Edit / Sign Out / Delete actions | `ProfileActionRow` | `ui/components/ProfileActionRow.kt` | ✅ | `DELETE /api/profile` for delete | Confirmation dialog identical. |

## Profile Edit

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Photos grid (up to 6) with add/remove | `photosCard` + `PhotosPicker` | `ui/profile/edit/PhotosCard.kt` (PhotoPicker API) | ✅ | `POST /api/profile/photos`, `DELETE /api/profile/photos/{id}` | |
| Highlights bubbles (videos) with add/remove | `highlightsCard` + `PhotosPicker(matching: .videos)` | `ui/profile/edit/HighlightsCard.kt` | ✅ | `POST /api/profile/videos`, `DELETE /api/profile/videos/{id}` | Uses `ActivityResultContracts.PickVisualMedia`. |
| Audio bio upload (mp3/m4a/aac/wav) | `fileImporter` | `ui/profile/edit/AudioBioCard.kt` | ✅ | `POST /api/profile/audio-bio`, `DELETE /api/profile/audio-bio` | Uses `ActivityResultContracts.GetContent("audio/*")`. |
| Bio textfield | `bioCard` | same | ✅ | n/a | |
| Couple link card embed | `CoupleLinkCard()` | `ui/profile/CoupleLinkCard.kt` embedded | ✅ | `/api/couple` | |
| Preferences card (intent/lookingFor/radius/age range) | `preferencesCard` | same | ✅ | n/a | Stepper → IconButton +/- with bound int range. |
| Location card (city/state/zip) | `locationCard` | same | ✅ | n/a | |
| Basics / Identity / Relationship / Lifestyle dropdowns | `basicsCard` ... `lifestyleCard` | combined `ui/profile/edit/PreferenceMenus.kt` | ✅ | n/a | All option lists mirrored verbatim. |
| Interests + Red Flags comma-separated text fields | `interestsCard` + `redFlagsCard` | same | ✅ | n/a | |
| Save → `PUT /profile` | `save()` | same | ✅ | `PUT /api/profile` | |

## Profile Detail (other users)

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Loading + photo carousel + header | `ProfileDetailView` | `ui/profile/ProfileDetailScreen.kt` | ✅ | `GET /api/profile/{id}` | |
| Highlights + Dating preferences | shared with own profile | shared composables | ✅ | n/a | |
| Red-flag highlighting on this profile | `flaggedInterests` | same | ✅ | n/a | |
| Impress Me CTA / "Challenge Sent" / pending sent / blocked sending | `ProfileDetailView.sendImpressMe` | same | ✅ | `POST /api/impress-me` | Already-pending message mirrored. |
| Received Impress Me embedded card (when arrived from notification) | `receivedImpressMeCard` | `ui/profile/ReceivedImpressMeCard.kt` | ✅ | `GET /api/impress-me/{id}` | Reply CTA opens `ImpressMeRespondScreen`. |
| Status banners (accepted / declined / expired) | `statusBanner` | same | ✅ | n/a | |
| Report sheet (Spam / Harassment / Fake / Scam / Other + details) | `ReportProfileSheet` | `ui/profile/ReportProfileSheet.kt` | ✅ | `POST /api/safety/report` | |
| Block alert + cleanup callback | `blockUser` | same | ✅ | `POST /api/safety/block` | |

## Couple Link

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Load couple status | `CoupleLinkCard.loadStatus` | `ui/profile/CoupleLinkCard.kt` | ✅ | `GET /api/couple` | |
| Generate invite code | `createCouple` | same | ✅ | `POST /api/couple` | |
| Join with code | `joinCouple` | same | ✅ | `POST /api/couple/join` | Uppercase + trim mirrored. |
| Linked state with partner name | `linkedState` | same | ✅ | n/a | |
| Waiting state with copy/share/cancel | `waitingState` | same | ✅ | n/a | Share uses `Intent.ACTION_SEND`. Copy uses `ClipboardManager`. |
| Unlink confirmation dialog | `showUnlinkConfirmation` | `AlertDialog` | ✅ | `DELETE /api/couple` | |
| Cancel-invite confirmation | `showCancelConfirmation` | same | ✅ | `DELETE /api/couple` | |

## Verification

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Load methods list | `SessionStore.loadVerifications` | same | ✅ | `GET /api/verifications` | |
| Start attempt | `startVerificationAttempt` | same | ✅ | `POST /api/verifications/{key}/attempts` | |
| Mock vendor sheet (Approve / In review / Fail) | `ProfileVerificationVendorSheet` | `ui/profile/VerificationVendorSheet.kt` | ✅ | `POST /api/verifications/{key}/attempts/{id}/complete` | iOS uses placeholder vendor; Android matches placeholder per task spec. |
| Verified badge in profile header | `verifiedProfileMethods` | same | ✅ | n/a | |
| `live_verified` / `age_verified` tints | `verificationTint(for:)` | same color map | ✅ | n/a | |

## Safety / Privacy / Account

| iOS feature | iOS files | Android equivalent | Status | API dependency | Notes |
| --- | --- | --- | --- | --- | --- |
| Block user | `SessionStore.block` | `session/SessionStore.block` | ✅ | `POST /api/safety/block` | |
| Report user (reason + details ≤ 500 chars) | `ReportProfileSheet` | `ui/profile/ReportProfileSheet.kt` | ✅ | `POST /api/safety/report` | |
| Sign out | `session.signOut` | same | ✅ | local | |
| Delete account | `SessionStore.deleteAccount` | same | ✅ | `DELETE /api/profile` | Confirmation dialog identical. |
| Privacy: precise location not sent | iOS only requests permission, never sends precise lat/lng (matches backend privacy rounding) | matches iOS — Android requests permission only, never includes precise coords in `UpdateProfileRequest` | ✅ | n/a | |

## Reusable UI / Theme

| iOS file | Android equivalent |
| --- | --- |
| `BrandStyle.swift` | `ui/theme/BrandStyle.kt` (color tokens, gradients) |
| `ScreenBackdrop` | `ui/theme/ScreenBackdrop.kt` |
| `triadCard` modifier | `ui/theme/Modifiers.kt` `Modifier.triadCard()` |
| `ScreenContainer` | `ui/components/ScreenContainer.kt` |
| `EmptyStateCard` | `ui/components/EmptyStateCard.kt` |
| `SectionBadge` | `ui/components/SectionBadge.kt` |
| `InterestBadgeList` + `interestColor(for:)` + `FlowLayout` | `ui/components/InterestBadgeList.kt` (Compose `FlowRow`) |
| `RemoteMediaView` | `ui/components/RemoteMediaView.kt` (Coil) |
| `PhotoCarouselView` | `ui/components/PhotoCarouselView.kt` (HorizontalPager) |
| `VideoHighlightsView` + `VideoHighlightBubble` + `RemoteVideoThumbnailView` | `ui/components/VideoHighlights.kt` (Media3 frame extraction or Coil video frame fetcher) |
| `VideoPlayerSheet` | `ui/components/VideoPlayerScreen.kt` (Media3 PlayerView) |
| `DiscoverActionButton` | `ui/components/DiscoverActionButton.kt` |
| `ProfileMetricTile` | `ui/components/ProfileMetricTile.kt` |
| `ProfileDetailRow` / `ProfileInfoRow` | `ui/components/ProfileInfoRow.kt` |

## API Contracts In Use

All endpoints below are the existing backend contracts. Android does **not** change them.

```
POST   /api/auth/login
POST   /api/auth/register
GET    /api/profile
GET    /api/profile/{id}
PUT    /api/profile
DELETE /api/profile
POST   /api/profile/photos              (multipart "file")
DELETE /api/profile/photos/{id}
POST   /api/profile/videos              (multipart "file")
DELETE /api/profile/videos/{id}
POST   /api/profile/audio-bio           (multipart "file")
DELETE /api/profile/audio-bio
POST   /api/profile/video-bio           (multipart "file")
DELETE /api/profile/video-bio
GET    /api/discovery?skip&take&userType
POST   /api/match/like
GET    /api/match
POST   /api/saved
GET    /api/saved
DELETE /api/saved/{userId}
GET    /api/message/{matchId}?skip&take
POST   /api/message/{matchId}
GET    /api/event
POST   /api/event/{id}/interest
GET    /api/notifications?skip&take
POST   /api/notifications/{id}/read
POST   /api/notifications/read-all
POST   /api/safety/block
POST   /api/safety/report
GET    /api/impress-me/inbox
GET    /api/impress-me/summary
GET    /api/impress-me/{id}
POST   /api/impress-me
POST   /api/impress-me/{id}/respond
POST   /api/impress-me/{id}/review
POST   /api/impress-me/{id}/accept
POST   /api/impress-me/{id}/decline
GET    /api/verifications
POST   /api/verifications/{key}/attempts
POST   /api/verifications/{key}/attempts/{id}/complete
GET    /api/couple
POST   /api/couple
POST   /api/couple/join
DELETE /api/couple
GET    /uploads/*                        (media)
```

## Residual Risks / Follow-ups

1. **Per-thread unread counts** — neither iOS nor backend exposes per-thread unread; Android matches that. Backend would need a `GET /api/match` projection that includes unread counts to fix on both clients.
2. **Events fallback to "all events"** — backend `/api/event` already filters by user radius. To honor the task's "fall back to all events when nearby is empty", a future `?ignoreRadius=true` query would be the cleanest path. Today, when the user has no location/radius set the list is unfiltered, which gives the same effect for those users.
3. **SignalR realtime** — iOS does REST polling on chat open. Android matches. The backend `/hubs/chat` is unused by iOS; wiring it up should be done on both clients together.
4. **Verification vendor SDK** — both clients use a placeholder vendor sheet (Approve / In review / Fail). Real vendors require provider SDKs which the backend gates behind config.
5. **Push notifications** — iOS does not register for APNs in the current code. Android does not register for FCM either. Out of parity scope.
