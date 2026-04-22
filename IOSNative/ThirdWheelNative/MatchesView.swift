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
                    NavigationLink {
                        MatchChatView(match: match)
                    } label: {
                        matchCard(for: match)
                    }
                    .buttonStyle(.plain)
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

    @ViewBuilder
    private func matchCard(for match: MatchItem) -> some View {
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

private struct MatchChatView: View {
    @EnvironmentObject private var session: SessionStore

    let match: MatchItem

    @State private var messages: [MessageItem] = []
    @State private var draft = ""
    @State private var isLoading = false
    @State private var isSending = false
    @State private var selectedParticipantID: UUID?
    @State private var isShowingProfileDetail = false

    var body: some View {
        ZStack {
            ScreenBackdrop()

            VStack(spacing: 16) {
                if isLoading {
                    ProgressView("Loading conversation...")
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 20)
                }

                if messages.isEmpty, !isLoading {
                    EmptyStateCard(
                        title: "No messages yet",
                        message: "Say hi to start the conversation."
                    )
                    .padding(.horizontal, 20)
                } else {
                    ScrollViewReader { proxy in
                        ScrollView(showsIndicators: false) {
                            LazyVStack(spacing: 12) {
                                ForEach(messages) { message in
                                    messageBubble(for: message)
                                        .id(message.id)
                                }
                            }
                            .padding(.horizontal, 20)
                            .padding(.top, 18)
                            .padding(.bottom, 12)
                        }
                        .onChange(of: messages.count) { _ in
                            guard let lastId = messages.last?.id else { return }
                            withAnimation(.easeOut(duration: 0.2)) {
                                proxy.scrollTo(lastId, anchor: .bottom)
                            }
                        }
                    }
                }

                composer
                    .padding(.horizontal, 20)
                    .padding(.bottom, 14)
            }
        }
        .navigationTitle(chatTitle)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                profileNavigationControl
            }
        }
        .navigationDestination(isPresented: $isShowingProfileDetail) {
            if let participantId = selectedParticipantID {
                let participant = match.participants.first { $0.userId == participantId }
                ProfileDetailView(
                    userId: participantId,
                    fallbackName: participant?.username ?? "Profile"
                )
            } else {
                EmptyView()
            }
        }
        .task {
            await reload()
        }
    }

    private var chatTitle: String {
        let names = match.participants.map(\.username)
        return names.isEmpty ? "Chat" : names.joined(separator: ", ")
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 12) {
            TextField("Send a message", text: $draft, axis: .vertical)
                .textFieldStyle(.plain)
                .lineLimit(1 ... 4)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(Color.white.opacity(0.82))
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .stroke(BrandStyle.cardBorder, lineWidth: 1)
                )

            Button {
                Task {
                    await send()
                }
            } label: {
                Image(systemName: "paperplane.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(.white)
                    .frame(width: 46, height: 46)
                    .background(BrandStyle.accent, in: Circle())
            }
            .disabled(isSending || trimmedDraft.isEmpty)
            .opacity(isSending || trimmedDraft.isEmpty ? 0.55 : 1)
        }
    }

    private var trimmedDraft: String {
        draft.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    @ViewBuilder
    private var profileNavigationControl: some View {
        if let primaryParticipant = match.participants.first, match.participants.count == 1 {
            Button {
                selectedParticipantID = primaryParticipant.userId
                isShowingProfileDetail = true
            } label: {
                Label("Profile", systemImage: "person.crop.circle")
            }
        } else if !match.participants.isEmpty {
            Menu {
                ForEach(match.participants) { participant in
                    Button(participant.username) {
                        selectedParticipantID = participant.userId
                        isShowingProfileDetail = true
                    }
                }
            } label: {
                Label("Profiles", systemImage: "person.2.crop.square.stack")
            }
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            messages = try await session.loadMessages(matchId: match.id)
        } catch {
            session.presentError(error)
        }
    }

    private func send() async {
        let content = trimmedDraft
        guard !content.isEmpty, !isSending else { return }

        isSending = true
        defer { isSending = false }

        do {
            let message = try await session.sendMessage(matchId: match.id, content: content)
            draft = ""
            messages.append(message)
        } catch {
            session.presentError(error)
        }
    }

    @ViewBuilder
    private func messageBubble(for message: MessageItem) -> some View {
        let isCurrentUser = message.senderId == session.currentUser?.id

        VStack(alignment: isCurrentUser ? .trailing : .leading, spacing: 6) {
            Text(isCurrentUser ? "You" : message.senderUsername)
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)

            Text(message.content)
                .font(.body)
                .foregroundStyle(isCurrentUser ? .white : BrandStyle.textPrimary)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(isCurrentUser ? BrandStyle.accent : Color.white.opacity(0.82))
                )

            Text(message.sentAt.formatted(date: .omitted, time: .shortened))
                .font(.caption2)
                .foregroundStyle(BrandStyle.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: isCurrentUser ? .trailing : .leading)
    }
}
