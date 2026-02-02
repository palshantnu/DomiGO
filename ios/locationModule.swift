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

    override init() {
        super.init()
        print("📍 LocationTracker initialized")
        setupLocationManager()
        loadPersistedState()
        // setupNotificationObservers()
        
        // Delay checking pending locations to allow app to fully initialize
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            self.checkForPendingBackgroundLocations()
        }
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
            self.defaults.set(self.lastTripProcessedTime, forKey: self.LAST_TRIP_TIME_KEY)  // NEW: Save trip time
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

        // ✅ Fetch last state when config is set
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
            
            if stateChanged && previousStateName != "" && !geocodeFailed && !isProcessingTrip {
                isProcessingTrip = true
                lastTripProcessedTime = currentTimeMs
                
                sendTripFormData(
                    originLat: previousLat ?? lat,
                    originLng: previousLng ?? lng,
                    originCity: previousCity,
                    originState: previousStateName,
                    originStartDate: previousEnterTime,
                    destinationLat: lat,
                    destinationLng: lng,
                    destinationCity: city,
                    destinationState: state,
                    destinationEnterDate: currentTimeMs
                )
            } else if stateChanged && !tripCooldownPassed {
                print("⏳ Skipping trip API - cooldown period active")
            }
            
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

    private func sendTripFormData(
        originLat: Double,
        originLng: Double,
        originCity: String,
        originState: String,
        originStartDate: TimeInterval,

        destinationLat: Double,
        destinationLng: Double,
        destinationCity: String,
        destinationState: String,
        destinationEnterDate: TimeInterval
    ) {

        guard let domigoToken = config["domigoToken"] as? String else {
            print("❌ Domigo token not configured for trip API")
            return
        }

        let boundary = UUID().uuidString
        guard let url = URL(string: "http://3.91.116.18:4001/api/trips") else {
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

        // ORIGIN
        addField("originLat", "\(originLat)")
        addField("originLng", "\(originLng)")
        addField("originCity", originCity)
        addField("originState", originState)
        addField("startDate", formatDate(originStartDate))

        // DESTINATION
        addField("destinationLat", "\(destinationLat)")
        addField("destinationLng", "\(destinationLng)")
        addField("destinationCity", destinationCity)
        addField("destinationState", destinationState)
        addField("endDate", formatDate(destinationEnterDate))

        addField("attachments", "[]")
        addField("modeId", "1")
        addField("typeId", "1")

        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        request.httpBody = body

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                print("❌ Trip API error: \(error.localizedDescription)")
                self.sendEvent(
                    withName: "onTripApiError",
                    body: [
                        "error": error.localizedDescription,
                        "timestamp": Date().timeIntervalSince1970 * 1000,
                    ])
                return
            }

            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            let resText = String(data: data ?? Data(), encoding: .utf8) ?? ""
            
            print("📡 Trip API Response - Status: \(status), Response: \(resText)")

            self.sendEvent(
                withName: "onTripApiResponse",
                body: [
                    "statusCode": status,
                    "success": status == 200 || status == 201,
                    "response": resText,
                    "timestamp": Date().timeIntervalSince1970 * 1000,
                ])
        }.resume()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
}