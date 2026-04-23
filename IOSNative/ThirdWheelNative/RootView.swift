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

    enum ExtraScreen: String, Identifiable {
        case profile
        var id: String { rawValue }
    }

    @State private var selectedTab: Tab = .discover
    @State private var showMoreMenu = false
    @State private var extraScreen: ExtraScreen?

    private let tabBarContentHeight: CGFloat = 56

    private var notificationBadgeCount: Int {
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
        .sheet(item: $extraScreen) { _ in
            NavigationStack { ProfileView() }
                .environmentObject(session)
        }
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

            Button {
                extraScreen = .profile
            } label: {
                toolbarIcon(symbol: "person.crop.circle.fill")
            }
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
            tabBarButton(icon: "bolt.heart",       label: "Impress",  tab: .impressMe, badgeCount: notificationBadgeCount)
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

    @State private var inbox: ImpressMeInbox?
    @State private var isLoading = false
    @State private var reviewingSignal: ImpressMeSignal?

    private var receivedChallenges: [ImpressMeSignal] {
        (inbox?.received ?? [])
            .filter { $0.status == .sent && !$0.isExpired }
            .sorted { notificationDate(for: $0) > notificationDate(for: $1) }
    }

    private var answersReady: [ImpressMeSignal] {
        (inbox?.sent ?? [])
            .filter { $0.status == .responded || $0.status == .viewed }
            .sorted { notificationDate(for: $0) > notificationDate(for: $1) }
    }

    private var recentResults: [ImpressMeSignal] {
        let receivedResults = (inbox?.received ?? [])
            .filter { $0.status == .accepted || $0.status == .declined || $0.status == .expired }
        let sentExpired = (inbox?.sent ?? [])
            .filter { $0.status == .expired }

        return (receivedResults + sentExpired)
            .sorted { notificationDate(for: $0) > notificationDate(for: $1) }
    }

    var body: some View {
        ScreenContainer(title: "Notifications") {
            if isLoading, inbox == nil {
                ProgressView("Loading notifications...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            summaryStrip

            if receivedChallenges.isEmpty, answersReady.isEmpty, recentResults.isEmpty, !isLoading {
                EmptyStateCard(
                    title: "All caught up",
                    message: "New Impress Me challenges, answers, and updates will appear here."
                )
            } else {
                if !receivedChallenges.isEmpty {
                    notificationSectionHeader(
                        title: "New Challenges",
                        subtitle: "People waiting for your answer.",
                        count: receivedChallenges.count
                    )

                    ForEach(receivedChallenges) { signal in
                        NavigationLink {
                            ProfileDetailView(
                                userId: signal.senderId,
                                fallbackName: signal.senderUsername,
                                receivedImpressMeSignalId: signal.id,
                                onImpressMeSignalUpdated: { updated in
                                    applyUpdate(updated)
                                }
                            )
                        } label: {
                            notificationRow(
                                icon: "sparkles.rectangle.stack.fill",
                                tint: BrandStyle.accent,
                                title: "\(signal.senderUsername) sent you an Impress Me challenge",
                                subtitle: signal.prompt.promptText,
                                timestamp: signal.createdAt,
                                statusText: "Reply"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !answersReady.isEmpty {
                    notificationSectionHeader(
                        title: "Answers Ready",
                        subtitle: "Review the replies waiting on you.",
                        count: answersReady.count
                    )

                    ForEach(answersReady) { signal in
                        Button {
                            reviewingSignal = signal
                        } label: {
                            notificationRow(
                                icon: "bubble.left.and.text.bubble.right.fill",
                                tint: BrandStyle.secondary,
                                title: "\(signal.receiverUsername) answered your challenge",
                                subtitle: signal.response?.textContent ?? "Tap to review their answer.",
                                timestamp: signal.respondedAt ?? signal.createdAt,
                                statusText: "Review"
                            )
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !recentResults.isEmpty {
                    notificationSectionHeader(
                        title: "Recent Updates",
                        subtitle: "The latest outcomes from your Impress Me activity."
                    )

                    ForEach(recentResults) { signal in
                        resultRow(for: signal)
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await load()
        }
        .refreshable {
            await load()
        }
        .sheet(item: $reviewingSignal) { signal in
            ImpressMeReviewView(signal: signal) { updated in
                applyUpdate(updated)
                reviewingSignal = nil
            }
            .environmentObject(session)
        }
    }

    private var summaryStrip: some View {
        HStack(spacing: 12) {
            notificationSummaryCard(
                title: "New",
                value: "\(receivedChallenges.count)",
                subtitle: "Challenges",
                tint: BrandStyle.accent
            )

            notificationSummaryCard(
                title: "Ready",
                value: "\(answersReady.count)",
                subtitle: "To review",
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

    private func notificationSectionHeader(title: String, subtitle: String, count: Int? = nil) -> some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .foregroundStyle(BrandStyle.textPrimary)
                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textSecondary)
            }

            Spacer()

            if let count, count > 0 {
                SectionBadge(text: "\(count)", color: BrandStyle.accent)
            }
        }
    }

    private func notificationRow(
        icon: String,
        tint: Color,
        title: String,
        subtitle: String,
        timestamp: Date,
        statusText: String? = nil
    ) -> some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 18, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 38, height: 38)
                .background(tint.opacity(0.10), in: RoundedRectangle(cornerRadius: 12, style: .continuous))

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .top, spacing: 8) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BrandStyle.textPrimary)
                        .fixedSize(horizontal: false, vertical: true)

                    Spacer(minLength: 0)

                    if let statusText {
                        SectionBadge(text: statusText, color: tint)
                    }
                }

                Text(subtitle)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textSecondary)
                    .lineLimit(2)

                Text(timestamp.formatted(date: .abbreviated, time: .shortened))
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .triadCard()
    }

    @ViewBuilder
    private func resultRow(for signal: ImpressMeSignal) -> some View {
        switch signal.status {
        case .accepted:
            NavigationLink {
                ProfileDetailView(
                    userId: signal.senderId,
                    fallbackName: signal.senderUsername,
                    receivedImpressMeSignalId: signal.id,
                    onImpressMeSignalUpdated: { updated in
                        applyUpdate(updated)
                    }
                )
            } label: {
                notificationRow(
                    icon: "checkmark.seal.fill",
                    tint: .green,
                    title: "\(signal.senderUsername) accepted your answer",
                    subtitle: "The challenge turned into a match.",
                    timestamp: signal.resolvedAt ?? signal.respondedAt ?? signal.createdAt,
                    statusText: "Matched"
                )
            }
            .buttonStyle(.plain)
        case .declined:
            NavigationLink {
                ProfileDetailView(
                    userId: signal.senderId,
                    fallbackName: signal.senderUsername,
                    receivedImpressMeSignalId: signal.id,
                    onImpressMeSignalUpdated: { updated in
                        applyUpdate(updated)
                    }
                )
            } label: {
                notificationRow(
                    icon: "xmark.circle.fill",
                    tint: BrandStyle.textSecondary,
                    title: "\(signal.senderUsername) passed on your answer",
                    subtitle: "That challenge has been closed.",
                    timestamp: signal.resolvedAt ?? signal.respondedAt ?? signal.createdAt,
                    statusText: "Closed"
                )
            }
            .buttonStyle(.plain)
        case .expired:
            notificationRow(
                icon: "clock.badge.xmark.fill",
                tint: .orange,
                title: signal.senderId == session.currentUser?.id
                    ? "Your challenge to \(signal.receiverUsername) expired"
                    : "\(signal.senderUsername)'s challenge expired",
                subtitle: "The timer ran out before the challenge moved forward.",
                timestamp: signal.expiresAt,
                statusText: "Expired"
            )
        default:
            EmptyView()
        }
    }

    private func notificationDate(for signal: ImpressMeSignal) -> Date {
        signal.resolvedAt ?? signal.respondedAt ?? signal.viewedAt ?? signal.createdAt
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }

        do {
            inbox = try await session.getImpressMeInbox()
        } catch {
            session.presentError(error)
        }
    }

    private func applyUpdate(_ updated: ImpressMeSignal) {
        guard var current = inbox else { return }

        func replace(in list: inout [ImpressMeSignal]) {
            if let index = list.firstIndex(where: { $0.id == updated.id }) {
                list[index] = updated
            }
        }

        replace(in: &current.received)
        replace(in: &current.sent)

        inbox = ImpressMeInbox(
            received: current.received,
            sent: current.sent,
            unreadCount: current.received.filter { $0.status == .sent && $0.viewedAt == nil }.count
        )

        if let inbox {
            session.syncImpressMeSummary(from: inbox)
        }
    }
}
