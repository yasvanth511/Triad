import SwiftUI

struct RootView: View {
    @EnvironmentObject private var session: SessionStore

    private var isShowingError: Binding<Bool> {
        Binding(
            get: { session.lastErrorMessage != nil },
            set: { newValue in
                if !newValue {
                    session.clearError()
                }
            }
        )
    }

    var body: some View {
        Group {
            switch session.phase {
            case .loading:
                ZStack {
                    ScreenBackdrop()
                    ProgressView("Loading your session...")
                        .controlSize(.large)
                        .padding(24)
                        .triadCard()
                }
            case .signedOut:
                AuthView()
            case .authenticated:
                MainTabView()
            }
        }
        .task {
            await session.bootstrapIfNeeded()
        }
        .alert("Something went wrong", isPresented: isShowingError) {
            Button("OK", role: .cancel) {
                session.clearError()
            }
        } message: {
            Text(session.lastErrorMessage ?? "")
        }
    }
}

struct MainTabView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.scenePhase) private var scenePhase

    enum Tab: Hashable { case discover, saved, matches, impressMe, events }

    @State private var selectedTab: Tab = .discover
    @State private var showMoreMenu = false

    private let tabBarContentHeight: CGFloat = 56

    private var notificationBadgeCount: Int {
        session.notificationUnreadCount
    }

    private var impressMeBadgeCount: Int {
        session.impressMeSummary.totalBadgeCount
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            // Tab content — all stacks kept alive; hidden ones are non-interactive
            ZStack {
                NavigationStack { DiscoverView().toolbar { profileToolbarButton } }
                    .opacity(selectedTab == .discover ? 1 : 0)
                    .allowsHitTesting(selectedTab == .discover)
                NavigationStack { SavedProfilesView().toolbar { profileToolbarButton } }
                    .opacity(selectedTab == .saved ? 1 : 0)
                    .allowsHitTesting(selectedTab == .saved)
                NavigationStack { MatchesView().toolbar { profileToolbarButton } }
                    .opacity(selectedTab == .matches ? 1 : 0)
                    .allowsHitTesting(selectedTab == .matches)
                NavigationStack { ImpressMeView().toolbar { profileToolbarButton } }
                    .opacity(selectedTab == .impressMe ? 1 : 0)
                    .allowsHitTesting(selectedTab == .impressMe)
                NavigationStack { EventsView().toolbar { profileToolbarButton } }
                    .opacity(selectedTab == .events ? 1 : 0)
                    .allowsHitTesting(selectedTab == .events)
            }
            .safeAreaInset(edge: .bottom) {
                Color.clear.frame(height: tabBarContentHeight + 8)
            }

            // Dimmed backdrop — tap anywhere to close the popup
            if showMoreMenu {
                Color.black.opacity(0.2)
                    .ignoresSafeArea()
                    .onTapGesture { closeMenu() }
            }

            // Bubble popup — floats above the "More" button
            if showMoreMenu {
                VStack(alignment: .trailing, spacing: 12) {
                    moreBubble(icon: "calendar", label: "Events") {
                        selectedTab = .events
                        closeMenu()
                    }
                }
                .padding(.trailing, 16)
                .padding(.bottom, tabBarContentHeight + safeAreaBottomInset + 12)
                .frame(maxWidth: .infinity, alignment: .trailing)
                .transition(
                    .scale(scale: 0.82, anchor: .bottomTrailing)
                    .combined(with: .opacity)
                )
            }

            // Custom tab bar
            customTabBar
        }
        .animation(.spring(response: 0.28, dampingFraction: 0.72), value: showMoreMenu)
        .tint(BrandStyle.accent)
        .task(id: scenePhase) {
            guard scenePhase == .active else { return }
            await refreshImpressMeSummary()

            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 30_000_000_000)
                if Task.isCancelled {
                    break
                }
                await refreshImpressMeSummary()
            }
        }
    }

    // MARK: – Helpers

    private func closeMenu() {
        showMoreMenu = false
    }

    private func refreshImpressMeSummary() async {
        _ = try? await session.loadImpressMeSummary()
        await session.refreshNotificationCount()
    }

    private var safeAreaBottomInset: CGFloat {
        (UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first?.windows.first?.safeAreaInsets.bottom) ?? 0
    }

    // MARK: – Nav-bar items (leading brand + trailing profile)

    @ToolbarContentBuilder
    private var profileToolbarButton: some ToolbarContent {
        ToolbarItem(placement: .principal) {
            Text("Triad")
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .foregroundStyle(BrandStyle.accent)
        }
        ToolbarItemGroup(placement: .topBarTrailing) {
            NavigationLink {
                NotificationsView()
            } label: {
                toolbarIcon(symbol: "bell.fill", badgeCount: notificationBadgeCount)
            }
            .buttonStyle(.plain)

            NavigationLink {
                ProfileView()
            } label: {
                toolbarIcon(symbol: "person.crop.circle.fill")
            }
            .buttonStyle(.plain)
        }
    }

    @ViewBuilder
    private func toolbarIcon(symbol: String, badgeCount: Int = 0) -> some View {
        ZStack(alignment: .topTrailing) {
            Image(systemName: symbol)
                .font(.system(size: 22))
                .foregroundStyle(BrandStyle.accent)

            if badgeCount > 0 {
                Text("\(min(badgeCount, 99))")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, badgeCount > 9 ? 5 : 4)
                    .padding(.vertical, 2)
                    .background(BrandStyle.secondary, in: Capsule())
                    .offset(x: 9, y: -7)
            }
        }
    }

    // MARK: – Bubble button

    @ViewBuilder
    private func moreBubble(icon: String, label: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Text(label)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.textPrimary)

                Image(systemName: icon)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(
                        LinearGradient(
                            colors: [BrandStyle.accent, BrandStyle.secondary],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        in: Circle()
                    )
            }
            .padding(.leading, 16).padding(.trailing, 6).padding(.vertical, 6)
            .background(.regularMaterial, in: Capsule())
            .shadow(color: .black.opacity(0.14), radius: 12, x: 0, y: 4)
        }
        .buttonStyle(.plain)
    }

    // MARK: – Tab bar

    private var customTabBar: some View {
        HStack(spacing: 0) {
            tabBarButton(icon: "sparkles",        label: "Discover", tab: .discover)
            tabBarButton(icon: "bookmark",         label: "Saved",    tab: .saved)
            tabBarButton(icon: "heart.text.square",label: "Matches",  tab: .matches)
            tabBarButton(icon: "bolt.heart",       label: "Impress",  tab: .impressMe, badgeCount: impressMeBadgeCount)
            moreTabButton
        }
        .frame(height: tabBarContentHeight)
        .background {
            Rectangle()
                .fill(.regularMaterial)
                .ignoresSafeArea(edges: .bottom)
                .overlay(alignment: .top) {
                    Divider().opacity(0.45)
                }
        }
    }

    @ViewBuilder
    private func tabBarButton(icon: String, label: String, tab: Tab, badgeCount: Int = 0) -> some View {
        let isActive = selectedTab == tab
        Button {
            selectedTab = tab
            closeMenu()
        } label: {
            VStack(spacing: 3) {
                ZStack(alignment: .topTrailing) {
                    Image(systemName: isActive ? icon : icon)
                        .font(.system(size: 21, weight: isActive ? .semibold : .regular))
                        .symbolVariant(isActive ? .fill : .none)

                    if badgeCount > 0 {
                        Text("\(min(badgeCount, 99))")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, badgeCount > 9 ? 5 : 4)
                            .padding(.vertical, 2)
                            .background(BrandStyle.secondary, in: Capsule())
                            .offset(x: 11, y: -7)
                    }
                }
                Text(label)
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle(isActive ? BrandStyle.accent : BrandStyle.textSecondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var moreTabButton: some View {
        Button {
            withAnimation(.spring(response: 0.28, dampingFraction: 0.72)) {
                showMoreMenu.toggle()
            }
        } label: {
            VStack(spacing: 3) {
                Image(systemName: showMoreMenu ? "xmark.circle.fill" : "ellipsis.circle.fill")
                    .font(.system(size: 21, weight: .semibold))
                Text("More")
                    .font(.system(size: 10, weight: .medium))
            }
            .foregroundStyle((showMoreMenu || selectedTab == .events) ? BrandStyle.accent : BrandStyle.textSecondary)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

private struct NotificationsView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var notifications: [AppNotification] = []
    @State private var unreadCount: Int = 0
    @State private var isLoading = false

    var body: some View {
        ScreenContainer(title: "Notifications") {
            if isLoading, notifications.isEmpty {
                ProgressView("Loading notifications...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if !notifications.isEmpty {
                summaryStrip
            }

            if notifications.isEmpty, !isLoading {
                EmptyStateCard(
                    title: "All caught up",
                    message: "Likes, matches, messages, and Impress Me challenges will appear here."
                )
            } else {
                ForEach(notifications) { notification in
                    notificationRow(for: notification)
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if unreadCount > 0 {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Mark all read") {
                        Task { await markAllRead() }
                    }
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.accent)
                }
            }
        }
        .task {
            await load()
        }
        .refreshable {
            await load()
        }
    }

    // MARK: – Summary strip

    private var summaryStrip: some View {
        HStack(spacing: 12) {
            notificationSummaryCard(
                title: "Unread",
                value: "\(unreadCount)",
                subtitle: "Notifications",
                tint: BrandStyle.accent
            )
            notificationSummaryCard(
                title: "Total",
                value: "\(notifications.count)",
                subtitle: "Recent",
                tint: BrandStyle.secondary
            )
        }
    }

    private func notificationSummaryCard(title: String, value: String, subtitle: String, tint: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)
            Text(value)
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(BrandStyle.textPrimary)
            Text(subtitle)
                .font(.caption)
                .foregroundStyle(BrandStyle.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(tint.opacity(0.10))
        )
    }

    // MARK: – Row builder

    @ViewBuilder
    private func notificationRow(for notification: AppNotification) -> some View {
        let (icon, tint, statusText) = appearance(for: notification.type)

        Group {
            switch notification.type {
            case .likeReceived:
                if let actorId = notification.actorId {
                    NavigationLink {
                        ProfileDetailView(userId: actorId, fallbackName: notification.actorName ?? "Someone")
                    } label: {
                        rowContent(notification: notification, icon: icon, tint: tint, statusText: statusText)
                    }
                    .buttonStyle(.plain)
                    .simultaneousGesture(TapGesture().onEnded { markRead(notification) })
                } else {
                    rowContent(notification: notification, icon: icon, tint: tint, statusText: statusText)
                }

            case .impressMeReceived:
                if let actorId = notification.actorId {
                    NavigationLink {
                        ProfileDetailView(
                            userId: actorId,
                            fallbackName: notification.actorName ?? "Someone",
                            receivedImpressMeSignalId: notification.referenceId
                        )
                    } label: {
                        rowContent(notification: notification, icon: icon, tint: tint, statusText: statusText)
                    }
                    .buttonStyle(.plain)
                    .simultaneousGesture(TapGesture().onEnded { markRead(notification) })
                } else {
                    rowContent(notification: notification, icon: icon, tint: tint, statusText: statusText)
                }

            default:
                rowContent(notification: notification, icon: icon, tint: tint, statusText: statusText)
            }
        }
        .opacity(notification.isRead ? 0.6 : 1)
    }

    private func rowContent(
        notification: AppNotification,
        icon: String,
        tint: Color,
        statusText: String?
    ) -> some View {
        HStack(alignment: .top, spacing: 12) {
            ZStack(alignment: .topTrailing) {
                Image(systemName: icon)
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 38, height: 38)
                    .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

                if !notification.isRead {
                    Circle()
                        .fill(BrandStyle.secondary)
                        .frame(width: 8, height: 8)
                        .offset(x: 3, y: -3)
                }
            }

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top, spacing: 8) {
                    Text(notification.title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BrandStyle.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 0)

                    if let statusText {
                        SectionBadge(text: statusText, color: tint)
                    }
                }

                Text(notification.body)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textSecondary)
                    .lineLimit(2)

                Text(notification.createdAt.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .triadCard()
    }

    private func appearance(for type: AppNotification.AppNotificationType) -> (String, Color, String?) {
        switch type {
        case .likeReceived:      return ("heart.fill",                       BrandStyle.secondary, "Like")
        case .matchCreated:      return ("person.2.fill",                    BrandStyle.accent,    "Match")
        case .messageReceived:   return ("bubble.left.fill",                 .blue,                "Message")
        case .impressMeReceived: return ("sparkles.rectangle.stack.fill",    BrandStyle.accent,    "Challenge")
        case .unknown:           return ("bell.fill",                        BrandStyle.textSecondary, nil)
        }
    }

    // MARK: – Actions

    private func markRead(_ notification: AppNotification) {
        guard !notification.isRead else { return }
        Task {
            try? await session.markNotificationRead(notificationId: notification.id)
            if let idx = notifications.firstIndex(where: { $0.id == notification.id }) {
                notifications[idx] = AppNotification(
                    id: notification.id, type: notification.type,
                    title: notification.title, body: notification.body,
                    referenceId: notification.referenceId, actorId: notification.actorId,
                    actorName: notification.actorName, actorPhotoUrl: notification.actorPhotoUrl,
                    isRead: true, createdAt: notification.createdAt
                )
                unreadCount = max(0, unreadCount - 1)
            }
        }
    }

    private func markAllRead() async {
        do {
            try await session.markAllNotificationsRead()
            notifications = notifications.map { n in
                AppNotification(
                    id: n.id, type: n.type, title: n.title, body: n.body,
                    referenceId: n.referenceId, actorId: n.actorId,
                    actorName: n.actorName, actorPhotoUrl: n.actorPhotoUrl,
                    isRead: true, createdAt: n.createdAt
                )
            }
            unreadCount = 0
        } catch {
            session.presentError(error)
        }
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let result = try await session.loadNotifications()
            notifications = result.notifications
            unreadCount = result.unreadCount
        } catch {
            session.presentError(error)
        }
    }
}
