import SwiftUI
import UIKit
import AVFoundation
import AVKit

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
    var icon: String? = nil

    var body: some View {
        HStack(spacing: 4) {
            if let icon {
                Image(systemName: icon)
                    .font(.caption.weight(.semibold))
            }
            Text(text)
                .font(.caption.weight(.semibold))
        }
        .foregroundStyle(color)
        .padding(.horizontal, 10)
        .padding(.vertical, 6)
        .background(color.opacity(0.12))
        .clipShape(Capsule())
    }
}

// MARK: – Interest colors & flow layout

private let interestPalette: [Color] = [
    Color(red: 0.38, green: 0.55, blue: 1.00),   // indigo-blue
    Color(red: 0.22, green: 0.75, blue: 0.62),   // teal
    Color(red: 0.95, green: 0.45, blue: 0.40),   // coral
    Color(red: 0.55, green: 0.40, blue: 0.90),   // violet
    Color(red: 0.20, green: 0.78, blue: 0.44),   // mint green
    Color(red: 1.00, green: 0.58, blue: 0.22),   // amber
    Color(red: 0.90, green: 0.35, blue: 0.65),   // rose
    Color(red: 0.30, green: 0.68, blue: 0.90),   // sky blue
]

func interestColor(for tag: String) -> Color {
    let index = abs(tag.lowercased().unicodeScalars.reduce(0) { $0 &+ Int($1.value) }) % interestPalette.count
    return interestPalette[index]
}

struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var height: CGFloat = 0
        var rowX: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowX + size.width > width, rowX > 0 {
                height += rowHeight + spacing
                rowX = 0
                rowHeight = 0
            }
            rowX += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
        height += rowHeight
        return CGSize(width: width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var rowX = bounds.minX
        var rowY = bounds.minY
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if rowX + size.width > bounds.maxX, rowX > bounds.minX {
                rowY += rowHeight + spacing
                rowX = bounds.minX
                rowHeight = 0
            }
            subview.place(at: CGPoint(x: rowX, y: rowY), proposal: .unspecified)
            rowX += size.width + spacing
            rowHeight = max(rowHeight, size.height)
        }
    }
}

struct InterestBadgeList: View {
    let interests: [String]
    var flaggedSet: Set<String> = []
    var spacing: CGFloat = 8

    var body: some View {
        FlowLayout(spacing: spacing) {
            ForEach(interests, id: \.self) { interest in
                let isFlagged = flaggedSet.contains(interest.lowercased())
                SectionBadge(
                    text: interest,
                    color: isFlagged ? .red : interestColor(for: interest),
                    icon: isFlagged ? "flag.fill" : nil
                )
            }
        }
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
        resolvedMediaURL(for: path)
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

func resolvedMediaURL(for path: String?) -> URL? {
    AppConfig.shared.mediaURL(for: path)
}

struct PhotoCarouselView: View {
    let photos: [Photo]
    let height: CGFloat
    var showsPageCount = true

    @State private var selectedIndex = 0

    var body: some View {
        let orderedPhotos = photos.sorted {
            if $0.sortOrder == $1.sortOrder {
                return $0.id.uuidString < $1.id.uuidString
            }
            return $0.sortOrder < $1.sortOrder
        }

        Group {
            if orderedPhotos.isEmpty {
                RemoteMediaView(path: nil, height: height)
            } else if orderedPhotos.count == 1 {
                RemoteMediaView(path: orderedPhotos.first?.url, height: height)
            } else {
                ZStack(alignment: .bottomTrailing) {
                    TabView(selection: $selectedIndex) {
                        ForEach(Array(orderedPhotos.enumerated()), id: \.element.id) { index, photo in
                            RemoteMediaView(path: photo.url, height: height)
                                .tag(index)
                        }
                    }
                    .frame(height: height)
                    .tabViewStyle(.page(indexDisplayMode: .automatic))

                    if showsPageCount {
                        Text("\(selectedIndex + 1) / \(orderedPhotos.count)")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 6)
                            .background(Color.black.opacity(0.38))
                            .clipShape(Capsule())
                            .padding(14)
                    }
                }
                .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
            }
        }
    }
}

struct VideoHighlightsView: View {
    let videos: [ProfileVideo]
    let fallbackImagePath: String?
    var titlePrefix = "Clip"

    @State private var activeVideoURL: URL?

    var body: some View {
        let orderedVideos = videos.sorted {
            if $0.sortOrder == $1.sortOrder {
                return $0.id.uuidString < $1.id.uuidString
            }
            return $0.sortOrder < $1.sortOrder
        }

        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 14) {
                ForEach(Array(orderedVideos.enumerated()), id: \.element.id) { index, video in
                    Button {
                        activeVideoURL = resolvedMediaURL(for: video.url)
                    } label: {
                        VideoHighlightBubble(
                            videoPath: video.url,
                            fallbackImagePath: fallbackImagePath,
                            title: "\(titlePrefix) \(index + 1)"
                        )
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.vertical, 2)
        }
        .fullScreenCover(
            isPresented: Binding(
                get: { activeVideoURL != nil },
                set: { if !$0 { activeVideoURL = nil } }
            )
        ) {
            if let activeVideoURL {
                VideoPlayerSheet(url: activeVideoURL)
            }
        }
    }
}

private struct VideoHighlightBubble: View {
    let videoPath: String
    let fallbackImagePath: String?
    let title: String

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [
                                BrandStyle.secondary.opacity(0.95),
                                BrandStyle.accent.opacity(0.95)
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 82, height: 82)

                Circle()
                    .fill(Color.white.opacity(0.92))
                    .frame(width: 74, height: 74)

                RemoteVideoThumbnailView(path: videoPath, fallbackImagePath: fallbackImagePath)
                    .frame(width: 68, height: 68)
                    .clipShape(Circle())

                Image(systemName: "play.fill")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 26, height: 26)
                    .background(Color.black.opacity(0.45))
                    .clipShape(Circle())
                    .offset(x: 20, y: 20)
            }

            Text(title)
                .font(.caption.weight(.semibold))
                .foregroundStyle(BrandStyle.textPrimary)
                .lineLimit(1)
        }
    }
}

private struct RemoteVideoThumbnailView: View {
    let path: String
    let fallbackImagePath: String?

    @State private var thumbnail: UIImage?
    @State private var isLoading = false

    private var videoURL: URL? {
        resolvedMediaURL(for: path)
    }

    var body: some View {
        ZStack {
            if let thumbnail {
                Image(uiImage: thumbnail)
                    .resizable()
                    .scaledToFill()
            } else if let fallbackImagePath {
                RemoteMediaView(path: fallbackImagePath, height: 68)
            } else {
                LinearGradient(
                    colors: [
                        BrandStyle.secondary.opacity(0.3),
                        BrandStyle.accent.opacity(0.2)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )

                Image(systemName: "video.fill")
                    .font(.system(size: 18, weight: .semibold))
                    .foregroundStyle(BrandStyle.textSecondary)
            }
        }
        .task(id: path) {
            await loadThumbnail()
        }
    }

    private func loadThumbnail() async {
        guard thumbnail == nil, !isLoading, let videoURL else { return }
        isLoading = true
        defer { isLoading = false }

        let asset = AVURLAsset(url: videoURL)
        let generator = AVAssetImageGenerator(asset: asset)
        generator.appliesPreferredTrackTransform = true
        generator.maximumSize = CGSize(width: 240, height: 240)

        do {
            let cgImage = try await withCheckedThrowingContinuation { continuation in
                let time = CMTime(seconds: 0.1, preferredTimescale: 600)
                generator.generateCGImagesAsynchronously(forTimes: [NSValue(time: time)]) { _, image, _, result, error in
                    switch result {
                    case .succeeded:
                        if let image {
                            continuation.resume(returning: image)
                        } else {
                            continuation.resume(throwing: ThumbnailError.imageUnavailable)
                        }
                    case .failed:
                        continuation.resume(throwing: error ?? ThumbnailError.imageUnavailable)
                    case .cancelled:
                        continuation.resume(throwing: CancellationError())
                    @unknown default:
                        continuation.resume(throwing: ThumbnailError.imageUnavailable)
                    }
                }
            }

            thumbnail = UIImage(cgImage: cgImage)
        } catch {
            // Keep the fallback surface when thumbnail generation fails.
        }
    }

    private enum ThumbnailError: Error {
        case imageUnavailable
    }
}

struct VideoPlayerSheet: View {
    let url: URL
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        ZStack(alignment: .topTrailing) {
            Color.black.ignoresSafeArea()

            VideoPlayer(player: AVPlayer(url: url))
                .ignoresSafeArea()

            Button {
                dismiss()
            } label: {
                Image(systemName: "xmark.circle.fill")
                    .font(.system(size: 30))
                    .foregroundStyle(.white.opacity(0.85))
                    .shadow(radius: 4)
            }
            .padding()
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
