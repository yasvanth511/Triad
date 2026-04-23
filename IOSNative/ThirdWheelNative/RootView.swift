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
        ToolbarItem(placement: .topBarTrailing) {
            Button {
                extraScreen = .profile
            } label: {
                Image(systemName: "person.crop.circle.fill")
                    .font(.system(size: 22))
                    .foregroundStyle(BrandStyle.accent)
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
