import SwiftUI

/// Shown to User A (the sender) so they can read the response and accept or decline.
struct ImpressMeReviewView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    let onComplete: (ImpressMeSignal) -> Void

    @State private var currentSignal: ImpressMeSignal
    @State private var isAccepting = false
    @State private var isDeclining = false
    @State private var isMarkingViewed = false
    @State private var showDeclineConfirm = false

    init(signal: ImpressMeSignal, onComplete: @escaping (ImpressMeSignal) -> Void) {
        self.onComplete = onComplete
        _currentSignal = State(initialValue: signal)
    }

    private var isBusy: Bool { isAccepting || isDeclining || isMarkingViewed }

    var body: some View {
        NavigationStack {
            ZStack {
                ScreenBackdrop().ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        header
                        promptCard
                        if let resp = currentSignal.response {
                            responseCard(resp)
                        }
                        if currentSignal.response == nil {
                            waitingBanner
                        } else if currentSignal.status != .accepted && currentSignal.status != .declined {
                            actionButtons
                        } else {
                            resolvedBanner
                        }
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Their Answer")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            }
            .confirmationDialog(
                "Pass on this one?",
                isPresented: $showDeclineConfirm,
                titleVisibility: .visible
            ) {
                Button("Yes, Pass", role: .destructive) { Task { await decline() } }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("You can't undo this. \(currentSignal.receiverUsername) won't know you passed.")
            }
            .task {
                await markReviewedIfNeeded()
            }
        }
    }

    // MARK: – Subviews

    private var header: some View {
        HStack(spacing: 12) {
            avatarView(url: currentSignal.receiverPhotoUrl)
            VStack(alignment: .leading, spacing: 3) {
                Text(currentSignal.response == nil ? "Challenge sent" : "\(currentSignal.receiverUsername) replied!")
                    .font(.headline)
                    .foregroundStyle(BrandStyle.textPrimary)
                Label(currentSignal.prompt.category, systemImage: "sparkles")
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.accent)
            }
            Spacer()
        }
    }

    private var promptCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Label("Your challenge", systemImage: "text.quote")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)
            Text(currentSignal.prompt.promptText)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textPrimary)
                .lineSpacing(3)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(BrandStyle.accent.opacity(0.06), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .stroke(BrandStyle.accent.opacity(0.14), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func responseCard(_ resp: ImpressMeResponseModel) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("\(currentSignal.receiverUsername)'s answer", systemImage: "quote.opening")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(BrandStyle.secondary)

            Text(resp.textContent)
                .font(.body)
                .foregroundStyle(BrandStyle.textPrimary)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)

            Text(resp.createdAt.formatted(date: .abbreviated, time: .shortened))
                .font(.caption)
                .foregroundStyle(BrandStyle.textSecondary)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [BrandStyle.secondary.opacity(0.10), BrandStyle.accent.opacity(0.06)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 20, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(BrandStyle.secondary.opacity(0.18), lineWidth: 1)
        )
    }

    private var waitingBanner: some View {
        HStack(spacing: 10) {
            if isMarkingViewed {
                ProgressView()
                    .controlSize(.small)
            } else {
                Image(systemName: "clock.badge.checkmark.fill")
                    .foregroundStyle(BrandStyle.accent)
            }
            Text("Your challenge is live. We'll bring their answer into Sent as soon as they reply.")
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textSecondary)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(BrandStyle.accent.opacity(0.08))
        )
    }

    private var actionButtons: some View {
        VStack(spacing: 12) {
            // Accept
            Button {
                Task { await accept() }
            } label: {
                Group {
                    if isAccepting {
                        ProgressView().tint(.white)
                    } else {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.seal.fill")
                            Text(currentSignal.flow == .preMatch ? "Accept & Create Match" : "Accept")
                                .font(.headline)
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(
                    LinearGradient(colors: [BrandStyle.accent, BrandStyle.secondary],
                                   startPoint: .leading, endPoint: .trailing),
                    in: RoundedRectangle(cornerRadius: 22, style: .continuous)
                )
                .foregroundStyle(.white)
            }
            .buttonStyle(.plain)
            .disabled(isBusy)

            // Decline
            Button {
                showDeclineConfirm = true
            } label: {
                Group {
                    if isDeclining {
                        ProgressView().tint(BrandStyle.textSecondary)
                    } else {
                        Text("Pass")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(BrandStyle.textSecondary)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(Color.white.opacity(0.45), in: RoundedRectangle(cornerRadius: 22, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .stroke(BrandStyle.cardBorder, lineWidth: 1)
                )
            }
            .buttonStyle(.plain)
            .disabled(isBusy)

            if currentSignal.flow == .preMatch {
                Text("Accepting creates the match immediately.")
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
                    .multilineTextAlignment(.center)
            }
        }
    }

    @ViewBuilder
    private var resolvedBanner: some View {
        let (icon, msg, color): (String, String, Color) = currentSignal.status == .accepted
            ? ("checkmark.seal.fill", "You accepted this answer ✨", .green)
            : ("xmark.circle.fill",  "You passed on this one.", BrandStyle.textSecondary)
        HStack(spacing: 10) {
            Image(systemName: icon).foregroundStyle(color)
            Text(msg).font(.subheadline.weight(.semibold)).foregroundStyle(color)
        }
        .padding(14)
        .frame(maxWidth: .infinity)
        .background(color.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    @ViewBuilder
    private func avatarView(url: String?) -> some View {
        if let url {
            RemoteMediaView(path: url, height: 46)
                .frame(width: 46, height: 46).clipShape(Circle())
        } else {
            Circle()
                .fill(BrandStyle.secondary.opacity(0.15))
                .frame(width: 46, height: 46)
                .overlay(Image(systemName: "person.fill").foregroundStyle(BrandStyle.secondary))
        }
    }

    // MARK: – Actions

    private func markReviewedIfNeeded() async {
        guard currentSignal.status == .responded, !isMarkingViewed else { return }
        isMarkingViewed = true
        defer { isMarkingViewed = false }
        do {
            let updated = try await session.reviewImpressMe(signalId: currentSignal.id)
            currentSignal = updated
        } catch {
            session.presentError(error)
        }
    }

    private func accept() async {
        isAccepting = true
        defer { isAccepting = false }
        do {
            let updated = try await session.acceptImpressMe(signalId: currentSignal.id)
            currentSignal = updated
            onComplete(updated)
        } catch {
            session.presentError(error)
        }
    }

    private func decline() async {
        isDeclining = true
        defer { isDeclining = false }
        do {
            let updated = try await session.declineImpressMe(signalId: currentSignal.id)
            currentSignal = updated
            onComplete(updated)
        } catch {
            session.presentError(error)
        }
    }
}
