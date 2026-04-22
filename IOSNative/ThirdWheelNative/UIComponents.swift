import SwiftUI
import UIKit

struct ScreenContainer<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        ZStack {
            ScreenBackdrop()

            ScrollView(showsIndicators: false) {
                VStack(alignment: .leading, spacing: 18) {
                    Text(title)
                        .font(.system(size: 34, weight: .bold, design: .rounded))
                        .foregroundStyle(BrandStyle.textPrimary)

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

    private var embeddedImage: UIImage? {
        guard let path,
              path.hasPrefix("data:"),
              let commaIndex = path.firstIndex(of: ",") else {
            return nil
        }

        let metadata = path[..<commaIndex]
        guard metadata.contains(";base64") else {
            return nil
        }

        let encoded = String(path[path.index(after: commaIndex)...])
        guard let data = Data(base64Encoded: encoded, options: .ignoreUnknownCharacters) else {
            return nil
        }

        return UIImage(data: data)
    }

    private var url: URL? {
        AppConfig.shared.mediaURL(for: path)
    }

    var body: some View {
        Group {
            if let embeddedImage {
                Image(uiImage: embeddedImage)
                    .resizable()
                    .scaledToFill()
            } else {
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

struct DiscoverActionButton: View {
    let symbol: String
    let tint: Color
    let background: Color

    var body: some View {
        Image(systemName: symbol)
            .font(.system(size: 24, weight: .semibold))
            .foregroundStyle(tint)
            .frame(width: 62, height: 62)
            .background(
                Circle()
                    .fill(background)
            )
            .overlay(
                Circle()
                    .stroke(Color.white.opacity(0.55), lineWidth: 1)
            )
            .shadow(color: Color.black.opacity(0.08), radius: 12, x: 0, y: 8)
    }
}
