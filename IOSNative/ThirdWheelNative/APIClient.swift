import Foundation

enum APIClientError: LocalizedError {
    case invalidURL
    case invalidResponse
    case requestFailed(statusCode: Int, message: String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "The app could not build a valid backend URL."
        case .invalidResponse:
            return "The backend returned an unreadable response."
        case let .requestFailed(statusCode, message):
            return "Request failed (\(statusCode)): \(message)"
        }
    }
}

final class APIClient {
    private let configuration: AppConfig
    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder.triadDecoder

    var authToken: String?

    init(configuration: AppConfig = .shared, session: URLSession = .shared) {
        self.configuration = configuration
        self.session = session
    }

    func get<T: Decodable>(_ path: String, queryItems: [URLQueryItem] = []) async throws -> T {
        let request = try makeRequest(path: path, method: "GET", queryItems: queryItems)
        return try await perform(request)
    }

    func post<T: Decodable, Body: Encodable>(_ path: String, body: Body) async throws -> T {
        let request = try makeRequest(path: path, method: "POST", body: body)
        return try await perform(request)
    }

    func put<T: Decodable, Body: Encodable>(_ path: String, body: Body) async throws -> T {
        let request = try makeRequest(path: path, method: "PUT", body: body)
        return try await perform(request)
    }

    func delete(_ path: String) async throws {
        let request = try makeRequest(path: path, method: "DELETE")
        _ = try await perform(request) as EmptyResponse
    }

    /// Upload a file using multipart/form-data.
    /// - Parameters:
    ///   - path: API path (e.g. "profile/audio-bio")
    ///   - data: Raw file bytes
    ///   - mimeType: MIME type string (e.g. "audio/mpeg")
    ///   - fileName: File name sent in the Content-Disposition header
    ///   - fieldName: Form field name expected by the server (default: "file")
    func upload<T: Decodable>(
        _ path: String,
        data: Data,
        mimeType: String,
        fileName: String,
        fieldName: String = "file"
    ) async throws -> T {
        let boundary = "Boundary-\(UUID().uuidString)"
        var body = Data()

        let normalizedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let base = configuration.apiBaseURL.absoluteString.hasSuffix("/")
            ? configuration.apiBaseURL.absoluteString
            : configuration.apiBaseURL.absoluteString + "/"
        guard let url = URL(string: base + normalizedPath) else { throw APIClientError.invalidURL }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }

        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(data)
        body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body
        return try await perform(request)
    }

    private func makeRequest(path: String, method: String, queryItems: [URLQueryItem] = []) throws -> URLRequest {
        let normalizedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let base = configuration.apiBaseURL.absoluteString.hasSuffix("/")
            ? configuration.apiBaseURL.absoluteString
            : configuration.apiBaseURL.absoluteString + "/"

        guard var components = URLComponents(string: base + normalizedPath) else {
            throw APIClientError.invalidURL
        }

        components.queryItems = queryItems.isEmpty ? nil : queryItems
        guard let url = components.url else {
            throw APIClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        if let authToken {
            request.setValue("Bearer \(authToken)", forHTTPHeaderField: "Authorization")
        }
        return request
    }

    private func makeRequest<Body: Encodable>(path: String, method: String, body: Body) throws -> URLRequest {
        var request = try makeRequest(path: path, method: method)
        request.httpBody = try encoder.encode(body)
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return request
    }

    private func perform<T: Decodable>(_ request: URLRequest) async throws -> T {
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIClientError.invalidResponse
        }

        guard (200 ... 299).contains(httpResponse.statusCode) else {
            let responseError = try? decoder.decode(APIErrorResponse.self, from: data)
            let message = responseError?.error ?? responseError?.message ?? HTTPURLResponse.localizedString(forStatusCode: httpResponse.statusCode)
            throw APIClientError.requestFailed(statusCode: httpResponse.statusCode, message: message)
        }

        if data.isEmpty {
            if T.self == EmptyResponse.self {
                return EmptyResponse() as! T
            }
            throw APIClientError.invalidResponse
        }

        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            if T.self == EmptyResponse.self {
                return EmptyResponse() as! T
            }
            throw error
        }
    }
}
