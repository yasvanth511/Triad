import SwiftUI

// MARK: – Inbox (root view, used as a tab)

struct ImpressMeView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var inbox: ImpressMeInbox?
    @State private var isLoading = false
    @State private var tab: InboxTab = .received

    @State private var reviewing: ImpressMeSignal?
    @State private var viewingSenderProfile: ImpressMeSignal?

    enum InboxTab { case received, sent }

    var body: some View {
        ScreenContainer(title: "Impress Me") {
            tabPicker

            if isLoading, inbox == nil {
                ProgressView("Loading signals…")
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if tab == .received {
                receivedList
            } else {
                sentList
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .refreshable { await load() }
        .sheet(item: $reviewing) { signal in
            ImpressMeReviewView(signal: signal) { updated in
                applyUpdate(updated)
                reviewing = nil
            }
            .environmentObject(session)
        }
        .navigationDestination(
            isPresented: Binding(
                get: { viewingSenderProfile != nil },
                set: { isPresented in
                    if !isPresented {
                        viewingSenderProfile = nil
                    }
                }
            )
        ) {
            if let signal = viewingSenderProfile {
                ProfileDetailView(
                    userId: signal.senderId,
                    fallbackName: signal.senderUsername,
                    receivedImpressMeSignalId: signal.id,
                    onImpressMeSignalUpdated: { updated in
                        applyUpdate(updated)
                    }
                )
                .environmentObject(session)
            } else {
                EmptyView()
            }
        }
        .onChange(of: session.impressMeSummary) { _ in
            guard inbox != nil else { return }
            Task { await load() }
        }
    }

    // MARK: – Tab picker

    private var tabPicker: some View {
        HStack(spacing: 0) {
            tabButton("Received", badge: inbox?.unreadCount ?? 0, tab: .received)
            tabButton("Sent", badge: inbox?.sentNeedsReviewCount ?? 0, tab: .sent)
        }
        .padding(4)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.white.opacity(0.38))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(BrandStyle.cardBorder, lineWidth: 1)
        )
        .padding(.bottom, 4)
    }

    @ViewBuilder
    private func tabButton(_ title: String, badge: Int, tab: InboxTab) -> some View {
        Button {
            withAnimation(.easeInOut(duration: 0.18)) { self.tab = tab }
        } label: {
            HStack(spacing: 5) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(self.tab == tab ? .white : BrandStyle.textSecondary)
                if badge > 0 {
                    Text("\(badge)")
                        .font(.caption2.weight(.bold))
                        .foregroundStyle(self.tab == tab ? BrandStyle.accent : .white)
                        .padding(.horizontal, 6).padding(.vertical, 2)
                        .background(self.tab == tab ? Color.white : BrandStyle.accent, in: Capsule())
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 9)
            .background(
                self.tab == tab
                    ? AnyShapeStyle(LinearGradient(colors: [BrandStyle.accent, BrandStyle.secondary],
                                                   startPoint: .leading, endPoint: .trailing))
                    : AnyShapeStyle(Color.clear),
                in: RoundedRectangle(cornerRadius: 10, style: .continuous)
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: – Lists

    @ViewBuilder
    private var receivedList: some View {
        let items = inbox?.received ?? []
        if items.isEmpty, !isLoading {
            EmptyStateCard(
                title: "No signals yet",
                message: "When someone sends you an Impress Me, it shows up here."
            )
        } else {
            ForEach(items) { signal in
                ImpressMeSignalCard(
                    signal: signal,
                    role: .receiver,
                    onTap: { viewingSenderProfile = signal }
                )
            }
        }
    }

    @ViewBuilder
    private var sentList: some View {
        let items = inbox?.sent ?? []
        if items.isEmpty, !isLoading {
            EmptyStateCard(
                title: "Nothing sent yet",
                message: "Send an Impress Me from any profile to start a challenge."
            )
        } else {
            ForEach(items) { signal in
                ImpressMeSignalCard(
                    signal: signal,
                    role: .sender,
                    onTap: {
                        if signal.status == .responded || signal.status == .viewed {
                            reviewing = signal
                        }
                    }
                )
            }
        }
    }

    // MARK: – Data

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do { inbox = try await session.getImpressMeInbox() }
        catch { session.presentError(error) }
    }

    private func applyUpdate(_ updated: ImpressMeSignal) {
        guard var current = inbox else { return }
        func replace(in list: inout [ImpressMeSignal]) {
            if let i = list.firstIndex(where: { $0.id == updated.id }) {
                list[i] = updated
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

// MARK: – Signal card

enum ImpressMeRole { case sender, receiver }

struct ImpressMeSignalCard: View {
    let signal: ImpressMeSignal
    let role: ImpressMeRole
    let onTap: () -> Void

    private var otherUsername: String {
        role == .receiver ? signal.senderUsername : signal.receiverUsername
    }
    private var otherPhotoUrl: String? {
        role == .receiver ? signal.senderPhotoUrl : signal.receiverPhotoUrl
    }

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Header
                HStack(spacing: 12) {
                    avatarView
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(otherUsername)
                                .font(.headline)
                                .foregroundStyle(BrandStyle.textPrimary)
                            SectionBadge(
                                text: signal.flow == .preMatch ? "Pre-match" : "Post-match",
                                color: signal.flow == .preMatch ? BrandStyle.secondary : BrandStyle.accent
                            )
                        }
                        statusLine
                    }
                    Spacer(minLength: 0)
                    if !signal.isExpired && !signal.status.isTerminal {
                        timerBadge
                    }
                }

                // Prompt preview
                VStack(alignment: .leading, spacing: 4) {
                    Label(signal.prompt.category, systemImage: "sparkles")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BrandStyle.accent)
                    Text(signal.prompt.promptText)
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textPrimary)
                        .lineLimit(3)
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(BrandStyle.accent.opacity(0.06), in: RoundedRectangle(cornerRadius: 14, style: .continuous))

                // Response preview (sender side after response arrives)
                if let resp = signal.response, role == .sender {
                    VStack(alignment: .leading, spacing: 4) {
                        Label("Their answer", systemImage: "quote.opening")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(BrandStyle.secondary)
                        Text(resp.textContent)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.textPrimary)
                            .lineLimit(4)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(BrandStyle.secondary.opacity(0.08), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                // CTA
                ctaLabel
            }
        }
        .buttonStyle(.plain)
        .triadCard()
    }

    private var avatarView: some View {
        Group {
            if let url = otherPhotoUrl {
                RemoteMediaView(path: url, height: 46)
                    .frame(width: 46, height: 46)
                    .clipShape(Circle())
            } else {
                Circle()
                    .fill(BrandStyle.accent.opacity(0.15))
                    .frame(width: 46, height: 46)
                    .overlay(Image(systemName: "person.fill").foregroundStyle(BrandStyle.accent))
            }
        }
    }

    @ViewBuilder
    private var statusLine: some View {
        let color: Color = {
            switch signal.status {
            case .responded: return .orange
            case .accepted:  return .green
            case .declined:  return .red
            case .expired:   return BrandStyle.textSecondary
            default:         return BrandStyle.textSecondary
            }
        }()
        Text(signal.status.displayLabel)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
    }

    private var timerBadge: some View {
        HStack(spacing: 4) {
            Image(systemName: "clock")
                .font(.caption2.weight(.semibold))
            Text("\(signal.hoursRemaining)h")
                .font(.caption2.weight(.semibold))
        }
        .foregroundStyle(signal.hoursRemaining < 6 ? Color.red : BrandStyle.textSecondary)
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(
            (signal.hoursRemaining < 6 ? Color.red : BrandStyle.textSecondary).opacity(0.1),
            in: Capsule()
        )
    }

    @ViewBuilder
    private var ctaLabel: some View {
        switch (role, signal.status) {
        case (.receiver, .sent):
            Label("View profile & reply", systemImage: "arrow.up.right.circle.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.accent)
        case (.sender, .responded), (.sender, .viewed):
            Label("Review their answer", systemImage: "eye.circle.fill")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.secondary)
        default:
            EmptyView()
        }
    }
}
