import SwiftUI
import UIKit

struct CoupleLinkCard: View {
    @EnvironmentObject private var session: SessionStore

    @State private var status: CoupleStatus?
    @State private var isLoading = false
    @State private var isMutating = false
    @State private var joinCode: String = ""
    @State private var showUnlinkConfirmation = false
    @State private var showCancelConfirmation = false
    @State private var didCopyCode = false
    @State private var shareSheetItem: ShareSheetItem?
    @State private var errorMessage: String?

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            header

            if isLoading && status == nil {
                HStack {
                    ProgressView()
                    Text("Loading couple status…")
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            } else if let status {
                if status.isComplete {
                    linkedState(status: status)
                } else if status.coupleId != nil, let code = status.inviteCode {
                    waitingState(code: code)
                } else {
                    unlinkedState
                }
            } else {
                unlinkedState
            }

            if let errorMessage {
                Text(errorMessage)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .triadCard()
        .task { await loadStatus() }
        .alert("Unlink your partner?", isPresented: $showUnlinkConfirmation) {
            Button("Cancel", role: .cancel) {}
            Button("Unlink", role: .destructive) {
                Task { await leaveCouple() }
            }
        } message: {
            Text("You'll be shown as single again. Your partner will also be unlinked.")
        }
        .alert("Cancel invite?", isPresented: $showCancelConfirmation) {
            Button("Keep Code", role: .cancel) {}
            Button("Cancel Invite", role: .destructive) {
                Task { await leaveCouple() }
            }
        } message: {
            Text("Your invite code will stop working. You can generate a new one any time.")
        }
        .sheet(item: $shareSheetItem) { item in
            ShareSheet(activityItems: [item.text])
        }
    }

    // MARK: – Header

    @ViewBuilder
    private var header: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Couple")
                .font(.headline)
                .foregroundStyle(BrandStyle.textPrimary)
            Text(headerSubtitle)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textSecondary)
        }
    }

    private var headerSubtitle: String {
        guard let status else {
            return "Link your account with your partner to appear as a couple."
        }
        if status.isComplete {
            return "You're linked with your partner."
        }
        if status.coupleId != nil {
            return "Share your invite code so your partner can join."
        }
        return "Generate a code to invite your partner, or enter theirs."
    }

    // MARK: – States

    @ViewBuilder
    private var unlinkedState: some View {
        VStack(alignment: .leading, spacing: 14) {
            Button {
                Task { await createCouple() }
            } label: {
                HStack {
                    if isMutating {
                        ProgressView().tint(.white)
                    } else {
                        Image(systemName: "person.2.fill")
                        Text("Generate Invite Code").font(.headline)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
                .background(BrandStyle.accent)
                .foregroundStyle(.white)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isMutating)

            HStack {
                Rectangle().fill(BrandStyle.textSecondary.opacity(0.25)).frame(height: 1)
                Text("or")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
                Rectangle().fill(BrandStyle.textSecondary.opacity(0.25)).frame(height: 1)
            }

            VStack(alignment: .leading, spacing: 8) {
                Text("Enter Your Partner's Code")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
                HStack {
                    TextField("e.g. A2B4K7P9", text: $joinCode)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled(true)
                        .font(.subheadline.monospaced())
                        .foregroundStyle(BrandStyle.textPrimary)
                        .padding(.vertical, 10)
                        .padding(.horizontal, 12)
                        .background(BrandStyle.textSecondary.opacity(0.08))
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

                    Button {
                        Task { await joinCouple() }
                    } label: {
                        if isMutating {
                            ProgressView()
                        } else {
                            Text("Link").font(.subheadline.weight(.semibold))
                        }
                    }
                    .buttonStyle(.plain)
                    .padding(.vertical, 10)
                    .padding(.horizontal, 16)
                    .background(joinCode.trimmingCharacters(in: .whitespaces).isEmpty ? BrandStyle.textSecondary.opacity(0.25) : BrandStyle.secondary)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    .disabled(isMutating || joinCode.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    @ViewBuilder
    private func waitingState(code: String) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Your Invite Code")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
                HStack {
                    Text(code)
                        .font(.system(size: 32, weight: .bold, design: .monospaced))
                        .foregroundStyle(BrandStyle.textPrimary)
                        .kerning(4)
                    Spacer()
                }
                .padding(.vertical, 18)
                .padding(.horizontal, 16)
                .frame(maxWidth: .infinity)
                .background(BrandStyle.accent.opacity(0.08))
                .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            }

            HStack(spacing: 10) {
                Button {
                    UIPasteboard.general.string = code
                    didCopyCode = true
                    Task {
                        try? await Task.sleep(nanoseconds: 1_800_000_000)
                        didCopyCode = false
                    }
                } label: {
                    HStack {
                        Image(systemName: didCopyCode ? "checkmark" : "doc.on.doc")
                        Text(didCopyCode ? "Copied" : "Copy").font(.subheadline.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(BrandStyle.accent.opacity(0.12))
                    .foregroundStyle(BrandStyle.accent)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)

                Button {
                    shareSheetItem = ShareSheetItem(text: "Join me on Triad with invite code: \(code)")
                } label: {
                    HStack {
                        Image(systemName: "square.and.arrow.up")
                        Text("Share").font(.subheadline.weight(.semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(BrandStyle.secondary.opacity(0.12))
                    .foregroundStyle(BrandStyle.secondary)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                }
                .buttonStyle(.plain)
            }

            HStack(spacing: 8) {
                ProgressView().scaleEffect(0.7)
                Text("Waiting for partner to join…")
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
            }

            Button(role: .destructive) {
                showCancelConfirmation = true
            } label: {
                Text("Cancel Invite")
                    .font(.subheadline.weight(.semibold))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color.red.opacity(0.08))
                    .foregroundStyle(.red)
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isMutating)
        }
    }

    @ViewBuilder
    private func linkedState(status: CoupleStatus) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 14) {
                Image(systemName: "person.2.fill")
                    .font(.title2)
                    .foregroundStyle(BrandStyle.secondary)
                    .frame(width: 44, height: 44)
                    .background(BrandStyle.secondary.opacity(0.12))
                    .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text("Linked with")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BrandStyle.textSecondary)
                    Text(status.partnerName ?? "Your partner")
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)
                }
                Spacer()
            }

            Button(role: .destructive) {
                showUnlinkConfirmation = true
            } label: {
                HStack {
                    if isMutating {
                        ProgressView().tint(.red)
                    } else {
                        Image(systemName: "person.2.slash.fill")
                        Text("Unlink Partner").font(.subheadline.weight(.semibold))
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(Color.red.opacity(0.08))
                .foregroundStyle(.red)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            }
            .buttonStyle(.plain)
            .disabled(isMutating)
        }
    }

    // MARK: – Actions

    private func loadStatus() async {
        guard !isLoading else { return }
        isLoading = true
        defer { isLoading = false }

        do {
            status = try await session.loadCoupleStatus()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func createCouple() async {
        guard !isMutating else { return }
        isMutating = true
        errorMessage = nil
        defer { isMutating = false }

        do {
            let response = try await session.createCouple()
            status = CoupleStatus(
                coupleId: response.coupleId,
                inviteCode: response.inviteCode,
                isComplete: false,
                partnerName: nil,
                partnerUserId: nil
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func joinCouple() async {
        let trimmed = joinCode.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        guard !trimmed.isEmpty, !isMutating else { return }
        isMutating = true
        errorMessage = nil
        defer { isMutating = false }

        do {
            _ = try await session.joinCouple(inviteCode: trimmed)
            joinCode = ""
            status = try await session.loadCoupleStatus()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func leaveCouple() async {
        guard !isMutating else { return }
        isMutating = true
        errorMessage = nil
        defer { isMutating = false }

        do {
            try await session.leaveCouple()
            status = CoupleStatus(
                coupleId: nil,
                inviteCode: nil,
                isComplete: false,
                partnerName: nil,
                partnerUserId: nil
            )
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

private struct ShareSheetItem: Identifiable {
    let id = UUID()
    let text: String
}

private struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
