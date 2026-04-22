import SwiftUI

struct DiscoverView: View {
    private enum ActionKind {
        case save
        case like
    }

    enum Audience: String, CaseIterable, Identifiable {
        case all = "All"
        case single = "Singles"
        case couple = "Couples"

        var id: String { rawValue }

        var apiValue: String? {
            switch self {
            case .all:
                return nil
            case .single:
                return "single"
            case .couple:
                return "couple"
            }
        }
    }

    @EnvironmentObject private var session: SessionStore
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var locationPermissions = LocationPermissionManager()

    @State private var cards: [DiscoveryCard] = []
    @State private var selectedAudience: Audience = .all
    @State private var isLoading = false
    @State private var activeUserID: UUID?
    @State private var activeActionKind: ActionKind?
    @State private var notice: String?

    var body: some View {
        ScreenContainer(title: "Discover") {
            VStack(alignment: .leading, spacing: 14) {
                VStack(alignment: .leading, spacing: 14) {
                    Text("Audience")
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)

                    Picker("Audience", selection: $selectedAudience) {
                        ForEach(Audience.allCases) { audience in
                            Text(audience.rawValue).tag(audience)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                .triadCard()

                if !locationPermissions.isAuthorized {
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Location Permission")
                                    .font(.headline)
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Text(locationPermissions.statusDescription)
                                    .font(.subheadline)
                                    .foregroundStyle(BrandStyle.textSecondary)
                            }

                            Spacer()

                            Button("Enable") {
                                locationPermissions.requestPermission()
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(BrandStyle.accent)
                        }

                        Text("This native app uses CoreLocation permission flow so we can later send precise user coordinates from iOS.")
                            .font(.footnote)
                            .foregroundStyle(BrandStyle.textSecondary)
                    }
                    .triadCard()
                }

                if isLoading {
                    ProgressView("Loading people nearby...")
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.vertical, 6)
                }

                if let notice {
                    EmptyStateCard(title: "Update", message: notice)
                }

                if cards.isEmpty, !isLoading {
                    EmptyStateCard(
                        title: "No profiles right now",
                        message: "Try a different audience filter or refresh after seeding more users."
                    )
                } else {
                    ForEach(cards) { card in
                        VStack(alignment: .leading, spacing: 14) {
                            NavigationLink {
                                ProfileDetailView(userId: card.userId, fallbackName: card.username) { blockedId in
                                    guard blockedId == card.userId else { return }
                                    removeCard(card)
                                    notice = "\(card.username) was blocked."
                                }
                            } label: {
                                discoverCardSummary(for: card)
                            }
                            .buttonStyle(.plain)
                            .disabled(isActionInFlight(for: card))

                            HStack(spacing: 18) {
                                Spacer()

                                Button {
                                    removeCard(card)
                                } label: {
                                    DiscoverActionButton(
                                        symbol: "xmark",
                                        tint: BrandStyle.textSecondary,
                                        background: Color.white.opacity(0.75)
                                    )
                                }
                                .buttonStyle(.plain)
                                .accessibilityLabel("Skip profile")

                                Button {
                                    Task {
                                        await saveForLater(card)
                                    }
                                } label: {
                                    DiscoverActionButton(
                                        symbol: "bookmark.fill",
                                        tint: .white,
                                        background: BrandStyle.accent
                                    )
                                    .overlay {
                                        if isActionInFlight(for: card, kind: .save) {
                                            ProgressView()
                                                .tint(.white)
                                        }
                                    }
                                }
                                .buttonStyle(.plain)
                                .disabled(isActionInFlight(for: card))
                                .accessibilityLabel("Save profile")

                                Button {
                                    Task {
                                        await like(card)
                                    }
                                } label: {
                                    DiscoverActionButton(
                                        symbol: "heart.fill",
                                        tint: .white,
                                        background: BrandStyle.secondary
                                    )
                                    .overlay {
                                        if isActionInFlight(for: card, kind: .like) {
                                            ProgressView()
                                                .tint(.white)
                                        }
                                    }
                                }
                                .buttonStyle(.plain)
                                .disabled(isActionInFlight(for: card))
                                .accessibilityLabel("Like profile")

                                Spacer()
                            }
                        }
                        .triadCard()
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task(id: selectedAudience) {
            locationPermissions.refreshStatus()
            await reload()
        }
        .onChange(of: scenePhase) { newPhase in
            if newPhase == .active {
                locationPermissions.refreshStatus()
            }
        }
        .refreshable {
            locationPermissions.refreshStatus()
            await reload()
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            cards = try await session.loadDiscovery(userType: selectedAudience.apiValue)
        } catch {
            session.presentError(error)
        }
    }

    private func like(_ card: DiscoveryCard) async {
        beginAction(for: card, kind: .like)
        defer { endAction() }

        do {
            let result = try await session.like(userId: card.userId)
            removeCard(card)
            notice = result.matched ? "You matched with \(card.username)." : "Like sent to \(card.username)."
        } catch {
            session.presentError(error)
        }
    }

    private func saveForLater(_ card: DiscoveryCard) async {
        beginAction(for: card, kind: .save)
        defer { endAction() }

        do {
            try await session.saveProfile(userId: card.userId)
            removeCard(card)
            notice = "\(card.username) was saved for later."
        } catch {
            session.presentError(error)
        }
    }

    private func removeCard(_ card: DiscoveryCard) {
        cards.removeAll { $0.id == card.id }
    }

    @ViewBuilder
    private func discoverCardSummary(for card: DiscoveryCard) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            RemoteMediaView(path: card.photos.first?.url, height: 220)

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(card.username)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(BrandStyle.textPrimary)

                    Text("\(card.ageMin)-\(card.ageMax) | \(card.intent.capitalized)")
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textSecondary)
                }

                Spacer()

                SectionBadge(
                    text: card.isCouple ? "Couple" : "Single",
                    color: card.isCouple ? BrandStyle.secondary : BrandStyle.accent
                )
            }

            Text(card.bio.isEmpty ? "No bio yet." : card.bio)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textPrimary)

            HStack(spacing: 8) {
                if !card.city.isEmpty || !card.state.isEmpty {
                    SectionBadge(
                        text: "\(card.city), \(card.state)".trimmingCharacters(in: CharacterSet(charactersIn: ", ")),
                        color: .blue
                    )
                }

                if let distance = card.approximateDistanceKm {
                    SectionBadge(
                        text: String(format: "%.0f km away", distance),
                        color: BrandStyle.accent
                    )
                }
            }

            if !card.interests.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(card.interests, id: \.self) { interest in
                            SectionBadge(text: interest, color: BrandStyle.textSecondary)
                        }
                    }
                }
            }

            HStack {
                Spacer()

                Label("View full profile", systemImage: "arrow.right.circle.fill")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.accent)
            }
        }
    }

    private func beginAction(for card: DiscoveryCard, kind: ActionKind) {
        activeUserID = card.id
        activeActionKind = kind
    }

    private func endAction() {
        activeUserID = nil
        activeActionKind = nil
    }

    private func isActionInFlight(for card: DiscoveryCard) -> Bool {
        activeUserID == card.id
    }

    private func isActionInFlight(for card: DiscoveryCard, kind: ActionKind) -> Bool {
        activeUserID == card.id && activeActionKind == kind
    }
}
