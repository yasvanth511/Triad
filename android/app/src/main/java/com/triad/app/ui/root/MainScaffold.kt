package com.triad.app.ui.root

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.BookmarkBorder
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.OfflineBolt
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.triad.app.session.LocalSessionStore
import com.triad.app.ui.discover.DiscoverScreen
import com.triad.app.ui.events.EventsScreen
import com.triad.app.ui.impressme.ImpressMeRespondScreen
import com.triad.app.ui.impressme.ImpressMeReviewScreen
import com.triad.app.ui.impressme.ImpressMeScreen
import com.triad.app.ui.matches.MatchChatScreen
import com.triad.app.ui.matches.MatchesScreen
import com.triad.app.ui.nav.Routes
import com.triad.app.ui.notifications.NotificationsScreen
import com.triad.app.ui.profile.ProfileDetailScreen
import com.triad.app.ui.profile.ProfileEditScreen
import com.triad.app.ui.profile.ProfileScreen
import com.triad.app.ui.saved.SavedScreen
import com.triad.app.ui.theme.BrandStyle
import kotlinx.coroutines.delay

private enum class TabId(val label: String) {
    Discover("Discover"),
    Saved("Saved"),
    Matches("Matches"),
    Impress("Impress"),
    Events("Events"),
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScaffold() {
    val session = LocalSessionStore.current
    val unreadNotifications by session.notificationUnreadCount.collectAsState()
    val impressMeSummary by session.impressMeSummary.collectAsState()

    val navController = rememberNavController()
    var selectedTab by rememberSaveable { mutableStateOf(TabId.Discover) }
    var showMore by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        // Periodic Impress Me + notification unread refresh; mirrors iOS 30s loop.
        while (true) {
            runCatching { session.loadImpressMeSummary() }
            session.refreshNotificationCount()
            delay(30_000)
        }
    }

    NavHost(navController = navController, startDestination = Routes.MAIN) {
        composable(Routes.MAIN) {
            Box(modifier = Modifier.fillMaxSize()) {
                Column(modifier = Modifier.fillMaxSize()) {
                    MainTopBar(
                        unreadNotifications = unreadNotifications,
                        onOpenNotifications = { navController.navigate(Routes.NOTIFICATIONS) },
                        onOpenProfile = { navController.navigate(Routes.PROFILE_OWN) },
                    )
                    Box(modifier = Modifier.fillMaxSize().padding(bottom = 64.dp)) {
                        when (selectedTab) {
                            TabId.Discover -> DiscoverScreen(navController)
                            TabId.Saved -> SavedScreen(navController)
                            TabId.Matches -> MatchesScreen(navController)
                            TabId.Impress -> ImpressMeScreen(navController)
                            TabId.Events -> EventsScreen()
                        }
                    }
                }

                if (showMore) {
                    Box(
                        Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.2f))
                            .clip(RoundedCornerShape(0.dp)),
                    )
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomEnd)
                            .padding(end = 16.dp, bottom = 88.dp),
                        horizontalAlignment = Alignment.End,
                    ) {
                        MoreBubble(
                            label = "Events",
                            icon = Icons.Filled.CalendarMonth,
                            onClick = {
                                selectedTab = TabId.Events
                                showMore = false
                            },
                        )
                    }
                }

                CustomBottomBar(
                    selected = selectedTab,
                    impressBadge = impressMeSummary.totalBadgeCount,
                    moreOpen = showMore,
                    onSelect = {
                        selectedTab = it
                        showMore = false
                    },
                    onToggleMore = { showMore = !showMore },
                    modifier = Modifier.align(Alignment.BottomCenter),
                )
            }
        }
        composable(Routes.NOTIFICATIONS) {
            NotificationsScreen(navController)
        }
        composable(Routes.PROFILE_OWN) {
            ProfileScreen(navController)
        }
        composable(Routes.PROFILE_EDIT) {
            ProfileEditScreen(navController)
        }
        composable(
            route = Routes.PROFILE_DETAIL,
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType },
                navArgument("signalId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                },
            ),
        ) { entry ->
            val userId = entry.arguments?.getString("userId").orEmpty()
            val signalId = entry.arguments?.getString("signalId")
            ProfileDetailScreen(
                navController = navController,
                userId = userId,
                receivedImpressMeSignalId = signalId,
            )
        }
        composable(
            route = Routes.MATCH_CHAT,
            arguments = listOf(navArgument("matchId") { type = NavType.StringType }),
        ) { entry ->
            val matchId = entry.arguments?.getString("matchId").orEmpty()
            MatchChatScreen(navController = navController, matchId = matchId)
        }
        composable(
            route = Routes.IMPRESS_RESPOND,
            arguments = listOf(navArgument("signalId") { type = NavType.StringType }),
        ) { entry ->
            val signalId = entry.arguments?.getString("signalId").orEmpty()
            ImpressMeRespondScreen(navController = navController, signalId = signalId)
        }
        composable(
            route = Routes.IMPRESS_REVIEW,
            arguments = listOf(navArgument("signalId") { type = NavType.StringType }),
        ) { entry ->
            val signalId = entry.arguments?.getString("signalId").orEmpty()
            ImpressMeReviewScreen(navController = navController, signalId = signalId)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainTopBar(
    unreadNotifications: Int,
    onOpenNotifications: () -> Unit,
    onOpenProfile: () -> Unit,
) {
    TopAppBar(
        title = {
            Text(
                "Triad",
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = BrandStyle.Accent,
            )
        },
        actions = {
            BadgedIconButton(
                icon = Icons.Filled.Notifications,
                badgeCount = unreadNotifications,
                onClick = onOpenNotifications,
                contentDescription = "Notifications",
            )
            IconButton(onClick = onOpenProfile) {
                Icon(
                    Icons.Filled.AccountCircle,
                    contentDescription = "Profile",
                    tint = BrandStyle.Accent,
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.Transparent),
    )
}

@Composable
private fun BadgedIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    badgeCount: Int,
    onClick: () -> Unit,
    contentDescription: String,
) {
    Box {
        IconButton(onClick = onClick) {
            Icon(icon, contentDescription = contentDescription, tint = BrandStyle.Accent)
        }
        if (badgeCount > 0) {
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .padding(end = 6.dp, top = 6.dp)
                    .size(18.dp)
                    .background(BrandStyle.Secondary, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    minOf(badgeCount, 99).toString(),
                    color = Color.White,
                    style = MaterialTheme.typography.labelSmall,
                )
            }
        }
    }
}

@Composable
private fun MoreBubble(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
) {
    Surface(
        shape = CircleShape,
        color = Color.White.copy(alpha = 0.95f),
        shadowElevation = 6.dp,
        modifier = Modifier.padding(vertical = 6.dp),
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 6.dp)
                .clip(CircleShape),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(label, color = BrandStyle.TextPrimary, fontWeight = FontWeight.SemiBold)
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(BrandStyle.AccentGradient, CircleShape)
                    .clip(CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                IconButton(onClick = onClick) {
                    Icon(icon, contentDescription = label, tint = Color.White)
                }
            }
        }
    }
}

@Composable
private fun CustomBottomBar(
    selected: TabId,
    impressBadge: Int,
    moreOpen: Boolean,
    onSelect: (TabId) -> Unit,
    onToggleMore: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .height(64.dp),
        color = Color.White.copy(alpha = 0.96f),
        shadowElevation = 8.dp,
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BarButton(
                label = "Discover",
                icon = Icons.Filled.AutoAwesome,
                active = selected == TabId.Discover,
                onClick = { onSelect(TabId.Discover) },
            )
            BarButton(
                label = "Saved",
                icon = Icons.Filled.BookmarkBorder,
                active = selected == TabId.Saved,
                onClick = { onSelect(TabId.Saved) },
            )
            BarButton(
                label = "Matches",
                icon = Icons.Filled.FavoriteBorder,
                active = selected == TabId.Matches,
                onClick = { onSelect(TabId.Matches) },
            )
            BarButton(
                label = "Impress",
                icon = Icons.Filled.OfflineBolt,
                active = selected == TabId.Impress,
                onClick = { onSelect(TabId.Impress) },
                badgeCount = impressBadge,
            )
            BarButton(
                label = "More",
                icon = if (moreOpen) Icons.Filled.Close else Icons.Filled.MoreHoriz,
                active = moreOpen || selected == TabId.Events,
                onClick = onToggleMore,
            )
        }
    }
}

@Composable
private fun BarButton(
    label: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    active: Boolean,
    onClick: () -> Unit,
    badgeCount: Int = 0,
) {
    val color = if (active) BrandStyle.Accent else BrandStyle.TextSecondary
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
        modifier = Modifier
            .fillMaxWidth(0.18f)
            .clip(RoundedCornerShape(6.dp)),
    ) {
        Box {
            IconButton(onClick = onClick) {
                Icon(icon, contentDescription = label, tint = color)
            }
            if (badgeCount > 0) {
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .offset(x = (-2).dp, y = 2.dp)
                        .size(18.dp)
                        .background(BrandStyle.Secondary, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    Text(
                        minOf(badgeCount, 99).toString(),
                        color = Color.White,
                        style = MaterialTheme.typography.labelSmall,
                    )
                }
            }
        }
        Text(label, color = color, fontSize = 10.sp, fontWeight = FontWeight.Medium)
    }
}
