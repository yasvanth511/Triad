import SwiftUI

/// Shown to User B (the receiver) so they can read the prompt and send a reply.
struct ImpressMeRespondView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    let signal: ImpressMeSignal
    let onComplete: (ImpressMeSignal) -> Void

    @State private var responseText = ""
    @State private var isSubmitting = false
    @FocusState private var isEditorFocused: Bool

    private var canSubmit: Bool {
        responseText.trimmingCharacters(in: .whitespacesAndNewlines).count >= 10 && !isSubmitting
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ScreenBackdrop().ignoresSafeArea()
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        challengeHeader
                        promptCard
                        if let ctx = signal.prompt.senderContext {
                            contextNote(ctx)
                        }
                        responseEditor
                        submitButton
                        disclaimer
                    }
                    .padding(.horizontal, 20)
                    .padding(.top, 20)
                    .padding(.bottom, 40)
                }
            }
            .navigationTitle("Your Challenge")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            }
        }
    }

    // MARK: – Subviews

    private var challengeHeader: some View {
        VStack(spacing: 8) {
            HStack(spacing: 10) {
                avatarView(url: signal.senderPhotoUrl)
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(signal.senderUsername) sent you a challenge")
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)
                    Label(signal.prompt.category, systemImage: "sparkles")
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.accent)
                }
                Spacer()
                if !signal.isExpired {
                    VStack(spacing: 2) {
                        Image(systemName: "clock")
                            .font(.caption.weight(.semibold))
                        Text("\(signal.hoursRemaining)h left")
                            .font(.caption2.weight(.semibold))
                    }
                    .foregroundStyle(signal.hoursRemaining < 6 ? .red : BrandStyle.textSecondary)
                }
            }
        }
    }

    private var promptCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label("The prompt", systemImage: "text.quote")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)

            Text(signal.prompt.promptText)
                .font(.title3.weight(.semibold))
                .foregroundStyle(BrandStyle.textPrimary)
                .lineSpacing(4)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            LinearGradient(
                colors: [BrandStyle.accent.opacity(0.10), BrandStyle.secondary.opacity(0.06)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            ),
            in: RoundedRectangle(cornerRadius: 20, style: .continuous)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(BrandStyle.accent.opacity(0.18), lineWidth: 1)
        )
    }

    @ViewBuilder
    private func contextNote(_ text: String) -> some View {
        HStack(spacing: 8) {
            Image(systemName: "info.circle")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.accent)
            Text(text)
                .font(.caption)
                .foregroundStyle(BrandStyle.textSecondary)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(.horizontal, 12).padding(.vertical, 8)
        .background(BrandStyle.accent.opacity(0.06), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    private var responseEditor: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Label("Your reply", systemImage: "pencil")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.textPrimary)
                Spacer()
                Text("\(responseText.count) / 1000")
                    .font(.caption)
                    .foregroundStyle(responseText.count > 900 ? .orange : BrandStyle.textSecondary)
                    .monospacedDigit()
            }

            TextEditor(text: $responseText)
                .focused($isEditorFocused)
                .font(.body)
                .foregroundStyle(BrandStyle.textPrimary)
                .frame(minHeight: 140, maxHeight: 300)
                .padding(12)
                .background(Color.white.opacity(0.85), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(isEditorFocused ? BrandStyle.accent : BrandStyle.cardBorder, lineWidth: 1.2)
                )
                .onChange(of: responseText) { _ in
                    if responseText.count > 1000 {
                        responseText = String(responseText.prefix(1000))
                    }
                }

            if responseText.trimmingCharacters(in: .whitespacesAndNewlines).count < 10,
               !responseText.isEmpty {
                Text("Write at least 10 characters to make it count.")
                    .font(.caption)
                    .foregroundStyle(.orange)
            }
        }
    }

    private var submitButton: some View {
        Button {
            Task { await submit() }
        } label: {
            Group {
                if isSubmitting {
                    ProgressView().tint(.white)
                } else {
                    Label("Send My Answer", systemImage: "sparkles")
                        .font(.headline)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                canSubmit
                    ? LinearGradient(colors: [BrandStyle.accent, BrandStyle.secondary],
                                     startPoint: .leading, endPoint: .trailing)
                    : LinearGradient(colors: [Color.gray.opacity(0.4), Color.gray.opacity(0.4)],
                                     startPoint: .leading, endPoint: .trailing),
                in: RoundedRectangle(cornerRadius: 22, style: .continuous)
            )
            .foregroundStyle(.white)
        }
        .buttonStyle(.plain)
        .disabled(!canSubmit)
    }

    private var disclaimer: some View {
        Text("Your answer goes directly to \(signal.senderUsername). They'll decide if it's a match.")
            .font(.caption)
            .foregroundStyle(BrandStyle.textSecondary)
            .multilineTextAlignment(.center)
    }

    @ViewBuilder
    private func avatarView(url: String?) -> some View {
        if let url {
            RemoteMediaView(path: url, height: 42)
                .frame(width: 42, height: 42).clipShape(Circle())
        } else {
            Circle()
                .fill(BrandStyle.accent.opacity(0.15))
                .frame(width: 42, height: 42)
                .overlay(Image(systemName: "person.fill").foregroundStyle(BrandStyle.accent))
        }
    }

    // MARK: – Action

    private func submit() async {
        let text = responseText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard text.count >= 10, !isSubmitting else { return }
        isSubmitting = true
        defer { isSubmitting = false }
        do {
            let updated = try await session.respondToImpressMe(
                signalId: signal.id,
                text: text
            )
            onComplete(updated)
        } catch {
            session.presentError(error)
        }
    }
}
