import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var session: SessionStore
    @State private var isShowingEditSheet = false
    @State private var isShowingDeleteConfirmation = false
    @State private var isDeletingAccount = false

    private let metricColumns = [
        GridItem(.flexible(), spacing: 12),
        GridItem(.flexible(), spacing: 12)
    ]

    private let interestColumns = [
        GridItem(.adaptive(minimum: 96), spacing: 8)
    ]

    var body: some View {
        ScreenContainer(title: "Profile") {
            if let user = session.currentUser {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 16) {
                        RemoteMediaView(path: user.photos.first?.url, height: 240)

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

                            SectionBadge(
                                text: user.isCouple ? "Couple" : "Single",
                                color: user.isCouple ? BrandStyle.secondary : BrandStyle.accent
                            )
                        }

                        Text(user.bio.isEmpty ? "No bio yet. Add a short intro so your profile feels more like you." : user.bio)
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.textPrimary)
                            .lineSpacing(3)

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
                            LazyVGrid(columns: interestColumns, alignment: .leading, spacing: 8) {
                                ForEach(user.interests, id: \.self) { interest in
                                    SectionBadge(text: interest, color: BrandStyle.textSecondary)
                                }
                            }
                        }
                    }
                    .triadCard()

                    VStack(alignment: .leading, spacing: 12) {
                        ProfileActionRow(
                            title: "Edit Profile",
                            subtitle: "Update your bio, preferences, and location.",
                            icon: "slider.horizontal.3",
                            tint: BrandStyle.accent
                        ) {
                            isShowingEditSheet = true
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
                .sheet(isPresented: $isShowingEditSheet) {
                    NavigationStack {
                        ProfileEditView(user: user)
                            .environmentObject(session)
                    }
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

    @State private var bio: String
    @State private var ageMin: Int
    @State private var ageMax: Int
    @State private var intent: String
    @State private var lookingFor: String
    @State private var interestsText: String
    @State private var city: String
    @State private var state: String
    @State private var zipCode: String
    @State private var radiusMiles: Int
    @State private var isSaving = false

    private let intentOptions = ["casual", "serious", "friendship", "exploring"]
    private let lookingForOptions = ["single", "couple"]

    init(user: UserProfile) {
        self.user = user
        _bio = State(initialValue: user.bio)
        _ageMin = State(initialValue: max(user.ageMin, 18))
        _ageMax = State(initialValue: max(user.ageMax, max(user.ageMin, 18)))
        _intent = State(initialValue: user.intent.lowercased())
        _lookingFor = State(initialValue: user.lookingFor.lowercased())
        _interestsText = State(initialValue: user.interests.joined(separator: ", "))
        _city = State(initialValue: user.city)
        _state = State(initialValue: user.state)
        _zipCode = State(initialValue: user.zipCode)
        _radiusMiles = State(initialValue: min(max(user.radiusMiles ?? 25, 5), 100))
    }

    var body: some View {
        Form {
            Section("About") {
                TextField("Username", text: .constant(user.username))
                    .disabled(true)

                TextField("Bio", text: $bio, axis: .vertical)
                    .lineLimit(3 ... 6)
            }

            Section("Preferences") {
                Stepper("Minimum age: \(ageMin)", value: $ageMin, in: 18 ... 80)
                    .onChange(of: ageMin) { newValue in
                        if ageMax < newValue {
                            ageMax = newValue
                        }
                    }

                Stepper("Maximum age: \(ageMax)", value: $ageMax, in: ageMin ... 90)

                Picker("Intent", selection: $intent) {
                    ForEach(intentOptions, id: \.self) { option in
                        Text(option.capitalized).tag(option)
                    }
                }

                Picker("Looking For", selection: $lookingFor) {
                    ForEach(lookingForOptions, id: \.self) { option in
                        Text(option.capitalized).tag(option)
                    }
                }

                Stepper("Radius: \(radiusMiles) miles", value: $radiusMiles, in: 5 ... 100, step: 5)
            }

            Section("Location") {
                TextField("City", text: $city)
                TextField("State", text: $state)
                TextField("Zip Code", text: $zipCode)
                    .keyboardType(.numbersAndPunctuation)
            }

            Section("Interests") {
                TextField("Comma-separated interests", text: $interestsText, axis: .vertical)
                    .lineLimit(2 ... 4)
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .cancellationAction) {
                Button("Cancel") {
                    dismiss()
                }
            }

            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task {
                        await save()
                    }
                }
                .disabled(isSaving)
            }
        }
    }

    private func save() async {
        guard !isSaving else { return }
        isSaving = true
        defer { isSaving = false }

        let interests = interestsText
            .split(separator: ",")
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        let request = UpdateProfileRequest(
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
            radiusMiles: radiusMiles
        )

        do {
            _ = try await session.updateProfile(request)
            dismiss()
        } catch {
            session.presentError(error)
        }
    }
}
