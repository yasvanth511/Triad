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
    var receivedImpressMeSignalId: UUID? = nil
    var onImpressMeSignalUpdated: ((ImpressMeSignal) -> Void)? = nil
    var onBlocked: ((UUID) -> Void)? = nil

    @State private var profile: UserProfile?
    @State private var isLoading = false
    @State private var isShowingReportSheet = false
    @State private var isShowingBlockAlert = false
    @State private var isBlocking = false
    @State private var notice: String?
    @State private var isSendingImpressMe = false
    @State private var isLoadingPendingImpressMe = false
    @State private var receivedImpressMeSignal: ImpressMeSignal?
    @State private var activeRespondSignal: ImpressMeSignal?
    @State private var isLoadingReceivedImpressMe = false
    @State private var outgoingImpressMeSignals: [ImpressMeSignal] = []

    private let metricColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    private var viewerRedFlags: Set<String> {
        Set((session.currentUser?.redFlags ?? []).map { $0.lowercased() })
    }

    private var isViewingReceivedImpressMe: Bool {
        receivedImpressMeSignalId != nil
    }

    private var pendingSentImpressMeSignal: ImpressMeSignal? {
        outgoingImpressMeSignals
            .filter { $0.status == .sent && !$0.isExpired }
            .sorted { $0.createdAt > $1.createdAt }
            .first
    }

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
                        PhotoCarouselView(photos: profile.orderedPhotos, height: 320)

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

                        if !profile.orderedVideos.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                profileSectionHeader(
                                    title: "Highlights",
                                    subtitle: "Tap a clip to watch this profile in motion."
                                )

                                VideoHighlightsView(
                                    videos: profile.orderedVideos,
                                    fallbackImagePath: profile.orderedPhotos.first?.url,
                                    titlePrefix: "Highlight"
                                )
                            }
                        }

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
                        let flaggedInterests = profile.interests.filter {
                            viewerRedFlags.contains($0.lowercased())
                        }

                        profileSectionHeader(
                            title: "Interests",
                            subtitle: profile.interests.isEmpty
                                ? "No interests listed yet."
                                : flaggedInterests.isEmpty
                                    ? "A quick feel for what this profile is into."
                                    : "\(flaggedInterests.count) red flag\(flaggedInterests.count == 1 ? "" : "s") detected."
                        )

                        if !flaggedInterests.isEmpty {
                            HStack(spacing: 8) {
                                Image(systemName: "flag.fill")
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(.red)
                                Text("This profile shares \(flaggedInterests.count == 1 ? "an interest" : "interests") you marked as a red flag.")
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 12, style: .continuous)
                                    .fill(Color.red.opacity(0.08))
                            )
                        }

                        if profile.interests.isEmpty {
                            Text("No interests added yet.")
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        } else {
                            InterestBadgeList(interests: profile.interests, flaggedSet: viewerRedFlags)
                        }
                    }
                    .triadCard()

                    datingPreferencesCard(profile: profile)

                    if isViewingReceivedImpressMe {
                        receivedImpressMeCard(profile: profile)
                    } else {
                        VStack(spacing: 14) {
                            profileSectionHeader(
                                title: "Impress Me",
                                subtitle: "Send a playful challenge shaped by this profile's interests."
                            )
                            Button {
                                Task { await sendImpressMe() }
                            } label: {
                                Group {
                                    if isSendingImpressMe || isLoadingPendingImpressMe {
                                        ProgressView().tint(.white)
                                    } else if pendingSentImpressMeSignal != nil {
                                        Label("Challenge Sent", systemImage: "paperplane.fill")
                                            .font(.headline)
                                    } else {
                                        Label("Impress Me ✨", systemImage: "sparkles")
                                            .font(.headline)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(
                                    LinearGradient(colors: [BrandStyle.accent, BrandStyle.secondary],
                                                   startPoint: .leading, endPoint: .trailing),
                                    in: RoundedRectangle(cornerRadius: 22, style: .continuous)
                                )
                                .foregroundStyle(.white)
                            }
                            .buttonStyle(.plain)
                            .disabled(isSendingImpressMe || isLoadingPendingImpressMe || pendingSentImpressMeSignal != nil)

                            Text(impressMeHelperText(profileName: profile.username))
                                .font(.caption)
                                .foregroundStyle(BrandStyle.textSecondary)
                                .multilineTextAlignment(.center)
                        }
                        .triadCard()
                    }

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
        .sheet(item: $activeRespondSignal) { signal in
            ImpressMeRespondView(signal: signal) { updated in
                receivedImpressMeSignal = updated
                onImpressMeSignalUpdated?(updated)
                notice = "Your answer was sent to \(updated.senderUsername)."
                activeRespondSignal = nil
            }
            .environmentObject(session)
        }
    }

    private func sendImpressMe() async {
        guard !isSendingImpressMe else { return }
        isSendingImpressMe = true
        defer { isSendingImpressMe = false }
        do {
            _ = try await session.sendImpressMe(targetUserId: userId, matchId: nil)
            await reloadOutgoingImpressMeSignals()
            notice = "Impress Me sent to \(profile?.username ?? fallbackName). Check Sent once they reply."
        } catch {
            if let apiError = error as? APIClientError,
               case let .requestFailed(_, message) = apiError,
               message.localizedCaseInsensitiveContains("pending impress me signal")
            {
                await reloadOutgoingImpressMeSignals()
                notice = "You already sent \(profile?.username ?? fallbackName) an Impress Me challenge. Waiting for their reply."
            } else {
                session.presentError(error)
            }
        }
    }

    private func reload() async {
        isLoading = true
        defer { isLoading = false }

        do {
            profile = try await session.loadProfile(userId: userId)
            await reloadReceivedImpressMeSignalIfNeeded()
            await reloadOutgoingImpressMeSignals()
        } catch {
            session.presentError(error)
        }
    }

    private func reloadOutgoingImpressMeSignals() async {
        guard !isViewingReceivedImpressMe else {
            outgoingImpressMeSignals = []
            return
        }

        isLoadingPendingImpressMe = true
        defer { isLoadingPendingImpressMe = false }

        do {
            let inbox = try await session.getImpressMeInbox()
            outgoingImpressMeSignals = inbox.sent.filter { $0.receiverId == userId }
        } catch {
            session.presentError(error)
        }
    }

    private func reloadReceivedImpressMeSignalIfNeeded() async {
        guard let receivedImpressMeSignalId else {
            receivedImpressMeSignal = nil
            return
        }

        isLoadingReceivedImpressMe = true
        defer { isLoadingReceivedImpressMe = false }

        do {
            let signal = try await session.getImpressMeSignal(signalId: receivedImpressMeSignalId)
            receivedImpressMeSignal = signal
            onImpressMeSignalUpdated?(signal)
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

    private func impressMeHelperText(profileName: String) -> String {
        if pendingSentImpressMeSignal != nil {
            return "You already sent \(profileName) an Impress Me challenge. Waiting for their reply in Sent."
        }

        return "They'll get a personalised prompt to reply to. You decide if it's a match."
    }

    @ViewBuilder
    private func receivedImpressMeCard(profile: UserProfile) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            profileSectionHeader(
                title: "Impress Me Challenge",
                subtitle: "\(profile.username) sent a challenge tied to this profile. Explore first, then reply."
            )

            if isLoadingReceivedImpressMe, receivedImpressMeSignal == nil {
                ProgressView("Loading challenge...")
                    .frame(maxWidth: .infinity, alignment: .leading)
            } else if let signal = receivedImpressMeSignal {
                VStack(alignment: .leading, spacing: 12) {
                    Label(signal.prompt.category, systemImage: "sparkles")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BrandStyle.accent)

                    Text(signal.prompt.promptText)
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)
                        .lineSpacing(3)

                    if let context = signal.prompt.senderContext {
                        Text(context)
                            .font(.caption)
                            .foregroundStyle(BrandStyle.textSecondary)
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(BrandStyle.accent.opacity(0.06))
                            )
                    }

                    receivedImpressMeStatusContent(signal: signal)
                }
            } else {
                Text("This challenge isn't available right now.")
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .triadCard()
    }

    @ViewBuilder
    private func receivedImpressMeStatusContent(signal: ImpressMeSignal) -> some View {
        switch signal.status {
        case .sent:
            Button {
                activeRespondSignal = signal
            } label: {
                Label("Reply to Challenge", systemImage: "arrow.up.right.circle.fill")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(
                        LinearGradient(colors: [BrandStyle.accent, BrandStyle.secondary],
                                       startPoint: .leading, endPoint: .trailing),
                        in: RoundedRectangle(cornerRadius: 22, style: .continuous)
                    )
                    .foregroundStyle(.white)
            }
            .buttonStyle(.plain)
        case .responded, .viewed:
            if let response = signal.response {
                VStack(alignment: .leading, spacing: 8) {
                    Label("Your answer", systemImage: "quote.opening")
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(BrandStyle.secondary)
                    Text(response.textContent)
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textPrimary)
                    Text("Your reply is waiting for their decision.")
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(BrandStyle.secondary.opacity(0.08))
                )
            }
        case .accepted:
            statusBanner(
                icon: "checkmark.seal.fill",
                title: "Accepted",
                message: "They accepted your answer. Your new match is ready.",
                tint: .green
            )
        case .declined:
            statusBanner(
                icon: "xmark.circle.fill",
                title: "Passed",
                message: "They passed on this one after reading your answer.",
                tint: BrandStyle.textSecondary
            )
        case .expired:
            statusBanner(
                icon: "clock.badge.xmark.fill",
                title: "Expired",
                message: "This challenge expired before a reply was sent.",
                tint: .orange
            )
        }
    }

    private func statusBanner(icon: String, title: String, message: String, tint: Color) -> some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(tint)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.textPrimary)
                Text(message)
                    .font(.caption)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(tint.opacity(0.08))
        )
    }

    @ViewBuilder
    private func datingPreferencesCard(profile: UserProfile) -> some View {
        let allRows: [(String, String, String)] = prefRows(for: profile)
        let rows = allRows.filter { !$0.2.isEmpty }

        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                profileSectionHeader(
                    title: "Dating Preferences",
                    subtitle: "How \(profile.username) describes their lifestyle."
                )
                VStack(spacing: 12) {
                    ForEach(rows, id: \.1) { icon, title, value in
                        ProfileInfoRow(icon: icon, title: title, value: value)
                    }
                }
            }
            .triadCard()
        }
    }

    private func prefRows(for profile: UserProfile) -> [(String, String, String)] {
        [
            ("person.fill.questionmark", "Interested in",      profile.interestedIn ?? ""),
            ("mappin.circle",            "Neighborhood",        profile.neighborhood ?? ""),
            ("figure.stand",             "Height",              profile.height ?? ""),
            ("scalemass.fill",           "Weight",              profile.weight ?? ""),
            ("figure.arms.open",         "Physique",            profile.physique ?? ""),
            ("globe.americas.fill",      "Ethnicity",           profile.ethnicity ?? ""),
            ("graduationcap.fill",       "Education",           profile.educationLevel ?? ""),
            ("hands.sparkles.fill",      "Religion",            profile.religion ?? ""),
            ("heart.circle.fill",        "Relationship",        profile.relationshipType ?? ""),
            ("figure.and.child.holdinghands", "Children",       profile.children ?? ""),
            ("calendar.badge.plus",      "Family Plans",        profile.familyPlans ?? ""),
            ("heart.circle",             "Comfort w/ Intimacy", profile.comfortWithIntimacy ?? ""),
            ("wineglass.fill",           "Drinking",            profile.drinking ?? ""),
            ("smoke.fill",               "Smoking",             profile.smoking ?? ""),
            ("leaf.fill",                "Marijuana",           profile.marijuana ?? ""),
            ("pills.fill",               "Drugs",               profile.drugs ?? ""),
            ("checkmark.seal.fill",      "Politics",            profile.politics ?? ""),
            ("heart.text.square.fill",   "Sexual Preference",   profile.sexualPreference ?? "")
        ]
    }

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
