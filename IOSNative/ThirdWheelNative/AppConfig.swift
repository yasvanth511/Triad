import Foundation

struct AppConfig {
    static let placeholderDeviceBaseURL = "http://device-host:5127"
    static let shared = AppConfig()

    let originBaseURL: URL
    let apiBaseURL: URL

    init(bundle: Bundle = .main) {
        let configuredOrigin = (bundle.object(forInfoDictionaryKey: "APIBaseURL") as? String)?
            .trimmingCharacters(in: .whitespacesAndNewlines)

        #if targetEnvironment(simulator)
        let originString: String
        if let configuredOrigin, !configuredOrigin.isEmpty, configuredOrigin != Self.placeholderDeviceBaseURL {
            originString = configuredOrigin
        } else {
            originString = "http://localhost:5127"
        }
        #else
        let originString = (configuredOrigin?.isEmpty == false ? configuredOrigin! : "http://192.168.1.50:5127")
        #endif

        let normalizedOrigin = originString.hasSuffix("/") ? String(originString.dropLast()) : originString
        guard let originURL = URL(string: normalizedOrigin) else {
            fatalError("Invalid API origin URL: \(normalizedOrigin)")
        }

        originBaseURL = originURL
        if normalizedOrigin.hasSuffix("/api") {
            apiBaseURL = originURL
        } else {
            apiBaseURL = originURL.appendingPathComponent("api")
        }
    }

    func mediaURL(for path: String?) -> URL? {
        guard let path, !path.isEmpty else {
            return nil
        }

        if let absolute = URL(string: path), absolute.scheme != nil {
            return absolute
        }

        return URL(string: path, relativeTo: originBaseURL)
    }
}
