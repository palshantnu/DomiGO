import CoreLocation
import Foundation
import React
import BackgroundTasks
import UserNotifications

@objc(LocationTracker)
class LocationTracker: RCTEventEmitter, CLLocationManagerDelegate {

    private var locationManager: CLLocationManager!
    private var isTracking = false
    private var config: [String: Any] = [:]
    private var lastState: String = ""
    private var lastApiTime: TimeInterval = 0
    private let FOUR_HOURS_IN_SECONDS: TimeInterval = 4 * 60 * 60  // 4 hours in seconds
    private var previousLat: Double?
    private var previousLng: Double?
    private var previousCity: String = ""
    private var previousStateName: String = ""
    private var previousEnterTime: TimeInterval = 0
    private let geocoder = CLGeocoder()
    private var isGeocoding = false
    private var backgroundProcessing = false
    private let locationQueue = DispatchQueue(label: "com.domigo.location.processing", qos: .utility)
    
    // MARK: - NEW: Deduplication Properties
    private var lastTripProcessedTime: TimeInterval = 0
    private let TRIP_COOLDOWN_SECONDS: TimeInterval = 300  // 5 minutes cooldown for trips
    private var isInitialStateLoaded = false
    private var isProcessingTrip = false
    private var pendingLocations: [CLLocation] = []
    private var isProcessingPending = false
    
    // UserDefaults for persistence
    private let defaults = UserDefaults.standard
    private let sharedDefaults = UserDefaults(suiteName: "group.com.domigo.app")
    private let LAST_STATE_KEY = "LocationTracker_lastState"
    private let LAST_API_TIME_KEY = "LocationTracker_lastApiTime"
    private let PREVIOUS_LAT_KEY = "LocationTracker_previousLat"
    private let PREVIOUS_LNG_KEY = "LocationTracker_previousLng"
    private let PREVIOUS_CITY_KEY = "LocationTracker_previousCity"
    private let PREVIOUS_STATE_KEY = "LocationTracker_previousState"
    private let PREVIOUS_ENTER_TIME_KEY = "LocationTracker_previousEnterTime"
    private let LAST_TRIP_TIME_KEY = "LocationTracker_lastTripTime"  // NEW: Store last trip time
    private let INITIAL_STATE_LOADED_KEY = "LocationTracker_initialStateLoaded"  // NEW: Track initial load
    private let BACKGROUND_LOCATION_KEY = "LatestBackgroundLocation"

    private var lastGeocodeTime: TimeInterval = 0
    private let GEOCODE_INTERVAL: TimeInterval = 45 * 60  // 45 minutes

    // Geofencing config
    private var geofencingMode: String = ""
    private var geofencingCountry: String = ""
    private var geoJsonFeatures: [[String: Any]]? = nil

    // Offline queue
    private let OFFLINE_QUEUE_KEY = "LocationTracker_offlineTripQueue"
    private let MAX_OFFLINE_RETRIES = 5
    private let LAST_TRACKED_DATE_KEY = "LocationTracker_lastTrackedDate"
override init() {
    super.init()
    print("📍 LocationTracker initialized")
    setupLocationManager()
    loadPersistedState()

    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
        self.checkForPendingBackgroundLocations()
    }

    scheduleMidnightMissingDay() // 👈 ADD THIS
}


    // private func setupNotificationObservers() {
    //     NotificationCenter.default.addObserver(
    //         self,
    //         selector: #selector(handleBackgroundLocationNotification(_:)),
    //         name: NSNotification.Name("NewBackgroundLocation"),
    //         object: nil
    //     )
        
    //     NotificationCenter.default.addObserver(
    //         self,
    //         selector: #selector(handleAppLaunchedByLocation),
    //         name: NSNotification.Name("AppLaunchedByLocation"),
    //         object: nil
    //     )
        
    //     // For backward compatibility with your existing SLC notification
    //     NotificationCenter.default.addObserver(
    //         self,
    //         selector: #selector(handleSLCNotification(_:)),
    //         name: NSNotification.Name("SLC_LOCATION"),
    //         object: nil
    //     )
    // }
    
    @objc private func handleAppLaunchedByLocation() {
        print("🔄 App was launched by location update - checking for pending locations")
        
        // Delay to let app fully initialize
        DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
            self.checkForPendingBackgroundLocations()
            
            // Start location updates if not already tracking
            if !self.isTracking {
                self.requestLocationPermission()
            }
        }
    }
    
    // @objc private func handleBackgroundLocationNotification(_ notification: Notification) {
    //     guard let locationData = notification.object as? [String: Any],
    //           let lat = locationData["latitude"] as? Double,
    //           let lng = locationData["longitude"] as? Double else {
    //         return
    //     }
        
    //     print("📍 Processing background location notification")
        
    //     // Add to pending queue instead of processing immediately
    //     let location = CLLocation(latitude: lat, longitude: lng)
    //     self.addToPendingLocations(location)
    // }
    
    // @objc private func handleSLCNotification(_ notification: Notification) {
    //     guard let userInfo = notification.userInfo,
    //           let lat = userInfo["latitude"] as? Double,
    //           let lng = userInfo["longitude"] as? Double else {
    //         return
    //     }
        
    //     print("📍 Processing SLC location notification")
        
    //     // Add to pending queue
    //     let location = CLLocation(latitude: lat, longitude: lng)
    //     self.addToPendingLocations(location)
    // }
    
    // NEW: Manage pending locations queue
    private func addToPendingLocations(_ location: CLLocation) {
        locationQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Add to pending array
            self.pendingLocations.append(location)
            
            // Keep only the last 10 locations to prevent memory issues
            if self.pendingLocations.count > 10 {
                self.pendingLocations.removeFirst()
            }
            
            // Process if not already processing
            if !self.isProcessingPending {
                self.processNextPendingLocation()
            }
        }
    }
    
    private func processNextPendingLocation() {
        locationQueue.async { [weak self] in
            guard let self = self, !self.pendingLocations.isEmpty else {
                self?.isProcessingPending = false
                return
            }
            
            self.isProcessingPending = true
            
            // Get the most recent pending location
            guard let location = self.pendingLocations.last else {
                self.isProcessingPending = false
                return
            }
            
            // Clear all pending locations (we're processing the latest)
            self.pendingLocations.removeAll()
            
            // Process the location
            self.processLocationInBackground(lat: location.coordinate.latitude, lng: location.coordinate.longitude)
            
            // Mark as done and check for more
            DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                self.isProcessingPending = false
                self.processNextPendingLocation()
            }
        }
    }


    private func isInternetAvailable() -> Bool {
    return true // or use NWPathMonitor for proper check
}
    
    private func checkForPendingBackgroundLocations() {
        // NEW: Check if initial state is already loaded to prevent duplicates
        if isInitialStateLoaded {
            print("📍 Initial state already loaded, skipping duplicate pending location check")
            return
        }
        
        locationQueue.async { [weak self] in
            guard let self = self else { return }
            
            // Check shared defaults first (for extension/app groups)
            if let sharedData = self.sharedDefaults?.dictionary(forKey: self.BACKGROUND_LOCATION_KEY) as? [String: Any] {
                print("📍 Found pending location in shared defaults")
                self.processLocationFromBackgroundData(sharedData)
                self.sharedDefaults?.removeObject(forKey: self.BACKGROUND_LOCATION_KEY)
                self.sharedDefaults?.synchronize()
            }
            
            // Check standard defaults
            if let standardData = self.defaults.dictionary(forKey: self.BACKGROUND_LOCATION_KEY) as? [String: Any] {
                print("📍 Found pending location in standard defaults")
                self.processLocationFromBackgroundData(standardData)
                self.defaults.removeObject(forKey: self.BACKGROUND_LOCATION_KEY)
                self.defaults.synchronize()
            }
            
            // Mark initial state as loaded
            self.isInitialStateLoaded = true
            self.defaults.set(true, forKey: self.INITIAL_STATE_LOADED_KEY)
            self.defaults.synchronize()
        }
    }
    
    private func processLocationFromBackgroundData(_ data: [String: Any]) {
        guard let lat = data["latitude"] as? Double,
              let lng = data["longitude"] as? Double else {
            return
        }
        
        let timestamp = data["timestamp"] as? TimeInterval ?? Date().timeIntervalSince1970 * 1000
        let accuracy = data["accuracy"] as? Double ?? 100.0
        
        print("📍 Processing pending background location: \(lat), \(lng), accuracy: \(accuracy)")
        
        // Only process if accuracy is reasonable
        if accuracy < 200 {
            // Add to pending queue instead of processing immediately
            let location = CLLocation(latitude: lat, longitude: lng)
            self.addToPendingLocations(location)
        }
    }
    
    private func processLocationInBackground(lat: Double, lng: Double) {

        let currentTime = Date().timeIntervalSince1970

        let timeDiff = currentTime - lastGeocodeTime

        if timeDiff < GEOCODE_INTERVAL {
            print("⏳ Skipping geocode call. Next allowed in \((GEOCODE_INTERVAL - timeDiff)/60) min")
            return
        }

        lastGeocodeTime = currentTime

        flushOfflineQueue()

        if geofencingMode == "local_native" {
            processWithLocalGeoJSON(lat: lat, lng: lng)
            return
        }
        if geofencingMode == "local_js" {
            print("local_js mode — skipping native geocoding")
            return
        }

        backgroundProcessing = true
        
        let location = CLLocation(latitude: lat, longitude: lng)
        let backgroundGeocoder = CLGeocoder()
        
        // Use timeout for background geocoding
        let geocodeTimeout = 8.0
        var geocodeCompleted = false
        
        // Set timeout
        DispatchQueue.main.asyncAfter(deadline: .now() + geocodeTimeout) {
            if !geocodeCompleted {
                backgroundGeocoder.cancelGeocode()
                print("⏰ Geocoding timeout for background location")
                self.backgroundProcessing = false
                
                // Still send location without address in background
                self.checkAndSendToAPI(
                    lat: lat,
                    lng: lng,
                    city: "",
                    state: "",
                    address: "",
                    isBackground: true,
                    geocodeFailed: true
                )
            }
        }
        
        backgroundGeocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            geocodeCompleted = true
            guard let self = self else { return }
            
            self.backgroundProcessing = false
            
            if let error = error {
                print("❌ Background geocoding failed: \(error.localizedDescription)")
                
                // Still send location without address in background
                self.checkAndSendToAPI(
                    lat: lat,
                    lng: lng,
                    city: "",
                    state: "",
                    address: "",
                    isBackground: true,
                    geocodeFailed: true
                )
                return
            }
            
            guard let placemark = placemarks?.first else {
                print("❌ No placemark found for background location")
                self.checkAndSendToAPI(
                    lat: lat,
                    lng: lng,
                    city: "",
                    state: "",
                    address: "",
                    isBackground: true,
                    geocodeFailed: true
                )
                return
            }
            
            let city = placemark.locality ?? placemark.subAdministrativeArea ?? ""
            let state = placemark.administrativeArea ?? ""
            let fullAddress = self.formatAddress(from: placemark)
            
            print("📍 Background location resolved: \(city), \(state)")
            
            // Load current state before checking
            self.loadPersistedState()
            
            // Check and send to API
            self.checkAndSendToAPI(
                lat: lat,
                lng: lng,
                city: city,
                state: state,
                address: fullAddress,
                isBackground: true
            )
        }
    }

    private func formatDate(_ timestamp: TimeInterval) -> String {
        let date = Date(timeIntervalSince1970: timestamp / 1000)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter.string(from: date)
    }

    private func formatDate1(_ timestamp: TimeInterval) -> String {
    let date = Date(timeIntervalSince1970: timestamp / 1000)

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    formatter.timeZone = TimeZone(secondsFromGMT: 0)

    return formatter.string(from: date)
}

    private func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 50  // 50 meters
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        
        // Enable significant location changes for kill mode
        locationManager.startMonitoringSignificantLocationChanges()
    }

    // MARK: - State Persistence

    private func saveState() {
        DispatchQueue.main.async {
            self.defaults.set(self.lastState, forKey: self.LAST_STATE_KEY)
            self.defaults.set(self.lastApiTime, forKey: self.LAST_API_TIME_KEY)
            self.defaults.set(self.previousLat ?? 0.0, forKey: self.PREVIOUS_LAT_KEY)
            self.defaults.set(self.previousLng ?? 0.0, forKey: self.PREVIOUS_LNG_KEY)
            self.defaults.set(self.previousCity, forKey: self.PREVIOUS_CITY_KEY)
            self.defaults.set(self.previousStateName, forKey: self.PREVIOUS_STATE_KEY)
            self.defaults.set(self.previousEnterTime, forKey: self.PREVIOUS_ENTER_TIME_KEY)
            self.defaults.set(self.lastTripProcessedTime, forKey: self.LAST_TRIP_TIME_KEY)
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            self.defaults.set(dateFormatter.string(from: Date()), forKey: self.LAST_TRACKED_DATE_KEY)
            self.defaults.synchronize()
            
            // Also save to shared defaults for background access
            self.sharedDefaults?.set(self.lastState, forKey: self.LAST_STATE_KEY)
            self.sharedDefaults?.set(self.lastApiTime, forKey: self.LAST_API_TIME_KEY)
            self.sharedDefaults?.set(self.lastTripProcessedTime, forKey: self.LAST_TRIP_TIME_KEY)  // NEW
            self.sharedDefaults?.synchronize()
        }
    }

    private func loadPersistedState() {
        // NEW: Check if initial state was already loaded
        isInitialStateLoaded = defaults.bool(forKey: INITIAL_STATE_LOADED_KEY)
        
        // Try shared defaults first (for background)
        if let sharedState = sharedDefaults?.string(forKey: LAST_STATE_KEY) {
            lastState = sharedState
        } else {
            lastState = defaults.string(forKey: LAST_STATE_KEY) ?? ""
        }
        
        if let sharedApiTime = sharedDefaults?.double(forKey: LAST_API_TIME_KEY) as? TimeInterval,
           sharedApiTime > 0 {
            lastApiTime = sharedApiTime
        } else {
            lastApiTime = defaults.double(forKey: LAST_API_TIME_KEY)
        }
        
        // NEW: Load last trip time
        if let sharedTripTime = sharedDefaults?.double(forKey: LAST_TRIP_TIME_KEY) as? TimeInterval {
            lastTripProcessedTime = sharedTripTime
        } else {
            lastTripProcessedTime = defaults.double(forKey: LAST_TRIP_TIME_KEY)
        }
        
        let savedLat = defaults.double(forKey: PREVIOUS_LAT_KEY)
        let savedLng = defaults.double(forKey: PREVIOUS_LNG_KEY)
        previousLat = savedLat != 0.0 ? savedLat : nil
        previousLng = savedLng != 0.0 ? savedLng : nil
        
        previousCity = defaults.string(forKey: PREVIOUS_CITY_KEY) ?? ""
        previousStateName = defaults.string(forKey: PREVIOUS_STATE_KEY) ?? ""
        previousEnterTime = defaults.double(forKey: PREVIOUS_ENTER_TIME_KEY)
        
        print("📦 Loaded persisted state:")
        print("   Initial State Loaded: \(isInitialStateLoaded)")
        print("   Last State: \(lastState)")
        print("   Last API Time: \(lastApiTime)")
        print("   Last Trip Time: \(lastTripProcessedTime)")
        print("   Previous City: \(previousCity)")
        print("   Previous State: \(previousStateName)")
    }

    // Required by RCTEventEmitter
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    // Define events that can be sent to JavaScript
    override func supportedEvents() -> [String]! {
        return [
            "onLocationChanged",
            "onAddressResolved",
            "onApiSuccess",
            "onLocationError",
            "onLocationStatus",
            "onTripApiResponse",
            "onTripApiError",
            "onBackgroundLocationProcessed",
        ]
    }

    // MARK: - React Native Methods

    @objc
    func setConfig(_ config: [String: Any]) {
        print("📍 setConfig called with: \(config)")
        self.config = config

        if let mode = config["geofencingMode"] as? String {
            self.geofencingMode = mode
        }
        if let country = config["geofencingCountry"] as? String {
            self.geofencingCountry = country
        }

        backfillMissingDays()

        DispatchQueue.main.async {
            self.fetchLastStateFromAPI()
        }
    }

    @objc
    func startLocationTracking() {
        print("📍 startLocationTracking called")
        DispatchQueue.main.async {
            self.requestLocationPermission()
        }
    }

    @objc
    func stopLocationTracking() {
        print("📍 stopLocationTracking called")
        DispatchQueue.main.async {
            self.locationManager.stopUpdatingLocation()
            self.isTracking = false
            self.sendEvent(withName: "onLocationStatus", body: ["status": "stopped"])
        }
    }

    @objc
    func isTracking(_ resolve: RCTPromiseResolveBlock, rejecter reject: RCTPromiseRejectBlock) {
        resolve(isTracking)
    }
    
    @objc
    func forceProcessPendingLocations() {
        print("🔧 Manually processing pending locations")
        checkForPendingBackgroundLocations()
    }
    
    @objc
    func resetInitialStateFlag() {
        print("🔄 Resetting initial state flag")
        isInitialStateLoaded = false
        defaults.set(false, forKey: INITIAL_STATE_LOADED_KEY)
        defaults.synchronize()
    }

    // ✅ Fetch last state from API
    private func fetchLastStateFromAPI() {
        guard let domigoToken = config["domigoToken"] as? String else {
            print("❌ Domigo token not configured for last state fetch")
            return
        }

        let apiUrl = "http://3.91.116.18:4001/api/locations/current"

        guard let url = URL(string: apiUrl) else {
            print("❌ Invalid last state API URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "accept")
        request.setValue("Bearer \(domigoToken)", forHTTPHeaderField: "Authorization")

        print("🔄 Fetching last state from API...")

        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                print("❌ Failed to fetch last state: \(error.localizedDescription)")
                self.sendEvent(
                    withName: "onLocationError",
                    body: ["error": "Failed to fetch last state: \(error.localizedDescription)"])
                return
            }

            guard let data = data else {
                print("❌ No data received for last state")
                self.sendEvent(
                    withName: "onLocationError", body: ["error": "No data received for last state"])
                return
            }

            do {
                if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {

                    if let success = json["success"] as? Bool, success == true {
                        if let result = json["result"] as? [String: Any] {

                            if let state = result["state"] as? String {
                                self.lastState = state
                                print("✅ Last state fetched from API: \(state)")

                                // Also update last API time if available
                                if let recordedAt = result["recordedAt"] as? String {
                                    let dateFormatter = ISO8601DateFormatter()
                                    if let date = dateFormatter.date(from: recordedAt) {
                                        self.lastApiTime = date.timeIntervalSince1970 * 1000
                                        print("⏰ Last API time updated: \(recordedAt)")
                                    }
                                }

                                // Save to persistent storage
                                self.saveState()

                                // Send event to JavaScript with the fetched state
                                self.sendEvent(
                                    withName: "onLocationStatus",
                                    body: [
                                        "status": "last_state_loaded",
                                        "lastState": state,
                                        "lastApiTime": self.lastApiTime,
                                    ])
                            }
                        }
                    } else {
                        let errorMessage = json["message"] as? String ?? "Unknown API error"
                        print("❌ API returned unsuccessful response: \(errorMessage)")
                        self.sendEvent(
                            withName: "onLocationError", body: ["error": "Last state API error: \(errorMessage)"])
                    }
                }
            } catch {
                print("❌ Error parsing last state response: \(error.localizedDescription)")
                self.sendEvent(
                    withName: "onLocationError",
                    body: ["error": "Error parsing last state: \(error.localizedDescription)"])
            }
        }

        task.resume()
    }

    // MARK: - Location Management

    private func requestLocationPermission() {
        let status = locationManager.authorizationStatus

        switch status {
        case .notDetermined:
            locationManager.requestAlwaysAuthorization()
        case .authorizedAlways, .authorizedWhenInUse:
            startLocationUpdates()
        case .denied, .restricted:
            sendEvent(withName: "onLocationError", body: ["error": "Location permission denied"])
        @unknown default:
            locationManager.requestAlwaysAuthorization()
        }
    }

    private func startLocationUpdates() {
        // NEW: Add small delay to prevent immediate duplicate updates on app start
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.locationManager.startUpdatingLocation()
            self.isTracking = true
            self.sendEvent(withName: "onLocationStatus", body: ["status": "started"])
            print("🚀 Location tracking started")
        }
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }

        let locationData: [String: Any] = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "speed": location.speed,
            "altitude": location.altitude,
            "timestamp": Date().timeIntervalSince1970 * 1000,
            "provider": "ios",
            "isBackground": backgroundProcessing,
        ]

        print("📍 Location update: \(location.coordinate.latitude), \(location.coordinate.longitude), accuracy: \(location.horizontalAccuracy)")
        sendEvent(withName: "onLocationChanged", body: locationData)

        // Only process if accuracy is good
        if location.horizontalAccuracy < 100 {
            processLocation(location)
        } else {
            print("⚠️ Location accuracy too poor: \(location.horizontalAccuracy)")
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error.localizedDescription)")
        sendEvent(withName: "onLocationError", body: ["error": error.localizedDescription])
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        print("ℹ️ Authorization status changed: \(status.rawValue)")

        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            if !isTracking {
                startLocationUpdates()
            }
        case .denied, .restricted:
            sendEvent(withName: "onLocationError", body: ["error": "Location permission denied"])
        default:
            break
        }
    }

    // MARK: - Location Processing Logic

    private func processLocation(_ location: CLLocation) {
        // NEW: Add to pending queue with deduplication
        addToPendingLocations(location)
    }

    private func reverseGeocode(_ location: CLLocation) {
        // 🚫 prevent parallel calls
        if isGeocoding {
            return
        }

        // 🚫 cancel any ongoing request
        if geocoder.isGeocoding {
            geocoder.cancelGeocode()
        }

        isGeocoding = true

        geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
            guard let self = self else { return }
            self.isGeocoding = false

            if let error = error {
                print("❌ Reverse geocoding failed:", error.localizedDescription)
                return
            }

            guard let placemark = placemarks?.first else { return }

            let city = placemark.locality ?? placemark.subAdministrativeArea ?? ""
            let state = placemark.administrativeArea ?? ""
            let fullAddress = self.formatAddress(from: placemark)

            self.sendEvent(withName: "onAddressResolved", body: [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "city": city,
                "state": state,
                "fullAddress": fullAddress,
                "timestamp": Date().timeIntervalSince1970 * 1000,
                "isBackground": self.backgroundProcessing,
            ])

            self.checkAndSendToAPI(
                lat: location.coordinate.latitude,
                lng: location.coordinate.longitude,
                city: city,
                state: state,
                address: fullAddress,
                isBackground: self.backgroundProcessing
            )
        }
    }

    private func formatAddress(from placemark: CLPlacemark) -> String {
        var addressComponents: [String] = []

        if let subThoroughfare = placemark.subThoroughfare {
            addressComponents.append(subThoroughfare)
        }
        if let thoroughfare = placemark.thoroughfare {
            addressComponents.append(thoroughfare)
        }
        if let locality = placemark.locality {
            addressComponents.append(locality)
        }
        if let administrativeArea = placemark.administrativeArea {
            addressComponents.append(administrativeArea)
        }
        if let postalCode = placemark.postalCode {
            addressComponents.append(postalCode)
        }
        if let country = placemark.country {
            addressComponents.append(country)
        }

        return addressComponents.joined(separator: ", ")
    }

    // ✅ UPDATED: 4 HOUR AND STATE CHANGE CHECK WITH DEDUPLICATION
  // ✅ UPDATED: 4 HOUR AND STATE CHANGE CHECK WITH DEDUPLICATION
private func checkAndSendToAPI(
    lat: Double, lng: Double, city: String, state: String, address: String, 
    isBackground: Bool = false, geocodeFailed: Bool = false
) {
    let currentTimeMs = Date().timeIntervalSince1970 * 1000  // milliseconds
    let currentTimeSeconds = Date().timeIntervalSince1970  // seconds
    
    // Convert lastApiTime from ms to seconds for comparison
    let lastApiTimeSeconds = lastApiTime / 1000
    let timeDifferenceSeconds = currentTimeSeconds - lastApiTimeSeconds
    
    let stateChanged = state != lastState
    let timePassed = timeDifferenceSeconds >= FOUR_HOURS_IN_SECONDS
    
    print("⏰ Time difference: \(timeDifferenceSeconds / 60) minutes")
    print("🏛️ State changed: \(stateChanged) (last: '\(lastState)', current: '\(state)')")
    print("🕒 4 hours passed: \(timePassed)")
    print("📱 Processing mode: \(isBackground ? "Background" : "Foreground")")
    print("🗺️ Geocode status: \(geocodeFailed ? "Failed" : "Success")")
    
    if stateChanged || timePassed {
        print("✅ Conditions met - Sending to API")
        
        // Initialize previous location if needed
        if previousEnterTime == 0 {
            previousLat = lat
            previousLng = lng
            previousCity = city
            previousStateName = state
            previousEnterTime = currentTimeMs
        }
        
        // NEW: Check if trip should be sent (with cooldown and not already processing)
        let tripCooldownPassed = currentTimeSeconds - (lastTripProcessedTime / 1000) >= TRIP_COOLDOWN_SECONDS
        
        // For TRIP when state changes
        if stateChanged && previousStateName != "" && !geocodeFailed && !isProcessingTrip {
            isProcessingTrip = true
            lastTripProcessedTime = currentTimeMs
            
            // Get today's date in YYYY-MM-DD format
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd"
            let today = dateFormatter.string(from: Date())
            
            // Send TRIP entry
            sendTripFormData(
                kind: "trip",
                date: today,
                typeOfDayId: 1, // Default value
                isCommissionDay: false,
                isRemoteWork: false,
                remoteHours: 0,
                isTravelling: true,
                tripTypeId: 1,
                tripModeId: 1,
                confirmationNo: "",
                vendor: "",
                hasProof: false,
                proofType: "other",
                notes: "Auto-tracked trip",
                creationType: "automatic",
                remoteLocation: "",
                stateId: nil, // Not used for trip
                
                // Trip specific fields
                originCity: previousCity,
                originState: previousStateName,
                originLat: previousLat,
                originLng: previousLng,
                destinationCity: city,
                destinationState: state,
                destinationLat: lat,
                destinationLng: lng,


                startDate: previousEnterTime,
                endDate: currentTimeMs
            )
        } else if stateChanged && !tripCooldownPassed {
            print("⏳ Skipping trip API - cooldown period active")
        }
        
        // For MISSING day - you might want to call this separately when user enters a state
        // This would be a different endpoint call, not automatically from location updates
        // You could call this when you detect the user has been in a state without a recorded entry
        
        // Always send to Domigo API (even with empty city/state if geocode failed)
        sendToDomigoAPI(
            lat: lat, 
            lng: lng, 
            city: city, 
            state: state, 
            address: address,
            isBackground: isBackground
        )
        
        // Update tracking values
        lastState = state
        lastApiTime = currentTimeMs
        
        // Update previous location data (only if geocoding succeeded)
        if !geocodeFailed {
            previousLat = lat
            previousLng = lng
            previousCity = city
            previousStateName = state
            previousEnterTime = currentTimeMs
        }
        
        // Save to persistent storage
        saveState()
        
        // Notify JavaScript if in background
        if isBackground {
            sendEvent(withName: "onBackgroundLocationProcessed", body: [
                "latitude": lat,
                "longitude": lng,
                "city": city,
                "state": state,
                "timestamp": currentTimeMs,
                "stateChanged": stateChanged,
                "timePassed": timePassed,
                "geocodeFailed": geocodeFailed,
                "tripSent": stateChanged && previousStateName != "" && !geocodeFailed && tripCooldownPassed,
            ])
        }
        
        // Reset trip processing flag after a delay
        if isProcessingTrip {
            DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
                self.isProcessingTrip = false
            }
        }
    } else {
        print("⏳ No API update required (No state change & 4hr not passed)")
        
        // Still notify for background updates even if no API call
        if isBackground {
            sendEvent(withName: "onBackgroundLocationProcessed", body: [
                "latitude": lat,
                "longitude": lng,
                "city": city,
                "state": state,
                "timestamp": currentTimeMs,
                "stateChanged": stateChanged,
                "timePassed": timePassed,
                "apiCalled": false,
                "geocodeFailed": geocodeFailed,
            ])
        }
    }
}

    private func sendToDomigoAPI(
        lat: Double, lng: Double, city: String, state: String, address: String,
        isBackground: Bool = false
    ) {
        guard let domigoToken = config["domigoToken"] as? String,
              let apiUrl = config["apiUrl"] as? String
        else {
            print("❌ Domigo token or API URL not configured")
            sendEvent(
                withName: "onLocationError", body: ["error": "Domigo token or API URL not configured"])
            return
        }

        let body: [String: Any] = [
            "latitude": lat,
            "longitude": lng,
            "state": state,
            "city": city,
            "address": address,
            "isBackground": isBackground,
        ]

        guard let url = URL(string: apiUrl) else {
            print("❌ Invalid API URL: \(apiUrl)")
            sendEvent(withName: "onLocationError", body: ["error": "Invalid API URL"])
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(domigoToken)", forHTTPHeaderField: "Authorization")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            print("❌ Error creating request body: \(error)")
            sendEvent(
                withName: "onLocationError",
                body: ["error": "Error creating request body: \(error.localizedDescription)"])
            return
        }

        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                print("❌ API call failed: \(error.localizedDescription)")
                self.sendEvent(
                    withName: "onLocationError",
                    body: ["error": "API call failed: \(error.localizedDescription)"])
                return
            }

            if let httpResponse = response as? HTTPURLResponse {
                if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                    print("✅ Location sent to Domigo API successfully")

                    self.sendEvent(
                        withName: "onApiSuccess",
                        body: [
                            "message": "Location sent to API successfully",
                            "state": state,
                            "city": city,
                            "timestamp": Date().timeIntervalSince1970 * 1000,
                            "isBackground": isBackground,
                        ])
                } else {
                    let errorMessage = "API error \(httpResponse.statusCode)"
                    print("❌ \(errorMessage)")
                    self.sendEvent(withName: "onLocationError", body: ["error": errorMessage])
                }
            }
        }

        task.resume()
    }

private func scheduleMidnightMissingDay() {
    let calendar = Calendar.current
    var components = calendar.dateComponents([.year, .month, .day], from: Date())
    components.day! += 1
    components.hour = 0
    components.minute = 0
    components.second = 5

    let midnight = calendar.date(from: components)!

    let delay = midnight.timeIntervalSinceNow

    print("⏰ Missing-day scheduled in \(delay) seconds")

    DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
        self.createMissingDay()
        self.scheduleMidnightMissingDay() // reschedule next day
    }
}
private func createMissingDay() {

    // 🔥 Always reload persisted state first
    loadPersistedState()

    // fallback: use lastState if previous empty
    let stateToSend = previousStateName.isEmpty ? lastState : previousStateName

    guard !stateToSend.isEmpty else {
        print("❌ Missing day skipped — no state available")
        return
    }

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    let today = formatter.string(from: Date())

    print("🌙 Creating missing day for \(today) in \(stateToSend)")

    sendTripFormData(
        kind: "missing",
        date: today,
        typeOfDayId: nil,
        isCommissionDay: false,
        isRemoteWork: false,
        remoteHours: 0,
        isTravelling: false,
        tripTypeId: nil,
        tripModeId: nil,
        confirmationNo: "",
        vendor: "",
        hasProof: false,
        proofType: "other",
        notes: "",
        creationType: "automatic",
        remoteLocation: "",
        stateId: stateToSend,

        originCity: nil,
        originState: nil,
        originLat: nil,
        originLng: nil,
        destinationCity: nil,
        destinationState: nil,
        destinationLat: nil,
        destinationLng: nil
    )
}




  private func sendTripFormData(
    kind: String, // "trip" or "missing"
    
    // COMMON
    date: String?,
    typeOfDayId: Int?,
    isCommissionDay: Bool,
    isRemoteWork: Bool,
    remoteHours: Int?,
    isTravelling: Bool,
    tripTypeId: Int?,
    tripModeId: Int?,
    confirmationNo: String?,
    vendor: String?,
    hasProof: Bool,
    proofType: String?,
    notes: String?,
    creationType: String?,
    remoteLocation: String?,
    stateId: String?,
    
    // TRIP ONLY
    originCity: String?,
    originState: String?,
    originLat: Double?,
    originLng: Double?,
    destinationCity: String?,
    destinationState: String?,
    destinationLat: Double?,
    destinationLng: Double?,
    startDate: TimeInterval? = nil,
    endDate: TimeInterval? = nil
) {
    
    guard let domigoToken = config["domigoToken"] as? String else {
        print("❌ Domigo token not configured for trip API")
        return
    }
    
    let boundary = UUID().uuidString
    guard let url = URL(string: "http://3.91.116.18:4001/api/trip-days") else {
        print("❌ Invalid trip API URL")
        return
    }
    
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(domigoToken)", forHTTPHeaderField: "Authorization")
    request.setValue(
        "multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
    
    var body = Data()
    
    func addField(_ name: String, _ value: String) {
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
        body.append("\(value)\r\n".data(using: .utf8)!)
    }
    
    func addOptionalField(_ name: String, _ value: String?) {
        guard let value = value, !value.isEmpty else { return }
        addField(name, value)
    }
    
    func addOptionalIntField(_ name: String, _ value: Int?) {
        guard let value = value else { return }
        addField(name, String(value))
    }
    
    func addOptionalDoubleField(_ name: String, _ value: Double?) {
        guard let value = value else { return }
        addField(name, String(value))
    }
    
    func boolToString(_ value: Bool) -> String {
        return value ? "true" : "false"
    }
    
    // ===== COMMON FIELDS FOR ALL KINDS =====
    addField("kind", kind)
    addOptionalField("date", date)
    addOptionalIntField("typeOfDayId", typeOfDayId ?? 1) // Default to 1 if nil
    addField("isCommissionDay", boolToString(isCommissionDay))
    addField("isRemoteWork", boolToString(isRemoteWork))
    addOptionalIntField("remoteHours", remoteHours)
    addField("isTravelling", boolToString(isTravelling))
    addOptionalIntField("tripTypeId", tripTypeId)
    addOptionalIntField("tripModeId", tripModeId)
    addOptionalField("confirmationNo", confirmationNo)
    addOptionalField("vendor", vendor)
    addField("hasProof", boolToString(hasProof))
    addField("proofType", proofType ?? "other")
    addOptionalField("notes", notes)
    addOptionalField("creationType", creationType)
    addOptionalField("remoteLocation", remoteLocation)
    addField("attachments", "[]")
    
    // ===== MISSING DAY SPECIFIC FIELDS =====
    if kind == "missing" {
        addOptionalField("state", stateId)
    }
    
    // ===== TRIP SPECIFIC FIELDS =====
    if kind == "trip" {
        addOptionalField("originCity", originCity)
        addOptionalField("originState", originState)
        addOptionalDoubleField("originLat", originLat)
        addOptionalDoubleField("originLng", originLng)
        
        addOptionalField("destinationCity", destinationCity)
        addOptionalField("destinationState", destinationState)
        addOptionalDoubleField("destinationLat", destinationLat)
        addOptionalDoubleField("destinationLng", destinationLng)

        if let start = startDate {
            addField("startDate", formatDate1(start))
        }

        if let end = endDate {
            addField("endDate", formatDate1(end))
        }
    }
    
    body.append("--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body
    
    let queuePayload: [String: Any] = [
        "kind": kind,
        "date": date ?? "",
        "originCity": originCity ?? "",
        "originState": originState ?? "",
        "originLat": originLat ?? 0.0,
        "originLng": originLng ?? 0.0,
        "destinationCity": destinationCity ?? "",
        "destinationState": destinationState ?? "",
        "destinationLat": destinationLat ?? 0.0,
        "destinationLng": destinationLng ?? 0.0,
        "startDate": startDate.map { formatDate1($0) } ?? "",
        "endDate": endDate.map { formatDate1($0) } ?? "",
        "creationType": creationType ?? "automatic",
        "state": stateId ?? "",
    ]

    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
        guard let self = self else { return }
        
        if let error = error {
            print("❌ Trip API error: \(error.localizedDescription)")
            self.enqueueToOfflineQueue(queuePayload)
            self.sendEvent(
                withName: "onTripApiError",
                body: [
                    "success": false,
                    "error": error.localizedDescription,
                    "kind": kind,
                    "date": date ?? "",
                    "timestamp": Date().timeIntervalSince1970 * 1000,
                ])
            return
        }
        
        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        let resText = String(data: data ?? Data(), encoding: .utf8) ?? ""
        
        if status < 200 || status >= 300 {
            self.enqueueToOfflineQueue(queuePayload)
        }
        
        print("📡 Trip API Response - Status: \(status), Kind: \(kind), Response: \(resText)")
        
        self.sendEvent(
            withName: "onTripApiResponse",
            body: [
                "success": status == 200 || status == 201,
                "statusCode": status,
                "response": resText,
                "kind": kind,
                "date": date ?? "",
                "timestamp": Date().timeIntervalSince1970 * 1000,
            ])
    }
    
    task.resume()
}
    
    // MARK: - Offline Queue (Gap 2)

    private func enqueueToOfflineQueue(_ payload: [String: Any]) {
        var queue = defaults.array(forKey: OFFLINE_QUEUE_KEY) as? [[String: Any]] ?? []
        let entry: [String: Any] = [
            "payload": payload,
            "retryCount": 0,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        queue.append(entry)
        defaults.set(queue, forKey: OFFLINE_QUEUE_KEY)
        defaults.synchronize()
        print("Offline queue: enqueued event, queue size=\(queue.count)")
    }

    private func flushOfflineQueue() {
        guard var queue = defaults.array(forKey: OFFLINE_QUEUE_KEY) as? [[String: Any]], !queue.isEmpty else { return }
        guard let domigoToken = config["domigoToken"] as? String, !domigoToken.isEmpty else { return }

        print("Offline queue: flushing \(queue.count) events")
        var remaining: [[String: Any]] = []

        let group = DispatchGroup()
        for var entry in queue {
            let retryCount = entry["retryCount"] as? Int ?? 0
            if retryCount >= MAX_OFFLINE_RETRIES {
                print("Offline queue: dropping event after \(MAX_OFFLINE_RETRIES) retries")
                continue
            }
            guard let payload = entry["payload"] as? [String: Any] else { continue }

            group.enter()
            sendQueuedEntry(payload, token: domigoToken) { success in
                if !success {
                    entry["retryCount"] = retryCount + 1
                    remaining.append(entry)
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            self.defaults.set(remaining, forKey: self.OFFLINE_QUEUE_KEY)
            self.defaults.synchronize()
        }
    }

    private func sendQueuedEntry(_ payload: [String: Any], token: String, completion: @escaping (Bool) -> Void) {
        let kind = payload["kind"] as? String ?? "trip"
        let boundary = UUID().uuidString
        guard let url = URL(string: "http://3.91.116.18:4001/api/trip-days") else {
            completion(false); return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        func addField(_ name: String, _ value: String) {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        addField("kind", kind)
        addField("date", payload["date"] as? String ?? "")
        addField("typeOfDayId", "1")
        addField("isCommissionDay", "false")
        addField("isRemoteWork", "false")
        addField("remoteHours", "0")
        addField("isTravelling", kind == "trip" ? "true" : "false")
        addField("tripTypeId", "1")
        addField("tripModeId", "1")
        addField("confirmationNo", "")
        addField("vendor", "")
        addField("hasProof", "false")
        addField("proofType", "other")
        addField("notes", "")
        addField("creationType", payload["creationType"] as? String ?? "automatic")
        addField("remoteLocation", "")
        addField("attachments", "[]")

        if kind == "missing" {
            addField("state", payload["state"] as? String ?? "")
        }
        if kind == "trip" {
            addField("originCity", payload["originCity"] as? String ?? "")
            addField("originState", payload["originState"] as? String ?? "")
            if let v = payload["originLat"] { addField("originLat", "\(v)") }
            if let v = payload["originLng"] { addField("originLng", "\(v)") }
            addField("destinationCity", payload["destinationCity"] as? String ?? "")
            addField("destinationState", payload["destinationState"] as? String ?? "")
            if let v = payload["destinationLat"] { addField("destinationLat", "\(v)") }
            if let v = payload["destinationLng"] { addField("destinationLng", "\(v)") }
            let sd = payload["startDate"] as? String ?? ""
            if !sd.isEmpty { addField("startDate", sd) }
            let ed = payload["endDate"] as? String ?? ""
            if !ed.isEmpty { addField("endDate", ed) }
        }

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        URLSession.shared.dataTask(with: request) { _, response, error in
            if error != nil { completion(false); return }
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            completion(status >= 200 && status < 300)
        }.resume()
    }

    // MARK: - Missing Day Backfill (Gap 5)

    private func backfillMissingDays() {
        guard let lastDate = defaults.string(forKey: LAST_TRACKED_DATE_KEY) else { return }
        let stateForBackfill = previousStateName.isEmpty ? lastState : previousStateName
        guard !stateForBackfill.isEmpty else { return }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        guard let last = formatter.date(from: lastDate) else { return }

        let calendar = Calendar.current
        var current = calendar.date(byAdding: .day, value: 1, to: last)!
        let today = formatter.string(from: Date())

        while formatter.string(from: current) < today {
            let gapDate = formatter.string(from: current)
            print("Backfilling missing day: \(gapDate)")
            sendTripFormData(
                kind: "missing", date: gapDate, typeOfDayId: nil,
                isCommissionDay: false, isRemoteWork: false, remoteHours: 0,
                isTravelling: false, tripTypeId: nil, tripModeId: nil,
                confirmationNo: "", vendor: "", hasProof: false, proofType: "other",
                notes: "", creationType: "automatic", remoteLocation: "",
                stateId: stateForBackfill,
                originCity: nil, originState: nil, originLat: nil, originLng: nil,
                destinationCity: nil, destinationState: nil, destinationLat: nil, destinationLng: nil
            )
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }

        defaults.set(today, forKey: LAST_TRACKED_DATE_KEY)
        defaults.synchronize()
    }

    // MARK: - Local GeoJSON Detection (Option B)

    private func loadGeoJsonFeatures() -> [[String: Any]] {
        if let cached = geoJsonFeatures { return cached }

        let fileName = geofencingCountry == "IN" ? "india-states" : "us-states"
        let ext = geofencingCountry == "IN" ? "geojson" : "json"

        guard let url = Bundle.main.url(forResource: fileName, withExtension: ext),
              let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let features = json["features"] as? [[String: Any]] else {
            print("Failed to load GeoJSON \(fileName).\(ext)")
            return []
        }

        geoJsonFeatures = features
        print("GeoJSON loaded: \(features.count) features from \(fileName).\(ext)")
        return features
    }

    private func detectStateFromGeoJSON(lat: Double, lng: Double) -> String? {
        let features = loadGeoJsonFeatures()
        let nameKey = geofencingCountry == "IN" ? "ST_NM" : "name"

        for feature in features {
            guard let geometry = feature["geometry"] as? [String: Any],
                  let type = geometry["type"] as? String,
                  let properties = feature["properties"] as? [String: Any] else { continue }

            var inside = false
            if type == "Polygon", let coords = geometry["coordinates"] as? [[[Double]]] {
                inside = pointInPolygonRings(lat: lat, lng: lng, rings: coords)
            } else if type == "MultiPolygon", let polys = geometry["coordinates"] as? [[[[Double]]]] {
                for poly in polys {
                    if pointInPolygonRings(lat: lat, lng: lng, rings: poly) { inside = true; break }
                }
            }

            if inside {
                return properties[nameKey] as? String
            }
        }
        return nil
    }

    private func pointInPolygonRings(lat: Double, lng: Double, rings: [[[Double]]]) -> Bool {
        guard !rings.isEmpty else { return false }
        if !pointInRing(lat: lat, lng: lng, ring: rings[0]) { return false }
        for h in 1..<rings.count {
            if pointInRing(lat: lat, lng: lng, ring: rings[h]) { return false }
        }
        return true
    }

    private func pointInRing(lat: Double, lng: Double, ring: [[Double]]) -> Bool {
        var inside = false
        let n = ring.count
        var j = n - 1
        for i in 0..<n {
            let xi = ring[i][0], yi = ring[i][1]
            let xj = ring[j][0], yj = ring[j][1]
            if ((yi > lat) != (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
                inside = !inside
            }
            j = i
        }
        return inside
    }

    // private func processWithLocalGeoJSON(lat: Double, lng: Double) {
    //     guard let detectedState = detectStateFromGeoJSON(lat: lat, lng: lng) else {
    //         print("local_native: no state detected for \(lat),\(lng)")
    //         return
    //     }

    //     let currentTimeMs = Date().timeIntervalSince1970 * 1000

    //     if previousEnterTime == 0 {
    //         previousLat = lat
    //         previousLng = lng
    //         previousCity = ""
    //         previousStateName = detectedState
    //         previousEnterTime = currentTimeMs
    //         saveState()
    //         print("local_native: initialized state=\(detectedState)")
    //     }

    //     sendEvent(withName: "onAddressResolved", body: [
    //         "latitude": lat, "longitude": lng,
    //         "city": "", "state": detectedState,
    //         "stateCode": "", "countryCode": geofencingCountry,
    //         "fullAddress": "", "timestamp": currentTimeMs,
    //     ])

    //     checkAndSendToAPI(
    //         lat: lat, lng: lng, city: "", state: detectedState,
    //         address: "", isBackground: backgroundProcessing
    //     )
    // }

    private func processWithLocalGeoJSON(lat: Double, lng: Double) {
    guard let detectedState = detectStateFromGeoJSON(lat: lat, lng: lng) else {
        print("local_native: no state detected")
        return
    }

    let currentTimeMs = Date().timeIntervalSince1970 * 1000

    // FIRST INITIALIZATION
    if previousEnterTime == 0 {
        previousLat = lat
        previousLng = lng
        previousCity = ""
        previousStateName = detectedState
        previousEnterTime = currentTimeMs
        saveState()
        print("Initialized first state: \(detectedState)")
        return
    }

    // SAME STATE → DO NOTHING
    if detectedState == previousStateName {
        return
    }

    // COOLDOWN PROTECTION (5 min like Android)
    let currentSeconds = Date().timeIntervalSince1970
    let lastTripSeconds = lastTripProcessedTime / 1000
    if currentSeconds - lastTripSeconds < TRIP_COOLDOWN_SECONDS {
        print("Cooldown active, skipping trip")
        return
    }

    print("🚗 STATE CHANGED: \(previousStateName) → \(detectedState)")

    let originState = previousStateName
    let originLat = previousLat
    let originLng = previousLng
    let originCity = previousCity
    let startTime = previousEnterTime

    let isOnline = isInternetAvailable()

    if isOnline {
        // ONLINE → Reverse geocode for city
        let location = CLLocation(latitude: lat, longitude: lng)

        geocoder.reverseGeocodeLocation(location) { placemarks, error in
            let city = placemarks?.first?.locality ?? ""
            
            self.createTrip(
                originCity: originCity,
                originState: originState,
                originLat: originLat,
                originLng: originLng,
                destinationCity: city,
                destinationState: detectedState,
                destinationLat: lat,
                destinationLng: lng,
                startDate: startTime,
                endDate: currentTimeMs
            )
        }

    } else {
        // OFFLINE → Direct queue
        createTrip(
            originCity: originCity,
            originState: originState,
            originLat: originLat,
            originLng: originLng,
            destinationCity: "",
            destinationState: detectedState,
            destinationLat: lat,
            destinationLng: lng,
            startDate: startTime,
            endDate: currentTimeMs
        )
    }

    // UPDATE STATE AFTER TRIP
    previousLat = lat
    previousLng = lng
    previousCity = ""
    previousStateName = detectedState
    previousEnterTime = currentTimeMs
    lastTripProcessedTime = currentTimeMs
    saveState()
}


private func createTrip(
    originCity: String?,
    originState: String?,
    originLat: Double?,
    originLng: Double?,
    destinationCity: String?,
    destinationState: String?,
    destinationLat: Double?,
    destinationLng: Double?,
    startDate: TimeInterval?,
    endDate: TimeInterval?
) {

    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    let today = formatter.string(from: Date())

    sendTripFormData(
        kind: "trip",
        date: today,
        typeOfDayId: 1,
        isCommissionDay: false,
        isRemoteWork: false,
        remoteHours: 0,
        isTravelling: true,
        tripTypeId: 1,
        tripModeId: 1,
        confirmationNo: "",
        vendor: "",
        hasProof: false,
        proofType: "other",
        notes: "Auto-tracked trip",
        creationType: "automatic",
        remoteLocation: "",
        stateId: nil,
        originCity: originCity,
        originState: originState,
        originLat: originLat,
        originLng: originLng,
        destinationCity: destinationCity,
        destinationState: destinationState,
        destinationLat: destinationLat,
        destinationLng: destinationLng,
        startDate: startDate,
        endDate: endDate
    )
}

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}