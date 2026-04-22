import Foundation
import Security

enum KeychainStoreError: LocalizedError {
    case saveFailed(OSStatus)

    var errorDescription: String? {
        switch self {
        case let .saveFailed(status):
            return "Unable to save your session to Keychain (\(status))."
        }
    }
}

final class KeychainTokenStore {
    private let service = "com.thirdwheel.iosnative.auth"
    private let account = "session-token"
    private let simulatorDefaultsKey = "com.thirdwheel.iosnative.auth.session-token"

    func loadToken() -> String? {
        #if targetEnvironment(simulator)
        return UserDefaults.standard.string(forKey: simulatorDefaultsKey)
        #else
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status != errSecItemNotFound else {
            return nil
        }

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            return nil
        }

        return token
        #endif
    }

    func saveToken(_ token: String) throws {
        #if targetEnvironment(simulator)
        // Unsigned simulator builds do not reliably persist Keychain items.
        UserDefaults.standard.set(token, forKey: simulatorDefaultsKey)
        return
        #else
        deleteToken()

        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecValueData as String: data
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainStoreError.saveFailed(status)
        }
        #endif
    }

    func deleteToken() {
        UserDefaults.standard.removeObject(forKey: simulatorDefaultsKey)

        #if !targetEnvironment(simulator)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account
        ]

        SecItemDelete(query as CFDictionary)
        #endif
    }
}
