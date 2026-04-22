import SwiftUI

struct MatchesView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var matches: [MatchItem] = []
    @State private var isLoading = false

    var body: some View {
        ScreenContainer(title: "Matches") {
            if isLoading {
                ProgressView("Loading your matches...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if matches.isEmpty, !isLoading {
                EmptyStateCard(
                    title: "No matches yet",
                    message: "Likes that become mutual matches will show up here."
                )
            } else {
                ForEach(matches) { match in
                    VStack(alignment: .leading, spacing: 14) {
                        HStack {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(participantNames(for: match))
                                    .font(.headline)
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Text(match.matchedAt.formatted(date: .abbreviated, time: .shortened))
                                    .font(.subheadline)
                                    .foregroundStyle(BrandStyle.textSecondary)
                            }

                            Spacer()

                            SectionBadge(
                                text: match.isGroupChat ? "Group" : "Direct",
                                color: match.isGroupChat ? BrandStyle.secondary : BrandStyle.accent
                            )
                        }

                        if let primaryPhoto = match.participants.first?.photos.first?.url {
                            RemoteMediaView(path: primaryPhoto, height: 180)
                        }

                        ForEach(match.participants) { participant in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(participant.username)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Text(participant.bio.isEmpty ? "No bio yet." : participant.bio)
                                    .font(.footnote)
                                    .foregroundStyle(BrandStyle.textSecondary)
                                    .lineLimit(3)
                            }
                        }
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
            matches = try await session.loadMatches()
        } catch {
            session.presentError(error)
        }
    }

    private func participantNames(for match: MatchItem) -> String {
        let names = match.participants.map(\.username)
        return names.isEmpty ? "Unknown match" : names.joined(separator: ", ")
    }
}
