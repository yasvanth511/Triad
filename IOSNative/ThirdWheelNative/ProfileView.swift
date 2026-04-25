import SwiftUI
import AVFoundation
import AVKit
import PhotosUI

struct ProfileView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var isEditingProfile = false
    @State private var isShowingDeleteConfirmation = false
    @State private var isDeletingAccount = false
    @State private var verificationMethods: [VerificationMethod] = []
    @State private var isLoadingVerifications = false
    @State private var startingVerificationKey: String?
    @State private var activeVerificationFlow: ActiveVerificationFlow?

    private let metricColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    private var profileVerificationMethods: [VerificationMethod] {
        verificationMethods
            .filter { $0.supportsProfileEntryPoint && ($0.isEnabled || $0.isVerified) }
            .sorted { $0.displayName < $1.displayName }
    }

    private var verifiedProfileMethods: [VerificationMethod] {
        profileVerificationMethods.filter(\.isVerified)
    }

    var body: some View {
        ScreenContainer(title: "Profile") {
            if let user = session.currentUser {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 16) {
                        PhotoCarouselView(photos: user.orderedPhotos, height: 280)

                        HStack(alignment: .top, spacing: 12) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(user.username)
                                    .font(.system(size: 30, weight: .bold, design: .rounded))
                                    .foregroundStyle(BrandStyle.textPrimary)

                                Label(displayLocation(for: user), systemImage: "mappin.and.ellipse")
                                    .font(.subheadline)
                                    .foregroundStyle(BrandStyle.textSecondary)
                            }

                            Spacer()

                            VStack(alignment: .trailing, spacing: 8) {
                                SectionBadge(
                                    text: user.isCouple ? "Couple" : "Single",
                                    color: user.isCouple ? BrandStyle.secondary : BrandStyle.accent
                                )

                                ForEach(verifiedProfileMethods) { method in
                                    SectionBadge(
                                        text: method.displayName,
                                        color: verificationTint(for: method),
                                        icon: "checkmark.seal.fill"
                                    )
                                }
                            }
                        }

                        Text(user.bio.isEmpty ? "No bio yet. Add a short intro so your profile feels more like you." : user.bio)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.textPrimary)
                            .lineSpacing(3)

                        if let audioBioUrl = user.audioBioUrl {
                            AudioBioPlayerCard(url: audioBioUrl)
                        }

                        if !user.orderedVideos.isEmpty {
                            VStack(alignment: .leading, spacing: 10) {
                                profileSectionHeader(
                                    title: "Highlights",
                                    subtitle: "Your profile videos show up as story-style highlights."
                                )

                                VideoHighlightsView(
                                    videos: user.orderedVideos,
                                    fallbackImagePath: user.orderedPhotos.first?.url,
                                    titlePrefix: "Highlight"
                                )
                            }
                        }

                        LazyVGrid(columns: metricColumns, spacing: 12) {
                            ProfileMetricTile(
                                title: "Age Range",
                                value: "\(user.ageMin)-\(user.ageMax)",
                                color: BrandStyle.accent
                            )
                            ProfileMetricTile(
                                title: "Intent",
                                value: user.intent.capitalized,
                                color: BrandStyle.secondary
                            )
                            ProfileMetricTile(
                                title: "Looking For",
                                value: user.lookingFor.capitalized,
                                color: .blue
                            )
                            ProfileMetricTile(
                                title: "Radius",
                                value: "\(user.radiusMiles ?? 25) mi",
                                color: BrandStyle.textSecondary
                            )
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 14) {
                        profileSectionHeader(
                            title: "Profile Details",
                            subtitle: "The details other people will notice first."
                        )

                        VStack(spacing: 12) {
                            ProfileDetailRow(
                                icon: "mappin.circle.fill",
                                title: "Location",
                                value: displayLocation(for: user)
                            )
                            ProfileDetailRow(
                                icon: "mail.stack.fill",
                                title: "Zip Code",
                                value: user.zipCode.isEmpty ? "Not set" : user.zipCode
                            )

                            if user.isCouple {
                                ProfileDetailRow(
                                    icon: "person.2.fill",
                                    title: "Coupled With",
                                    value: user.couplePartnerName ?? "Waiting for partner"
                                )
                            }
                        }
                    }
                    .triadCard()

                    if !profileVerificationMethods.isEmpty {
                        VStack(alignment: .leading, spacing: 14) {
                            profileSectionHeader(
                                title: "Verifications",
                                subtitle: "Add trust signals to your profile."
                            )

                            VStack(spacing: 12) {
                                ForEach(profileVerificationMethods) { method in
                                    ProfileVerificationRow(
                                        method: method,
                                        tint: verificationTint(for: method),
                                        isLoading: startingVerificationKey == method.key,
                                        action: method.canStart ? { startVerification(method) } : nil
                                    )
                                }
                            }
                        }
                        .triadCard()
                    }

                    VStack(alignment: .leading, spacing: 14) {
                        profileSectionHeader(
                            title: "Interests",
                            subtitle: user.interests.isEmpty
                                ? "Add a few interests to make your profile feel complete."
                                : "A quick read on your energy and preferences."
                        )

                        if user.interests.isEmpty {
                            Text("No interests added yet.")
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        } else {
                            InterestBadgeList(interests: user.interests)
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 14) {
                        profileSectionHeader(
                            title: "Red Flags",
                            subtitle: (user.redFlags ?? []).isEmpty
                                ? "Add deal-breakers so we can warn you when a profile matches."
                                : "These will be flagged when viewing other profiles."
                        )

                        if (user.redFlags ?? []).isEmpty {
                            Text("No red flags set yet.")
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        } else {
                            FlowLayout(spacing: 8) {
                                ForEach(user.redFlags ?? [], id: \.self) { flag in
                                    SectionBadge(text: flag, color: .red, icon: "flag.fill")
                                }
                            }
                        }
                    }
                    .triadCard()

                    datingPreferencesCard(user: user)

                    VStack(alignment: .leading, spacing: 12) {
                        ProfileActionRow(
                            title: "Edit Profile",
                            subtitle: "Update your bio, preferences, and location.",
                            icon: "slider.horizontal.3",
                            tint: BrandStyle.accent
                        ) {
                            isEditingProfile = true
                        }

                        ProfileActionRow(
                            title: "Sign Out",
                            subtitle: "Leave the app and clear the current session.",
                            icon: "rectangle.portrait.and.arrow.right",
                            tint: BrandStyle.textSecondary
                        ) {
                            session.signOut()
                        }

                        ProfileActionRow(
                            title: "Delete Account",
                            subtitle: "Permanently remove your profile and matches.",
                            icon: "trash.fill",
                            tint: .red,
                            isDestructive: true,
                            isDisabled: isDeletingAccount
                        ) {
                            isShowingDeleteConfirmation = true
                        }
                    }
                    .triadCard()
                }
                .navigationDestination(isPresented: $isEditingProfile) {
                    ProfileEditView(user: user)
                        .environmentObject(session)
                }
                .alert("Delete your account?", isPresented: $isShowingDeleteConfirmation) {
                    Button("Cancel", role: .cancel) {}
                    Button("Delete", role: .destructive) {
                        Task {
                            await deleteAccount()
                        }
                    }
                } message: {
                    Text("This permanently removes your account and signs you out.")
                }
            } else {
                EmptyStateCard(
                    title: "No profile loaded",
                    message: "Sign in again or refresh your session."
                )
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadVerifications()
        }
        .sheet(item: $activeVerificationFlow) { flow in
            ProfileVerificationVendorSheet(flow: flow) { decision, providerReference in
                Task {
                    await completeVerification(flow, decision: decision, providerReference: providerReference)
                }
            }
        }
    }

    private func deleteAccount() async {
        guard !isDeletingAccount else { return }
        isDeletingAccount = true
        defer { isDeletingAccount = false }

        do {
            try await session.deleteAccount()
        } catch {
            session.presentError(error)
        }
    }

    private func displayLocation(for user: UserProfile) -> String {
        let parts = [user.city, user.state].filter { !$0.isEmpty }
        return parts.isEmpty ? "Location not set" : parts.joined(separator: ", ")
    }

    private func loadVerifications() async {
        guard !isLoadingVerifications else { return }
        isLoadingVerifications = true
        defer { isLoadingVerifications = false }

        do {
            verificationMethods = try await session.loadVerifications()
        } catch {
            session.presentError(error)
        }
    }

    private func startVerification(_ method: VerificationMethod) {
        guard startingVerificationKey == nil else { return }
        startingVerificationKey = method.key

        Task {
            defer { startingVerificationKey = nil }

            do {
                let attempt = try await session.startVerificationAttempt(methodKey: method.key)

                guard let clientToken = attempt.clientToken else {
                    throw APIClientError.invalidResponse
                }

                activeVerificationFlow = ActiveVerificationFlow(
                    method: method,
                    attemptId: attempt.attemptId,
                    clientToken: clientToken
                )
            } catch {
                session.presentError(error)
            }
        }
    }

    private func completeVerification(
        _ flow: ActiveVerificationFlow,
        decision: String,
        providerReference: String
    ) async {
        do {
            _ = try await session.completeVerificationAttempt(
                methodKey: flow.method.key,
                attemptId: flow.attemptId,
                decision: decision,
                providerReference: providerReference
            )
            activeVerificationFlow = nil
            await loadVerifications()
        } catch {
            session.presentError(error)
        }
    }

    private func verificationTint(for method: VerificationMethod) -> Color {
        switch method.methodKey {
        case .ageVerified:
            return .blue
        case .liveVerified:
            return .green
        case nil:
            return BrandStyle.accent
        }
    }

    @ViewBuilder
    private func datingPreferencesCard(user: UserProfile) -> some View {
        let allRows = prefRows(for: user)
        let rows = allRows.filter { !$0.2.isEmpty }

        if !rows.isEmpty {
            VStack(alignment: .leading, spacing: 14) {
                profileSectionHeader(
                    title: "Dating Preferences",
                    subtitle: "Your lifestyle and what you're looking for."
                )
                VStack(spacing: 12) {
                    ForEach(rows, id: \.1) { icon, title, value in
                        ProfileDetailRow(icon: icon, title: title, value: value)
                    }
                }
            }
            .triadCard()
        }
    }

    private func prefRows(for user: UserProfile) -> [(String, String, String)] {
        [
            ("person.fill.questionmark", "Interested in",      user.interestedIn ?? ""),
            ("mappin.circle",            "Neighborhood",        user.neighborhood ?? ""),
            ("figure.stand",             "Height",              user.height ?? ""),
            ("scalemass.fill",           "Weight",              user.weight ?? ""),
            ("figure.arms.open",         "Physique",            user.physique ?? ""),
            ("globe.americas.fill",      "Ethnicity",           user.ethnicity ?? ""),
            ("graduationcap.fill",       "Education",           user.educationLevel ?? ""),
            ("hands.sparkles.fill",      "Religion",            user.religion ?? ""),
            ("heart.circle.fill",        "Relationship",        user.relationshipType ?? ""),
            ("figure.and.child.holdinghands", "Children",       user.children ?? ""),
            ("calendar.badge.plus",      "Family Plans",        user.familyPlans ?? ""),
            ("heart.circle",             "Comfort w/ Intimacy", user.comfortWithIntimacy ?? ""),
            ("wineglass.fill",           "Drinking",            user.drinking ?? ""),
            ("smoke.fill",               "Smoking",             user.smoking ?? ""),
            ("leaf.fill",                "Marijuana",           user.marijuana ?? ""),
            ("pills.fill",               "Drugs",               user.drugs ?? ""),
            ("checkmark.seal.fill",      "Politics",            user.politics ?? ""),
            ("heart.text.square.fill",   "Sexual Preference",   user.sexualPreference ?? "")
        ]
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

private struct ActiveVerificationFlow: Identifiable {
    let method: VerificationMethod
    let attemptId: UUID
    let clientToken: String

    var id: UUID { attemptId }

    var providerReferencePrefix: String {
        switch method.methodKey {
        case .ageVerified:
            return "age_session"
        case .liveVerified:
            return "live_session"
        case nil:
            return "verification_session"
        }
    }
}

private struct ProfileVerificationRow: View {
    let method: VerificationMethod
    let tint: Color
    let isLoading: Bool
    let action: (() -> Void)?

    var body: some View {
        HStack(spacing: 14) {
            Image(systemName: method.isVerified ? "checkmark.shield.fill" : "person.badge.shield.checkmark.fill")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(tint)
                .frame(width: 42, height: 42)
                .background(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .fill(tint.opacity(0.12))
                )

            VStack(alignment: .leading, spacing: 4) {
                Text(method.displayName)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.textPrimary)

                if let action {
                    Text(method.failureReason ?? "Complete verification to add this badge to your profile.")
                        .font(.footnote)
                        .foregroundStyle(BrandStyle.textSecondary)
                } else {
                    Text(method.failureReason ?? method.ineligibilityReason ?? method.displayStatus)
                        .font(.footnote)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            }

            Spacer(minLength: 12)

            if let action {
                Button(action: action) {
                    if isLoading {
                        ProgressView()
                            .controlSize(.small)
                    } else {
                        Text("Get \(method.displayName)")
                            .font(.caption.weight(.semibold))
                    }
                }
                .buttonStyle(.borderedProminent)
                .tint(tint)
                .disabled(isLoading)
            } else {
                SectionBadge(
                    text: method.isVerified ? method.displayName : method.displayStatus,
                    color: method.isVerified ? tint : BrandStyle.textSecondary,
                    icon: method.isVerified ? "checkmark.seal.fill" : nil
                )
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Color.white.opacity(0.48))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .stroke(Color.white.opacity(0.42), lineWidth: 1)
        )
    }
}

private struct ProfileVerificationVendorSheet: View {
    @Environment(\.dismiss) private var dismiss

    let flow: ActiveVerificationFlow
    let onComplete: (String, String) -> Void

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                VStack(alignment: .leading, spacing: 8) {
                    Text(flow.method.displayName)
                        .font(.title3.weight(.bold))
                        .foregroundStyle(BrandStyle.textPrimary)

                    Text("Vendor session started with client token:")
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textSecondary)

                    Text(flow.clientToken)
                        .font(.footnote.monospaced())
                        .foregroundStyle(BrandStyle.textPrimary)
                        .textSelection(.enabled)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            RoundedRectangle(cornerRadius: 16, style: .continuous)
                                .fill(Color.white.opacity(0.72))
                        )
                }

                VStack(spacing: 12) {
                    verificationActionButton(title: "Approve", tint: .green, decision: "approved")
                    verificationActionButton(title: "Send To Review", tint: BrandStyle.accent, decision: "in_review")
                    verificationActionButton(title: "Fail", tint: .red, decision: "failed")
                }

                Spacer()
            }
            .padding(20)
            .background(ScreenBackdrop().ignoresSafeArea())
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Close") {
                        dismiss()
                    }
                }
            }
        }
    }

    @ViewBuilder
    private func verificationActionButton(title: String, tint: Color, decision: String) -> some View {
        Button {
            onComplete(
                decision,
                "\(flow.providerReferencePrefix)_\(flow.attemptId.uuidString.lowercased().prefix(8))"
            )
        } label: {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 14)
        }
        .buttonStyle(.borderedProminent)
        .tint(tint)
    }
}

private struct ProfileMetricTile: View {
    let title: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased())
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)

            Text(value)
                .font(.headline.weight(.semibold))
                .foregroundStyle(BrandStyle.textPrimary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(color.opacity(0.09))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(color.opacity(0.14), lineWidth: 1)
        )
    }
}

private struct ProfileDetailRow: View {
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

private struct ProfileActionRow: View {
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
                Image(systemName: icon)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(tint)
                    .frame(width: 42, height: 42)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(tint.opacity(isDestructive ? 0.14 : 0.12))
                    )

                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(isDestructive ? Color.red : BrandStyle.textPrimary)

                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(BrandStyle.textSecondary)
                        .multilineTextAlignment(.leading)
                }

                Spacer()

                Image(systemName: isDestructive ? "exclamationmark.circle" : "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(isDestructive ? Color.red.opacity(0.9) : BrandStyle.textSecondary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Color.white.opacity(0.48))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .stroke(Color.white.opacity(0.42), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .disabled(isDisabled)
        .opacity(isDisabled ? 0.55 : 1)
    }
}

private struct ProfileEditView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var session: SessionStore

    let user: UserProfile

    // Editable fields
    @State private var bio: String
    @State private var ageMin: Int
    @State private var ageMax: Int
    @State private var intent: String
    @State private var lookingFor: String
    @State private var interestsText: String
    @State private var redFlagsText: String
    @State private var city: String
    @State private var state: String
    @State private var zipCode: String
    @State private var radiusMiles: Int
    @State private var isSaving = false

    // Dating preferences
    @State private var interestedIn: String
    @State private var neighborhood: String
    @State private var ethnicity: String
    @State private var religion: String
    @State private var relationshipType: String
    @State private var height: String
    @State private var children: String
    @State private var familyPlans: String
    @State private var drugs: String
    @State private var smoking: String
    @State private var marijuana: String
    @State private var drinking: String
    @State private var politics: String
    @State private var educationLevel: String
    @State private var weight: String
    @State private var physique: String
    @State private var sexualPreference: String
    @State private var comfortWithIntimacy: String

    // Photo management
    @State private var selectedPhotoItem: PhotosPickerItem?
    @State private var isUploadingPhoto = false
    @State private var photoToDelete: Photo?
    @State private var isConfirmingDeletePhoto = false

    // Highlights / video management
    @State private var selectedVideoItem: PhotosPickerItem?
    @State private var isUploadingVideo = false
    @State private var videoToDelete: ProfileVideo?
    @State private var isConfirmingDeleteVideo = false

    // Audio bio
    @State private var isPickingAudio = false
    @State private var isDeletingAudio = false
    @State private var audioBioError: String?

    private let photoColumns = Array(repeating: GridItem(.flexible(), spacing: 6), count: 3)
    private let intentOptions = ["casual", "serious", "friendship", "exploring"]
    private let lookingForOptions = ["single", "couple"]
    private let interestedInOptions = ["Men", "Women", "Everyone", "Non-binary", "All genders", "Prefer not to say"]
    private let ethnicityOptions = ["Asian", "Black / African", "East Asian", "Hispanic / Latino", "Middle Eastern", "Mixed", "Native American", "Pacific Islander", "South Asian", "Southeast Asian", "White / Caucasian", "Other", "Prefer not to say"]
    private let religionOptions = ["Agnostic", "Atheist", "Buddhist", "Catholic", "Christian", "Hindu", "Jewish", "Muslim", "Sikh", "Spiritual", "Other", "Prefer not to say"]
    private let relationshipTypeOptions = ["Monogamous", "Ethical non-monogamy", "Open relationship", "Polyamory", "Not sure yet", "Prefer not to say"]
    private let childrenOptions = ["Don't have children", "Have children", "Have & want more", "Don't want children", "Prefer not to say"]
    private let familyPlansOptions = ["Want children", "Don't want children", "Open to it", "Not sure", "Prefer not to say"]
    private let substanceOptions = ["Never", "Rarely", "Sometimes", "Often", "Prefer not to say"]
    private let drinkingOptions = ["Never", "Sober", "Sober curious", "Socially", "Most nights", "Prefer not to say"]
    private let politicsOptions = ["Apolitical", "Liberal", "Moderate", "Conservative", "Progressive", "Other", "Prefer not to say"]
    private let educationOptions = ["High school", "Some college", "Associate's", "Bachelor's", "Master's", "PhD", "Trade / Vocational", "Other", "Prefer not to say"]
    private let physiqueOptions = ["Slim", "Athletic", "Average", "Muscular", "Curvy", "Full-figured", "A few extra pounds", "Prefer not to say"]
    private let sexualPreferenceOptions = ["Straight", "Gay", "Lesbian", "Bisexual", "Pansexual", "Queer", "Voyager", "Open to new", "Prefer not to say"]
    private let comfortWithIntimacyOptions = ["New to this", "A little experience", "Comfortable", "Very comfortable", "Prefer not to say"]

    init(user: UserProfile) {
        self.user = user
        _bio = State(initialValue: user.bio)
        _ageMin = State(initialValue: max(user.ageMin, 18))
        _ageMax = State(initialValue: max(user.ageMax, max(user.ageMin, 18)))
        _intent = State(initialValue: user.intent.lowercased())
        _lookingFor = State(initialValue: user.lookingFor.lowercased())
        _interestsText = State(initialValue: user.interests.joined(separator: ", "))
        _redFlagsText = State(initialValue: (user.redFlags ?? []).joined(separator: ", "))
        _city = State(initialValue: user.city)
        _state = State(initialValue: user.state)
        _zipCode = State(initialValue: user.zipCode)
        _radiusMiles = State(initialValue: min(max(user.radiusMiles ?? 25, 5), 100))
        _interestedIn = State(initialValue: user.interestedIn ?? "")
        _neighborhood = State(initialValue: user.neighborhood ?? "")
        _ethnicity = State(initialValue: user.ethnicity ?? "")
        _religion = State(initialValue: user.religion ?? "")
        _relationshipType = State(initialValue: user.relationshipType ?? "")
        _height = State(initialValue: user.height ?? "")
        _children = State(initialValue: user.children ?? "")
        _familyPlans = State(initialValue: user.familyPlans ?? "")
        _drugs = State(initialValue: user.drugs ?? "")
        _smoking = State(initialValue: user.smoking ?? "")
        _marijuana = State(initialValue: user.marijuana ?? "")
        _drinking = State(initialValue: user.drinking ?? "")
        _politics = State(initialValue: user.politics ?? "")
        _educationLevel = State(initialValue: user.educationLevel ?? "")
        _weight = State(initialValue: user.weight ?? "")
        _physique = State(initialValue: user.physique ?? "")
        _sexualPreference = State(initialValue: user.sexualPreference ?? "")
        _comfortWithIntimacy = State(initialValue: user.comfortWithIntimacy ?? "")
    }

    var body: some View {
        ScreenContainer(title: "Edit Profile") {
            VStack(spacing: 18) {
                photosCard
                highlightsCard
                bioCard
                CoupleLinkCard()
                preferencesCard
                locationCard
                basicsCard
                identityCard
                relationshipCard
                lifestyleCard
                interestsCard
                redFlagsCard
                audioBioCard

                Button {
                    Task { await save() }
                } label: {
                    Group {
                        if isSaving {
                            ProgressView().tint(.white)
                        } else {
                            Text("Save Changes").font(.headline)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(BrandStyle.accent)
                    .foregroundStyle(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                }
                .buttonStyle(.plain)
                .disabled(isSaving)
                .padding(.bottom, 8)
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onChange(of: selectedPhotoItem) { item in
            guard let item else { return }
            selectedPhotoItem = nil
            Task { await uploadPhoto(item) }
        }
        .onChange(of: selectedVideoItem) { item in
            guard let item else { return }
            selectedVideoItem = nil
            Task { await uploadVideo(item) }
        }
        .alert("Remove this photo?", isPresented: $isConfirmingDeletePhoto) {
            Button("Cancel", role: .cancel) {}
            Button("Remove", role: .destructive) {
                Task { if let p = photoToDelete { await deletePhoto(p) } }
            }
        }
        .alert("Remove this highlight?", isPresented: $isConfirmingDeleteVideo) {
            Button("Cancel", role: .cancel) {}
            Button("Remove", role: .destructive) {
                Task { if let v = videoToDelete { await deleteVideo(v) } }
            }
        }
        .fileImporter(
            isPresented: $isPickingAudio,
            allowedContentTypes: [.audio, .mp3, .mpeg4Audio],
            allowsMultipleSelection: false
        ) { result in
            Task { await handleAudioPick(result) }
        }
    }

    // MARK: – Photos Card (Instagram-style grid)

    @ViewBuilder
    private var photosCard: some View {
        let photos = session.currentUser?.orderedPhotos ?? []
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Photos")
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)
                    Text(photos.isEmpty
                         ? "Add up to 6 photos."
                         : "\(photos.count) / 6 — tap × to remove.")
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
                Spacer()
                if isUploadingPhoto { ProgressView().scaleEffect(0.85) }
            }

            LazyVGrid(columns: photoColumns, spacing: 6) {
                ForEach(photos) { photo in
                    photoThumbnail(photo)
                }
                if photos.count < 6 {
                    PhotosPicker(selection: $selectedPhotoItem, matching: .images) {
                        addPhotoCell
                    }
                    .disabled(isUploadingPhoto)
                }
            }
        }
        .triadCard()
    }

    @ViewBuilder
    private func photoThumbnail(_ photo: Photo) -> some View {
        ZStack(alignment: .topTrailing) {
            RemoteMediaView(path: photo.url, height: 108)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            Button {
                photoToDelete = photo
                isConfirmingDeletePhoto = true
            } label: {
                ZStack {
                    Circle()
                        .fill(Color.black.opacity(0.55))
                        .frame(width: 26, height: 26)
                    Image(systemName: "xmark")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white)
                }
            }
            .buttonStyle(.plain)
            .padding(6)
        }
        .frame(height: 108)
    }

    private var addPhotoCell: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(BrandStyle.accent.opacity(0.06))
                .frame(height: 108)
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(
                    BrandStyle.accent.opacity(0.28),
                    style: StrokeStyle(lineWidth: 1.5, dash: [5, 4])
                )
                .frame(height: 108)
            VStack(spacing: 6) {
                Image(systemName: "plus")
                    .font(.system(size: 22, weight: .semibold))
                    .foregroundStyle(BrandStyle.accent)
                Text("Add")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(BrandStyle.accent)
            }
        }
    }

    // MARK: – Highlights Card (Instagram Stories-style bubbles)

    @ViewBuilder
    private var highlightsCard: some View {
        let videos = session.currentUser?.orderedVideos ?? []
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Highlights")
                        .font(.headline)
                        .foregroundStyle(BrandStyle.textPrimary)
                    Text("Short clips shown on your profile.")
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
                Spacer()
                if isUploadingVideo { ProgressView().scaleEffect(0.85) }
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 16) {
                    PhotosPicker(selection: $selectedVideoItem, matching: .videos) {
                        addHighlightBubble
                    }
                    .disabled(isUploadingVideo)

                    ForEach(videos) { video in
                        highlightBubble(video)
                    }
                }
                .padding(.vertical, 4)
            }
        }
        .triadCard()
    }

    private var addHighlightBubble: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .strokeBorder(
                        LinearGradient(
                            colors: [BrandStyle.accent, BrandStyle.secondary],
                            startPoint: .topLeading, endPoint: .bottomTrailing
                        ),
                        lineWidth: 2.5
                    )
                    .frame(width: 76, height: 76)
                Circle()
                    .fill(BrandStyle.accent.opacity(0.07))
                    .frame(width: 70, height: 70)
                Image(systemName: "plus")
                    .font(.system(size: 26, weight: .semibold))
                    .foregroundStyle(BrandStyle.accent)
            }
            Text("Add Clip")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)
        }
    }

    @ViewBuilder
    private func highlightBubble(_ video: ProfileVideo) -> some View {
        VStack(spacing: 8) {
            ZStack(alignment: .topTrailing) {
                ZStack {
                    Circle()
                        .strokeBorder(
                            LinearGradient(
                                colors: [BrandStyle.secondary, BrandStyle.accent],
                                startPoint: .topLeading, endPoint: .bottomTrailing
                            ),
                            lineWidth: 2.5
                        )
                        .frame(width: 76, height: 76)
                    Circle()
                        .fill(BrandStyle.secondary.opacity(0.12))
                        .frame(width: 70, height: 70)
                    Image(systemName: "play.fill")
                        .font(.system(size: 22))
                        .foregroundStyle(BrandStyle.secondary)
                }

                Button {
                    videoToDelete = video
                    isConfirmingDeleteVideo = true
                } label: {
                    ZStack {
                        Circle()
                            .fill(Color.black.opacity(0.55))
                            .frame(width: 22, height: 22)
                        Image(systemName: "xmark")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
                .buttonStyle(.plain)
                .offset(x: 2, y: -2)
            }
            Text("Clip")
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textSecondary)
        }
    }

    // MARK: – Bio Card

    private var bioCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "About", subtitle: "How you introduce yourself.")

            editRow(label: "Username") {
                Text(user.username)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textSecondary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("Bio")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
                TextField("Write a short intro…", text: $bio, axis: .vertical)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textPrimary)
                    .lineLimit(3...6)
            }
        }
        .triadCard()
    }

    // MARK: – Preferences Card

    private var preferencesCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Preferences", subtitle: "Who you're looking to meet.")

            editRow(label: "Min Age \(ageMin)") {
                Stepper("", value: $ageMin, in: 18...80)
                    .onChange(of: ageMin) { v in if ageMax < v { ageMax = v } }
                    .labelsHidden()
                    .tint(BrandStyle.accent)
            }
            Divider()
            editRow(label: "Max Age \(ageMax)") {
                Stepper("", value: $ageMax, in: ageMin...90)
                    .labelsHidden()
                    .tint(BrandStyle.accent)
            }
            Divider()
            editRow(label: "Intent") {
                Menu {
                    ForEach(intentOptions, id: \.self) { opt in
                        Button(opt.capitalized) { intent = opt }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(intent.capitalized)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.accent)
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(BrandStyle.accent)
                    }
                }
            }
            Divider()
            editRow(label: "Looking For") {
                Menu {
                    ForEach(lookingForOptions, id: \.self) { opt in
                        Button(opt.capitalized) { lookingFor = opt }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Text(lookingFor.capitalized)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.accent)
                        Image(systemName: "chevron.up.chevron.down")
                            .font(.caption2.weight(.semibold))
                            .foregroundStyle(BrandStyle.accent)
                    }
                }
            }
            Divider()
            editRow(label: "Radius \(radiusMiles) mi") {
                Stepper("", value: $radiusMiles, in: 5...100, step: 5)
                    .labelsHidden()
                    .tint(BrandStyle.accent)
            }
        }
        .triadCard()
    }

    // MARK: – Location Card

    private var locationCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Location", subtitle: "Where you're based.")

            VStack(alignment: .leading, spacing: 6) {
                Text("City").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("City", text: $city).font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("State").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("State", text: $state).font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("Zip Code").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("Zip Code", text: $zipCode)
                    .font(.subheadline)
                    .foregroundStyle(BrandStyle.textPrimary)
                    .keyboardType(.numbersAndPunctuation)
            }
        }
        .triadCard()
    }

    // MARK: – Basics Card

    private var basicsCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Basics", subtitle: "Who you're interested in and where you live.")

            editRow(label: "Interested in") {
                prefMenu(value: $interestedIn, options: interestedInOptions, placeholder: "Select")
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("Neighborhood").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("e.g. Brooklyn, Midtown…", text: $neighborhood)
                    .font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            }
        }
        .triadCard()
    }

    // MARK: – Identity Card

    private var identityCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Identity", subtitle: "How you describe yourself.")

            VStack(alignment: .leading, spacing: 6) {
                Text("Height").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("e.g. 5'10\"", text: $height)
                    .font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            }
            Divider()
            VStack(alignment: .leading, spacing: 6) {
                Text("Weight").font(.caption.weight(.semibold)).foregroundStyle(BrandStyle.textSecondary)
                TextField("e.g. 160 lbs", text: $weight)
                    .font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            }
            Divider()
            editRow(label: "Physique") {
                prefMenu(value: $physique, options: physiqueOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Ethnicity") {
                prefMenu(value: $ethnicity, options: ethnicityOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Education") {
                prefMenu(value: $educationLevel, options: educationOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Religion") {
                prefMenu(value: $religion, options: religionOptions, placeholder: "Select")
            }
        }
        .triadCard()
    }

    // MARK: – Relationship Card

    private var relationshipCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Relationship", subtitle: "Your relationship style and family plans.")

            editRow(label: "Relationship type") {
                prefMenu(value: $relationshipType, options: relationshipTypeOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Children") {
                prefMenu(value: $children, options: childrenOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Family plans") {
                prefMenu(value: $familyPlans, options: familyPlansOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Comfort with intimacy") {
                prefMenu(value: $comfortWithIntimacy, options: comfortWithIntimacyOptions, placeholder: "Select")
            }
        }
        .triadCard()
    }

    // MARK: – Lifestyle Card

    private var lifestyleCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Lifestyle", subtitle: "Your habits and values.")

            editRow(label: "Drinking") {
                prefMenu(value: $drinking, options: drinkingOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Smoking") {
                prefMenu(value: $smoking, options: substanceOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Marijuana") {
                prefMenu(value: $marijuana, options: substanceOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Drugs") {
                prefMenu(value: $drugs, options: substanceOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Politics") {
                prefMenu(value: $politics, options: politicsOptions, placeholder: "Select")
            }
            Divider()
            editRow(label: "Sexual preference") {
                prefMenu(value: $sexualPreference, options: sexualPreferenceOptions, placeholder: "Select")
            }
        }
        .triadCard()
    }

    // MARK: – Interests Card

    private var interestsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            editSectionHeader(title: "Interests", subtitle: "Comma-separated — e.g. hiking, coffee, art")
            TextField("hiking, coffee, art…", text: $interestsText, axis: .vertical)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textPrimary)
                .lineLimit(2...5)
        }
        .triadCard()
    }

    // MARK: – Red Flags Card

    private var redFlagsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            editSectionHeader(title: "Red Flags", subtitle: "Deal-breakers flagged on other profiles.")
            TextField("smoking, heavy drinking…", text: $redFlagsText, axis: .vertical)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textPrimary)
                .lineLimit(2...5)
        }
        .triadCard()
    }

    // MARK: – Audio Bio Card

    @ViewBuilder
    private var audioBioCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            editSectionHeader(title: "Audio Bio", subtitle: "A short voice clip to introduce yourself.")

            if let url = session.currentUser?.audioBioUrl {
                AudioBioPlayerCard(url: url)

                Button(role: .destructive) {
                    Task { await deleteAudioBio() }
                } label: {
                    Label(
                        isDeletingAudio ? "Removing…" : "Remove Audio Bio",
                        systemImage: "trash"
                    )
                    .font(.subheadline)
                }
                .disabled(isDeletingAudio)
            } else {
                Button { isPickingAudio = true } label: {
                    HStack(spacing: 10) {
                        Image(systemName: "waveform.badge.plus")
                            .font(.system(size: 18))
                            .foregroundStyle(BrandStyle.accent)
                        Text("Upload Audio Bio")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(BrandStyle.accent)
                        Spacer()
                    }
                }
                .buttonStyle(.plain)
            }

            if let err = audioBioError {
                Text(err).font(.caption).foregroundStyle(.red)
            }
        }
        .triadCard()
    }

    // MARK: – Layout helpers

    @ViewBuilder
    private func editSectionHeader(title: String, subtitle: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title).font(.headline).foregroundStyle(BrandStyle.textPrimary)
            Text(subtitle).font(.caption).foregroundStyle(BrandStyle.textSecondary)
        }
    }

    @ViewBuilder
    private func editRow<V: View>(label: String, @ViewBuilder content: () -> V) -> some View {
        HStack {
            Text(label).font(.subheadline).foregroundStyle(BrandStyle.textPrimary)
            Spacer()
            content()
        }
    }

    @ViewBuilder
    private func prefMenu(value: Binding<String>, options: [String], placeholder: String) -> some View {
        Menu {
            Button(placeholder) { value.wrappedValue = "" }
            ForEach(options, id: \.self) { opt in
                Button(opt) { value.wrappedValue = opt }
            }
        } label: {
            HStack(spacing: 4) {
                Text(value.wrappedValue.isEmpty ? placeholder : value.wrappedValue)
                    .font(.subheadline)
                    .foregroundStyle(value.wrappedValue.isEmpty ? BrandStyle.textSecondary : BrandStyle.accent)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(BrandStyle.accent)
            }
        }
    }

    // MARK: – Actions

    private func save() async {
        guard !isSaving else { return }
        isSaving = true
        defer { isSaving = false }

        let interests = interestsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }
        let redFlags = redFlagsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        let req = UpdateProfileRequest(
            bio: bio.trimmingCharacters(in: .whitespacesAndNewlines),
            ageMin: ageMin,
            ageMax: max(ageMin, ageMax),
            intent: intent,
            lookingFor: lookingFor,
            interests: interests,
            latitude: nil,
            longitude: nil,
            city: city.trimmingCharacters(in: .whitespacesAndNewlines),
            state: state.trimmingCharacters(in: .whitespacesAndNewlines),
            zipCode: zipCode.trimmingCharacters(in: .whitespacesAndNewlines),
            radiusMiles: radiusMiles,
            redFlags: redFlags,
            interestedIn: interestedIn,
            neighborhood: neighborhood.trimmingCharacters(in: .whitespacesAndNewlines),
            ethnicity: ethnicity.trimmingCharacters(in: .whitespacesAndNewlines),
            religion: religion,
            relationshipType: relationshipType,
            height: height.trimmingCharacters(in: .whitespacesAndNewlines),
            children: children,
            familyPlans: familyPlans,
            drugs: drugs,
            smoking: smoking,
            marijuana: marijuana,
            drinking: drinking,
            politics: politics,
            educationLevel: educationLevel,
            weight: weight.trimmingCharacters(in: .whitespacesAndNewlines),
            physique: physique,
            sexualPreference: sexualPreference,
            comfortWithIntimacy: comfortWithIntimacy
        )
        do {
            _ = try await session.updateProfile(req)
            dismiss()
        } catch {
            session.presentError(error)
        }
    }

    private func uploadPhoto(_ item: PhotosPickerItem) async {
        isUploadingPhoto = true
        defer { isUploadingPhoto = false }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            let mime = item.supportedContentTypes.first?.preferredMIMEType ?? "image/jpeg"
            let ext  = item.supportedContentTypes.first?.preferredFilenameExtension ?? "jpg"
            try await session.uploadProfilePhoto(data: data, mimeType: mime, fileName: "photo.\(ext)")
        } catch {
            session.presentError(error)
        }
    }

    private func deletePhoto(_ photo: Photo) async {
        do { try await session.deleteProfilePhoto(photoId: photo.id) }
        catch { session.presentError(error) }
    }

    private func uploadVideo(_ item: PhotosPickerItem) async {
        isUploadingVideo = true
        defer { isUploadingVideo = false }
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { return }
            let mime = item.supportedContentTypes.first?.preferredMIMEType ?? "video/mp4"
            let ext  = item.supportedContentTypes.first?.preferredFilenameExtension ?? "mp4"
            try await session.uploadProfileVideo(data: data, mimeType: mime, fileName: "highlight.\(ext)")
        } catch {
            session.presentError(error)
        }
    }

    private func deleteVideo(_ video: ProfileVideo) async {
        do { try await session.deleteProfileVideo(videoId: video.id) }
        catch { session.presentError(error) }
    }

    private func handleAudioPick(_ result: Result<[URL], Error>) async {
        audioBioError = nil
        switch result {
        case .failure(let e):
            audioBioError = e.localizedDescription
        case .success(let urls):
            guard let url = urls.first else { return }
            let accessed = url.startAccessingSecurityScopedResource()
            defer { if accessed { url.stopAccessingSecurityScopedResource() } }
            do {
                let data = try Data(contentsOf: url)
                let mime = mimeForAudio(url)
                try await session.uploadAudioBio(data: data, mimeType: mime, fileName: url.lastPathComponent)
            } catch {
                audioBioError = error.localizedDescription
            }
        }
    }

    private func deleteAudioBio() async {
        guard !isDeletingAudio else { return }
        isDeletingAudio = true
        defer { isDeletingAudio = false }
        audioBioError = nil
        do { try await session.deleteAudioBio() }
        catch { audioBioError = error.localizedDescription }
    }

    private func mimeForAudio(_ url: URL) -> String {
        switch url.pathExtension.lowercased() {
        case "mp3": return "audio/mpeg"
        case "m4a": return "audio/m4a"
        case "aac": return "audio/aac"
        case "wav": return "audio/wav"
        default:    return "audio/mpeg"
        }
    }
}

// MARK: – Audio Bio Player Card

private struct AudioBioPlayerCard: View {
    let url: String

    @StateObject private var player = AudioBioPlayer()

    var body: some View {
        HStack(spacing: 14) {
            Button {
                player.togglePlayback(urlString: url)
            } label: {
                Image(systemName: player.isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.system(size: 38))
                    .foregroundStyle(BrandStyle.accent)
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 4) {
                Text("Audio Bio")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(BrandStyle.textPrimary)

                if let duration = player.formattedDuration {
                    Text(player.isPlaying ? "Playing \(player.formattedPosition ?? "0:00") / \(duration)" : duration)
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                        .monospacedDigit()
                } else {
                    Text(player.isPlaying ? "Playing…" : "Tap to listen")
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                }
            }

            Spacer()

            Group {
                if #available(iOS 17.0, *) {
                    Image(systemName: "waveform")
                        .symbolEffect(.variableColor.iterative, isActive: player.isPlaying)
                } else {
                    Image(systemName: "waveform")
                }
            }
            .font(.system(size: 18))
            .foregroundStyle(player.isPlaying ? BrandStyle.accent : BrandStyle.textSecondary)
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(BrandStyle.accent.opacity(0.07))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(BrandStyle.accent.opacity(0.15), lineWidth: 1)
        )
        .onDisappear { player.stop() }
    }
}

@MainActor
private final class AudioBioPlayer: NSObject, ObservableObject, AVAudioPlayerDelegate {
    @Published var isPlaying = false
    @Published var formattedDuration: String?
    @Published var formattedPosition: String?

    private var audioPlayer: AVAudioPlayer?
    private var timer: Timer?
    private var currentURLString: String?

    func togglePlayback(urlString: String) {
        if isPlaying && currentURLString == urlString {
            stop()
            return
        }

        guard let url = resolvedURL(urlString) else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
            audioPlayer = try AVAudioPlayer(contentsOf: url)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
            formattedDuration = format(seconds: audioPlayer?.duration ?? 0)
            audioPlayer?.play()
            currentURLString = urlString
            isPlaying = true
            startTimer()
        } catch {
            isPlaying = false
        }
    }

    func stop() {
        audioPlayer?.stop()
        audioPlayer = nil
        isPlaying = false
        formattedPosition = nil
        stopTimer()
    }

    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in self.stop() }
    }

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                guard let self, let p = self.audioPlayer else { return }
                self.formattedPosition = self.format(seconds: p.currentTime)
            }
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    private func resolvedURL(_ urlString: String) -> URL? {
        if urlString.hasPrefix("http://") || urlString.hasPrefix("https://") {
            return URL(string: urlString)
        }
        // Relative path: prepend API base URL
        let base = AppConfig.shared.apiBaseURL.absoluteString
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: base + urlString)
    }

    private func format(seconds: TimeInterval) -> String {
        let s = Int(seconds)
        return String(format: "%d:%02d", s / 60, s % 60)
    }
}

// MARK: – Video Bio Player Card

private struct VideoBioPlayerCard: View {
    let url: String

    @State private var isShowingPlayer = false

    private var resolvedURL: URL? {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            return URL(string: url)
        }
        let base = AppConfig.shared.apiBaseURL.absoluteString
            .trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        return URL(string: base + url)
    }

    var body: some View {
        Button {
            isShowingPlayer = true
        } label: {
            HStack(spacing: 14) {
                ZStack {
                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                        .fill(BrandStyle.secondary.opacity(0.12))
                        .frame(width: 52, height: 52)

                    Image(systemName: "play.rectangle.fill")
                        .font(.system(size: 24))
                        .foregroundStyle(BrandStyle.secondary)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Video Bio")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(BrandStyle.textPrimary)

                    Text("Tap to watch")
                        .font(.caption)
                        .foregroundStyle(BrandStyle.textSecondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .fill(BrandStyle.secondary.opacity(0.07))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 18, style: .continuous)
                    .stroke(BrandStyle.secondary.opacity(0.15), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
        .fullScreenCover(isPresented: $isShowingPlayer) {
            if let videoURL = resolvedURL {
                VideoPlayerSheet(url: videoURL)
            }
        }
    }
}
