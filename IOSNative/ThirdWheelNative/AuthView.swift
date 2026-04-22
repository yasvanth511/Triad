import SwiftUI

struct AuthView: View {
    enum Mode: String, CaseIterable, Identifiable {
        case login = "Sign In"
        case register = "Create Account"

        var id: String { rawValue }
    }

    @EnvironmentObject private var session: SessionStore

    @State private var mode: Mode = .login
    @State private var username = ""
    @State private var email = ""
    @State private var password = ""

    private var canSubmit: Bool {
        let baseValid = !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
            !password.isEmpty

        switch mode {
        case .login:
            return baseValid
        case .register:
            return baseValid && !username.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                ScreenBackdrop()

                ScrollView(showsIndicators: false) {
                    VStack(spacing: 18) {
                        VStack(spacing: 0) {
                            Text("Triad")
                                .font(.system(size: 66, weight: .black, design: .serif))
                                .kerning(-1.6)
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [
                                            Color(red: 0.18, green: 0.11, blue: 0.29),
                                            Color(red: 0.34, green: 0.16, blue: 0.46)
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    )
                                )
                                .shadow(color: .white.opacity(0.55), radius: 18, x: 0, y: 6)
                                .shadow(color: BrandStyle.secondary.opacity(0.16), radius: 26, x: 0, y: 12)
                        }
                        .frame(maxWidth: .infinity, alignment: .center)
                        .padding(.top, 18)
                        .padding(.bottom, 6)

                        VStack(alignment: .leading, spacing: 16) {
                            Picker("Mode", selection: $mode) {
                                ForEach(Mode.allCases) { mode in
                                    Text(mode.rawValue).tag(mode)
                                }
                            }
                            .pickerStyle(.segmented)

                            if mode == .register {
                                VStack(alignment: .leading, spacing: 6) {
                                    Text("Username")
                                        .font(.caption.weight(.semibold))
                                        .foregroundStyle(BrandStyle.textSecondary)

                                    TextField("pick-an-alias", text: $username)
                                        .textInputAutocapitalization(.never)
                                        .autocorrectionDisabled()
                                        .padding(14)
                                        .background(.white.opacity(0.82))
                                        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                                }
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Email")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(BrandStyle.textSecondary)

                                TextField("you@example.com", text: $email)
                                    .keyboardType(.emailAddress)
                                    .textInputAutocapitalization(.never)
                                    .autocorrectionDisabled()
                                    .padding(14)
                                    .background(.white.opacity(0.82))
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }

                            VStack(alignment: .leading, spacing: 6) {
                                Text("Password")
                                    .font(.caption.weight(.semibold))
                                    .foregroundStyle(BrandStyle.textSecondary)

                                SecureField("At least 8 characters", text: $password)
                                    .padding(14)
                                    .background(.white.opacity(0.82))
                                    .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
                            }

                            Button {
                                Task {
                                    switch mode {
                                    case .login:
                                        await session.login(
                                            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                                            password: password
                                        )
                                    case .register:
                                        await session.register(
                                            username: username.trimmingCharacters(in: .whitespacesAndNewlines),
                                            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                                            password: password
                                        )
                                    }
                                }
                            } label: {
                                HStack {
                                    if session.isAuthenticating {
                                        ProgressView()
                                            .tint(.white)
                                    }

                                    Text(mode == .login ? "Sign In" : "Create Account")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 16)
                                .foregroundStyle(.white)
                                .background(
                                    LinearGradient(
                                        colors: [BrandStyle.accent, BrandStyle.secondary],
                                        startPoint: .leading,
                                        endPoint: .trailing
                                    )
                                )
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }
                            .disabled(!canSubmit || session.isAuthenticating)
                            .opacity((!canSubmit || session.isAuthenticating) ? 0.7 : 1)
                        }
                        .triadCard()
                    }
                    .padding(.horizontal, 20)
                    .padding(.vertical, 24)
                }
            }
            .navigationBarHidden(true)
        }
    }
}
