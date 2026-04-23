import SwiftUI

struct SavedProfilesView: View {
    private enum ActionKind {
        case remove
        case like
    }

    @EnvironmentObject private var session: SessionStore

    @State private var savedProfiles: [SavedProfileItem] = []
    @State private var isLoading = false
    @State private var activeUserID: UUID?
    @State private var activeActionKind: ActionKind?
    @State private var notice: String?

    var body: some View {
        ScreenContainer(title: "Saved") {
            if isLoading {
                ProgressView("Loading saved profiles...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let notice {
                EmptyStateCard(title: "Update", message: notice)
            }

            if savedProfiles.isEmpty, !isLoading {
                EmptyStateCard(
                    title: "Nothing saved yet",
                    message: "Bookmarks from Discover will land here so you can revisit them later."
                )
            } else {
                ForEach(savedProfiles) { profile in
                    VStack(alignment: .leading, spacing: 14) {
                        NavigationLink {
                            ProfileDetailView(userId: profile.userId, fallbackName: profile.username, onBlocked: { blockedId in
                                guard blockedId == profile.userId else { return }
                                removeLocally(profile)
                                notice = "\(profile.username) was blocked."
                            })
                        } label: {
                            savedCardSummary(for: profile)
                        }
                        .buttonStyle(.plain)
                        .disabled(isActionInFlight(for: profile))

                        actionRow(for: profile)
                    }
                    .triadCard()
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await reload()
        }
        .refreshable {
            await reload()
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            savedProfiles = try await session.loadSavedProfiles()
        } catch {
            session.presentError(error)
        }
    }

    @ViewBuilder
    private func savedCardSummary(for profile: SavedProfileItem) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            RemoteMediaView(path: profile.photos.first?.url, height: 220)

            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(profile.username)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(BrandStyle.textPrimary)

                    Text("\(profile.ageMin)-\(profile.ageMax) | \(profile.intent.capitalized)")
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textSecondary)
                }

                Spacer()

                SectionBadge(
                    text: profile.isCouple ? "Couple" : "Single",
                    color: profile.isCouple ? BrandStyle.secondary : BrandStyle.accent
                )
            }

            Text(profile.bio.isEmpty ? "No bio yet." : profile.bio)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textPrimary)

            HStack(spacing: 8) {
                SectionBadge(
                    text: "Saved \(profile.savedAt.formatted(date: .abbreviated, time: .omitted))",
                    color: BrandStyle.accent
                )

                if !profile.city.isEmpty || !profile.state.isEmpty {
                    SectionBadge(
                        text: "\(profile.city), \(profile.state)".trimmingCharacters(in: CharacterSet(charactersIn: ", ")),
                        color: .blue
                    )
                }

                if let distance = profile.approximateDistanceKm {
                    SectionBadge(
                        text: String(format: "%.0f km away", distance),
                        color: BrandStyle.textSecondary
                    )
                }
            }

            if !profile.interests.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(profile.interests, id: \.self) { interest in
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

    @ViewBuilder
    private func actionRow(for profile: SavedProfileItem) -> some View {
        HStack(spacing: 18) {
            Spacer()

            Button {
                Task {
                    await remove(profile)
                }
            } label: {
                DiscoverActionButton(
                    symbol: "bookmark.slash.fill",
                    tint: BrandStyle.textPrimary,
                    background: Color.white.opacity(0.78)
                )
                .overlay {
                    if isActionInFlight(for: profile, kind: .remove) {
                        ProgressView()
                            .tint(BrandStyle.textPrimary)
                    }
                }
            }
            .buttonStyle(.plain)
            .disabled(isActionInFlight(for: profile))
            .accessibilityLabel("Remove saved profile")

            Button {
                Task {
                    await like(profile)
                }
            } label: {
                DiscoverActionButton(
                    symbol: "heart.fill",
                    tint: .white,
                    background: BrandStyle.secondary
                )
                .overlay {
                    if isActionInFlight(for: profile, kind: .like) {
                        ProgressView()
                            .tint(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            .disabled(isActionInFlight(for: profile))
            .accessibilityLabel("Like saved profile")

            Spacer()
        }
    }

    private func like(_ profile: SavedProfileItem) async {
        beginAction(for: profile, kind: .like)
        defer { endAction() }

        do {
            let result = try await session.like(userId: profile.userId)
            removeLocally(profile)
            notice = result.matched
                ? "You matched with \(profile.username)."
                : "Like sent to \(profile.username)."
        } catch {
            session.presentError(error)
        }
    }

    private func remove(_ profile: SavedProfileItem) async {
        beginAction(for: profile, kind: .remove)
        defer { endAction() }

        do {
            try await session.removeSavedProfile(userId: profile.userId)
            removeLocally(profile)
            notice = "\(profile.username) was removed from saved profiles."
        } catch {
            session.presentError(error)
        }
    }

    private func removeLocally(_ profile: SavedProfileItem) {
        savedProfiles.removeAll { $0.id == profile.id }
    }

    private func beginAction(for profile: SavedProfileItem, kind: ActionKind) {
        activeUserID = profile.id
        activeActionKind = kind
    }

    private func endAction() {
        activeUserID = nil
        activeActionKind = nil
    }

    private func isActionInFlight(for profile: SavedProfileItem) -> Bool {
        activeUserID == profile.id
    }

    private func isActionInFlight(for profile: SavedProfileItem, kind: ActionKind) -> Bool {
        activeUserID == profile.id && activeActionKind == kind
    }
}
