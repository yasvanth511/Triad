import CoreLocation
import Foundation

@MainActor
final class LocationPermissionManager: NSObject, ObservableObject, @preconcurrency CLLocationManagerDelegate {
    @Published private(set) var status: CLAuthorizationStatus

    private let manager = CLLocationManager()

    override init() {
        status = .notDetermined
        super.init()
        manager.delegate = self
        refreshStatus()
    }

    func requestPermission() {
        manager.requestWhenInUseAuthorization()
    }

    func refreshStatus() {
        status = manager.authorizationStatus
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        status = manager.authorizationStatus
    }

    var isAuthorized: Bool {
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            return true
        case .notDetermined, .restricted, .denied:
            return false
        @unknown default:
            return false
        }
    }

    var statusDescription: String {
        switch status {
        case .notDetermined:
            return "Not requested"
        case .restricted:
            return "Restricted"
        case .denied:
            return "Denied"
        case .authorizedAlways:
            return "Always allowed"
        case .authorizedWhenInUse:
            return "Allowed while using the app"
        @unknown default:
            return "Unknown"
        }
    }
}
