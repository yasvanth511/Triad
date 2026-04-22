import SwiftUI

private enum ProfileReportReason: String, CaseIterable, Identifiable {
    case spam = "Spam"
    case harassment = "Harassment"
    case fakeProfile = "Fake Profile"
    case scam = "Scam"
    case other = "Other"

    var id: String { rawValue }

    var helperText: String {
        switch self {
        case .spam:
            return "Repeated unwanted promos, links, or low-quality blasts."
        case .harassment:
            return "Abusive, threatening, or uncomfortable behavior."
        case .fakeProfile:
            return "Impersonation, stolen photos, or misleading identity."
        case .scam:
            return "Money asks, manipulation, or suspicious off-platform behavior."
        case .other:
            return "Anything else that should be reviewed."
        }
    }
}

struct ProfileDetailView: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    let userId: UUID
    let fallbackName: String
    var onBlocked: ((UUID) -> Void)?

    @State private var profile: UserProfile?
    @State private var isLoading = false
    @State private var isShowingReportSheet = false
    @State private var isShowingBlockAlert = false
    @State private var isBlocking = false
    @State private var notice: String?

    private let metricColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    private let interestColumns = [
        GridItem(.adaptive(minimum: 96), spacing: 8)
    ]

    var body: some View {
        ScreenContainer(title: "Profile") {
            if isLoading, profile == nil {
                ProgressView("Loading profile...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            }

            if let notice {
                EmptyStateCard(title: "Update", message: notice)
            }

            if let profile {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 16) {
                        RemoteMediaView(path: profile.photos.first?.url, height: 320)

                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(profile.username)
                                    .font(.system(size: 30, weight: .bold, design: .rounded))
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Text("\(profile.ageMin)-\(profile.ageMax) | \(profile.intent.capitalized)")
                                    .font(.subheadline)
                                    .foregroundStyle(BrandStyle.textSecondary)

                                Label(locationText(for: profile), systemImage: "mappin.and.ellipse")
                                    .font(.subheadline)
                                    .foregroundStyle(BrandStyle.textSecondary)
                            }

                            Spacer()

                            SectionBadge(
                                text: profile.isCouple ? "Couple" : "Single",
                                color: profile.isCouple ? BrandStyle.secondary : BrandStyle.accent
                            )
                        }

                        Text(profile.bio.isEmpty ? "No bio yet. This profile is still finding its voice." : profile.bio)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.textPrimary)
                            .lineSpacing(3)

                        LazyVGrid(columns: metricColumns, spacing: 12) {
                            ProfileDetailMetricTile(
                                title: "Looking For",
                                value: profile.lookingFor.capitalized,
                                color: BrandStyle.accent
                            )
                            ProfileDetailMetricTile(
                                title: "Intent",
                                value: profile.intent.capitalized,
                                color: BrandStyle.secondary
                            )
                            ProfileDetailMetricTile(
                                title: "Profile Type",
                                value: profile.isCouple ? "Couple" : "Single",
                                color: .blue
                            )
                            ProfileDetailMetricTile(
                                title: "Radius",
                                value: "\(profile.radiusMiles ?? 25) mi",
                                color: BrandStyle.textSecondary
                            )
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 14) {
                        profileSectionHeader(
                            title: "Profile Details",
                            subtitle: "A fuller look at the person behind the card."
                        )

                        VStack(spacing: 12) {
                            ProfileInfoRow(
                                icon: "mappin.circle.fill",
                                title: "Location",
                                value: locationText(for: profile)
                            )

                            ProfileInfoRow(
                                icon: "mail.stack.fill",
                                title: "Zip Code",
                                value: profile.zipCode.isEmpty ? "Not shared" : profile.zipCode
                            )

                            if profile.isCouple {
                                ProfileInfoRow(
                                    icon: "person.2.fill",
                                    title: "Coupled With",
                                    value: profile.couplePartnerName ?? "Couple profile"
                                )
                            }
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 14) {
                        profileSectionHeader(
                            title: "Interests",
                            subtitle: profile.interests.isEmpty
                                ? "No interests listed yet."
                                : "A quick feel for what this profile is into."
                        )

                        if profile.interests.isEmpty {
                            Text("No interests added yet.")
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        } else {
                            LazyVGrid(columns: interestColumns, alignment: .leading, spacing: 8) {
                                ForEach(profile.interests, id: \.self) { interest in
                                    SectionBadge(text: interest, color: BrandStyle.textSecondary)
                                }
                            }
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 12) {
                        profileSectionHeader(
                            title: "Safety",
                            subtitle: "Use these options if something feels off or unsafe."
                        )

                        ProfileDetailActionRow(
                            title: "Report Profile",
                            subtitle: "Send this profile to moderation with a reason.",
                            icon: "exclamationmark.bubble.fill",
                            tint: BrandStyle.secondary
                        ) {
                            isShowingReportSheet = true
                        }

                        ProfileDetailActionRow(
                            title: "Block User",
                            subtitle: "Remove this person from your experience right away.",
                            icon: "hand.raised.fill",
                            tint: .red,
                            isDestructive: true,
                            isDisabled: isBlocking
                        ) {
                            isShowingBlockAlert = true
                        }
                    }
                    .triadCard()
                }
            } else if !isLoading {
                EmptyStateCard(
                    title: "Profile unavailable",
                    message: "We couldn't load \(fallbackName)'s profile right now."
                )
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task(id: userId) {
            await reload()
        }
        .sheet(isPresented: $isShowingReportSheet) {
            NavigationStack {
                ReportProfileSheet(userId: userId, username: profile?.username ?? fallbackName) { message in
                    notice = message
                }
                .environmentObject(session)
            }
            .presentationDetents([.medium, .large])
        }
        .alert("Block this profile?", isPresented: $isShowingBlockAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Block", role: .destructive) {
                Task {
                    await blockUser()
                }
            }
        } message: {
            Text("This will remove \(profile?.username ?? fallbackName) from future interactions.")
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            profile = try await session.loadProfile(userId: userId)
        } catch {
            session.presentError(error)
        }
    }

    private func blockUser() async {
        guard !isBlocking else { return }
        isBlocking = true
        defer { isBlocking = false }

        do {
            try await session.block(userId: userId)
            onBlocked?(userId)
            dismiss()
        } catch {
            session.presentError(error)
        }
    }

    private func locationText(for profile: UserProfile) -> String {
        let parts = [profile.city, profile.state].filter { !$0.isEmpty }
        return parts.isEmpty ? "Location not shared" : parts.joined(separator: ", ")
    }

    @ViewBuilder
    private func profileSectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.headline)
                .foregroundStyle(BrandStyle.textPrimary)

            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textSecondary)
        }
    }
}

private struct ReportProfileSheet: View {
    @EnvironmentObject private var session: SessionStore
    @Environment(\.dismiss) private var dismiss

    let userId: UUID
    let username: String
    let onSubmitted: (String) -> Void

    @State private var selectedReason: ProfileReportReason = .spam
    @State private var details = ""
    @State private var isSubmitting = false

    var body: some View {
        Form {
            Section("Reason") {
                Picker("Reason", selection: $selectedReason) {
                    ForEach(ProfileReportReason.allCases) { reason in
                        Text(reason.rawValue).tag(reason)
                    }
                }
                .pickerStyle(.navigationLink)

                Text(selectedReason.helperText)
                    .font(.footnote)
                    .foregroundStyle(BrandStyle.textSecondary)
            }

            Section("Additional Details") {
                TextField("Share a little context if it helps moderation.", text: $details, axis: .vertical)
                    .lineLimit(4 ... 8)

                Text("\(trimmedDetails.count)/500")
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .scrollContentBackground(.hidden)
        .background(ScreenBackdrop())
        .navigationTitle("Report \(username)")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button(isSubmitting ? "Sending..." : "Submit") {
                    Task {
                        await submit()
                    }
                }
                .disabled(isSubmitting)
            }
        }
    }

    private var trimmedDetails: String {
        String(details.trimmingCharacters(in: .whitespacesAndNewlines).prefix(500))
    }

    private func submit() async {
        guard !isSubmitting else { return }
        isSubmitting = true
        defer { isSubmitting = false }

        do {
            try await session.report(
                userId: userId,
                reason: selectedReason.rawValue,
                details: trimmedDetails.isEmpty ? nil : trimmedDetails
            )
            onSubmitted("Report submitted for \(username).")
            dismiss()
        } catch {
            session.presentError(error)
        }
    }
}

private struct ProfileDetailMetricTile: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)

            Text(value)
                .font(.headline)
                .foregroundStyle(BrandStyle.textPrimary)
                .lineLimit(2)
                .minimumScaleFactor(0.85)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(color.opacity(0.12))
        )
    }
}

private struct ProfileDetailActionRow: View {
    let title: String
    let subtitle: String
    let icon: String
    let tint: Color
    var isDestructive = false
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(tint.opacity(0.14))
                        .frame(width: 46, height: 46)

                    Image(systemName: icon)
                        .font(.system(size: 18, weight: .semibold))
                        .foregroundStyle(tint)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(isDestructive ? .red : BrandStyle.textPrimary)

                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textSecondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                if isDisabled {
                    ProgressView()
                        .tint(tint)
                } else {
                    Image(systemName: "chevron.right")
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            }
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
    }
}

private struct ProfileInfoRow: View {
    let icon: String
    let title: String
    let value: String

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(BrandStyle.accent)
                .frame(width: 38, height: 38)
                .background(
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(BrandStyle.accent.opacity(0.12))
                )

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BrandStyle.textSecondary)

                Text(value)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textPrimary)
                    .textSelection(.enabled)
            }

            Spacer(minLength: 0)
        }
    }
}
