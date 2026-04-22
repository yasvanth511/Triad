import SwiftUI

enum BrandStyle {
    static let accent = Color(red: 0.49, green: 0.23, blue: 0.93)
    static let secondary = Color(red: 0.86, green: 0.15, blue: 0.47)
    static let textPrimary = Color(red: 0.12, green: 0.07, blue: 0.20)
    static let textSecondary = Color(red: 0.43, green: 0.36, blue: 0.54)
    static let cardFill = Color.white.opacity(0.76)
    static let cardBorder = Color.white.opacity(0.55)

    static let background = LinearGradient(
        colors: [
            Color(red: 0.98, green: 0.96, blue: 1.0),
            Color(red: 0.99, green: 0.95, blue: 0.97),
            Color(red: 0.95, green: 0.97, blue: 1.0)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}

struct TriadCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(18)
            .background(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .fill(BrandStyle.cardFill)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 26, style: .continuous)
                    .stroke(BrandStyle.cardBorder, lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.08), radius: 22, x: 0, y: 12)
    }
}

extension View {
    func triadCard() -> some View {
        modifier(TriadCardModifier())
    }
}

struct ScreenBackdrop: View {
    var body: some View {
        ZStack {
            BrandStyle.background.ignoresSafeArea()

            Circle()
                .fill(BrandStyle.accent.opacity(0.14))
                .frame(width: 240, height: 240)
                .blur(radius: 24)
                .offset(x: -120, y: -240)

            Circle()
                .fill(BrandStyle.secondary.opacity(0.14))
                .frame(width: 280, height: 280)
                .blur(radius: 28)
                .offset(x: 150, y: -180)

            Circle()
                .fill(Color.blue.opacity(0.10))
                .frame(width: 220, height: 220)
                .blur(radius: 30)
                .offset(x: 110, y: 260)
        }
    }
}

