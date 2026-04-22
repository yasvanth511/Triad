import SwiftUI

struct ScreenContainer<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            ScreenBackdrop()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(title)
                            .font(.system(size: 34, weight: .bold, design: .rounded))
                            .foregroundStyle(BrandStyle.textPrimary)

                        Text("Native iOS surface for the Third Wheel backend.")
                            .font(.subheadline)
                            .foregroundStyle(BrandStyle.textSecondary)
                    }

                    content
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 18)
            }
        }
    }
}

struct EmptyStateCard: View {
    let title: String
    let message: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title)
                .font(.headline)
                .foregroundStyle(BrandStyle.textPrimary)

            Text(message)
                .font(.subheadline)
                .foregroundStyle(BrandStyle.textSecondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .triadCard()
    }
}

struct SectionBadge: View {
    let text: String
    let color: Color

    var body: some View {
        Text(text)
            .font(.caption.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(color.opacity(0.12))
            .clipShape(Capsule())
    }
}

struct RemoteMediaView: View {
    let path: String?
    let height: CGFloat

    private var url: URL? {
        AppConfig.shared.mediaURL(for: path)
    }

    var body: some View {
        AsyncImage(url: url, transaction: Transaction(animation: .easeInOut(duration: 0.25))) { phase in
            switch phase {
            case let .success(image):
                image
                    .resizable()
                    .scaledToFill()
            case .empty:
                placeholder(symbol: "photo.stack")
            case .failure:
                placeholder(symbol: "person.crop.square")
            @unknown default:
                placeholder(symbol: "sparkles.square.filled.on.square")
            }
        }
        .frame(maxWidth: .infinity)
        .frame(height: height)
        .clipped()
        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
    }

    private func placeholder(symbol: String) -> some View {
        ZStack {
            LinearGradient(
                colors: [
                    BrandStyle.accent.opacity(0.22),
                    BrandStyle.secondary.opacity(0.18)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            Image(systemName: symbol)
                .font(.system(size: 30, weight: .medium))
                .foregroundStyle(BrandStyle.textSecondary)
        }
    }
}

