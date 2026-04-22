import SwiftUI

struct ProfileView: View {
    @EnvironmentObject private var session: SessionStore

    var body: some View {
        ScreenContainer(title: "Profile") {
            if let user = session.currentUser {
                VStack(alignment: .leading, spacing: 14) {
                    HStack(alignment: .top) {
                        VStack(alignment: .leading, spacing: 6) {
                            Text(user.username)
                                .font(.title2.weight(.bold))
                                .foregroundStyle(BrandStyle.textPrimary)

                            Text("\(user.city), \(user.state)")
                                .font(.subheadline)
                                .foregroundStyle(BrandStyle.textSecondary)
                        }

                        Spacer()

                        SectionBadge(
                            text: user.isCouple ? "Couple profile" : "Single profile",
                            color: user.isCouple ? BrandStyle.secondary : BrandStyle.accent
                        )
                    }

                    if !user.photos.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(user.photos) { photo in
                                    RemoteMediaView(path: photo.url, height: 160)
                                        .frame(width: 180)
                                }
                            }
                        }
                    }

                    Text(user.bio.isEmpty ? "No bio yet." : user.bio)
                        .font(.subheadline)
                        .foregroundStyle(BrandStyle.textPrimary)

                    HStack(spacing: 8) {
                        SectionBadge(text: "\(user.ageMin)-\(user.ageMax)", color: BrandStyle.accent)
                        SectionBadge(text: user.intent.capitalized, color: BrandStyle.secondary)
                        SectionBadge(text: user.lookingFor.capitalized, color: .blue)
                    }

                    if !user.interests.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 8) {
                                ForEach(user.interests, id: \.self) { interest in
                                    SectionBadge(text: interest, color: BrandStyle.textSecondary)
                                }
                            }
                        }
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("Profile Details")
                            .font(.headline)
                            .foregroundStyle(BrandStyle.textPrimary)

                        Text("Radius: \(user.radiusMiles ?? 25) miles")
                            .foregroundStyle(BrandStyle.textSecondary)
                        Text("Zip: \(user.zipCode.isEmpty ? "Not set" : user.zipCode)")
                            .foregroundStyle(BrandStyle.textSecondary)

                        if let coupleId = user.coupleId {
                            Text("Couple ID: \(coupleId.uuidString)")
                                .font(.footnote)
                                .foregroundStyle(BrandStyle.textSecondary)
                                .textSelection(.enabled)
                        }
                    }
                }
                .triadCard()

                VStack(alignment: .leading, spacing: 12) {
                    Button("Refresh Profile") {
                        Task {
                            await session.refreshProfile()
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(BrandStyle.accent)

                    Button("Sign Out", role: .destructive) {
                        session.signOut()
                    }
                    .buttonStyle(.bordered)
                }
                .triadCard()
            } else {
                EmptyStateCard(
                    title: "No profile loaded",
                    message: "Sign in again or refresh your session."
                )
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

