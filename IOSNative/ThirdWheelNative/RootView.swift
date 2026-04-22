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
    var body: some View {
        TabView {
            NavigationStack {
                DiscoverView()
            }
            .tabItem {
                Label("Discover", systemImage: "sparkles")
            }

            NavigationStack {
                SavedProfilesView()
            }
            .tabItem {
                Label("Saved", systemImage: "bookmark")
            }

            NavigationStack {
                MatchesView()
            }
            .tabItem {
                Label("Matches", systemImage: "heart.text.square")
            }

            NavigationStack {
                EventsView()
            }
            .tabItem {
                Label("Events", systemImage: "calendar")
            }

            NavigationStack {
                ProfileView()
            }
            .tabItem {
                Label("Profile", systemImage: "person.crop.circle")
            }
        }
        .tint(BrandStyle.accent)
    }
}
