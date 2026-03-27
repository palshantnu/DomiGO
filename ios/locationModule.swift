import BackgroundTasks
import CoreLocation
import Foundation
import Network
import React
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

  private var lastTripKey: String = ""
  private let LAST_TRIP_KEY = "LocationTracker_lastTripKey"
  
  
  // MARK: - Network Monitoring
  private let monitor = NWPathMonitor()
  private let monitorQueue = DispatchQueue(label: "com.domigo.network.monitor")
  private var isConnected = true

  // MARK: - State transition properties (to match Android)
  private var isTransitionInProgress = false
  private var stateChangeDetectedTime: TimeInterval = 0

  // MARK: - Deduplication Properties
  private var lastTripProcessedTime: TimeInterval = 0
  private let TRIP_COOLDOWN_SECONDS: TimeInterval = 60
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
  private let LAST_TRIP_TIME_KEY = "LocationTracker_lastTripTime"
  private let INITIAL_STATE_LOADED_KEY = "LocationTracker_initialStateLoaded"
  private let BACKGROUND_LOCATION_KEY = "LatestBackgroundLocation"
  private let CURRENT_STATE_NAME_KEY = "LocationTracker_currentStateName"

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

  // MARK: - Real-time Check Properties
  private var lastRealTimeCheck: TimeInterval = 0
  private let REAL_TIME_CHECK_INTERVAL: TimeInterval = 60
  private var realTimeTimer: Timer?
  
  // MARK: - Event Listener Properties
  private var hasListeners = false
  
  // MARK: - Timer Management
  private var midnightCheckTimer: DispatchSourceTimer?
  private let midnightCheckQueue = DispatchQueue(label: "com.domigo.midnight.check", qos: .background)

  override init() {
    super.init()
    print("📍 LocationTracker initialized")

    setupNetworkMonitoring()
    setupLocationManager()
    loadPersistedState()
    
    // Initialize missing day tracking
    initializeMissingDayTracking()

    // Start real-time checking
    startRealTimeChecking()

    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
      self.checkForPendingBackgroundLocations()
    }
    
    // Listen for background task notifications from AppDelegate
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleMissingDayBackgroundNotification),
      name: NSNotification.Name("PerformMissingDayCheck"),
      object: nil
    )
  }

  // MARK: - RCTEventEmitter Overrides
  override func startObserving() {
    hasListeners = true
    print("👂 LocationTracker started observing")
  }

  override func stopObserving() {
    hasListeners = false
    print("👂 LocationTracker stopped observing")
  }

  override func supportedEvents() -> [String]! {
    return [
      "onLocationChanged",
      "onAddressResolved",
      "onApiSuccess",
      "onLocationError",
      "onLocationStatus",
      "onTripApiResponse",
      "onTripApiError",
      "onBackgroundLocationProcessed"
    ]
  }

  private func safeSendEvent(withName name: String, body: Any!) {
    if hasListeners {
      sendEvent(withName: name, body: body)
    } else {
      print("⚠️ Skipping event \(name) - no listeners")
    }
  }

  // MARK: - Real-time Checking
  private func startRealTimeChecking() {
    stopRealTimeChecking()
    
    realTimeTimer = Timer.scheduledTimer(
      timeInterval: REAL_TIME_CHECK_INTERVAL,
      target: self,
      selector: #selector(performRealTimeCheck),
      userInfo: nil,
      repeats: true
    )
    
    RunLoop.current.add(realTimeTimer!, forMode: .common)
    print("⏱️ Real-time checking started - will check every \(REAL_TIME_CHECK_INTERVAL) seconds")
    
    performRealTimeCheck()
  }
  
  private func stopRealTimeChecking() {
    realTimeTimer?.invalidate()
    realTimeTimer = nil
  }
  
  @objc private func performRealTimeCheck() {
    let currentTime = Date().timeIntervalSince1970
    let timeSinceLastCheck = currentTime - lastRealTimeCheck
    
    print("""
    \n🔄 ===== REAL-TIME CHECK =====
    📱 Time: \(Date())
    🏛️ Current State: \(previousStateName)
    📡 Network: \(isConnected ? "Connected" : "Disconnected")
    ====================================
    """)
    
    // Check for pending offline queue
//    if isConnected {
//      flushOfflineQueue()
//    }
    
    lastRealTimeCheck = currentTime
  }

  // MARK: - Missing Day Tracking Setup
  private func initializeMissingDayTracking() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
    
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
    
    scheduleMidnightMissingDay()
  }
  
  @objc private func handleMissingDayBackgroundNotification() {
    print("📱 Received missing day background notification from AppDelegate")
    createTodaysMissingDay()
  }

  @objc private func handleAppDidBecomeActive() {
    print("📱 App became active")
    startRealTimeChecking()
  }
  
  @objc private func handleAppDidEnterBackground() {
    print("📱 App entered background")
  }

  // MARK: - Network Monitoring Setup
  private func setupNetworkMonitoring() {
    monitor.pathUpdateHandler = { [weak self] path in
      let wasConnected = self?.isConnected ?? false
      self?.isConnected = path.status == .satisfied

      print("📡 Network status: \(path.status == .satisfied ? "Connected" : "Disconnected")")

      if !wasConnected && path.status == .satisfied {
        print("📡 Internet connected - flushing offline queue")
        DispatchQueue.main.async {
          self?.flushOfflineQueue()
        }
      }
    }
    monitor.start(queue: monitorQueue)
  }

  // MARK: - Location Manager Setup
  private func setupLocationManager() {
    locationManager = CLLocationManager()
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    locationManager.distanceFilter = 50
    locationManager.allowsBackgroundLocationUpdates = true
    locationManager.pausesLocationUpdatesAutomatically = false
    locationManager.startMonitoringSignificantLocationChanges()

    if !CLLocationManager.locationServicesEnabled() {
      print("⚠️ Location services are disabled")
      safeSendEvent(withName: "onLocationError", body: ["error": "Location services are disabled"])
    }
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

      self.sharedDefaults?.set(self.lastState, forKey: self.LAST_STATE_KEY)
      self.sharedDefaults?.set(self.lastApiTime, forKey: self.LAST_API_TIME_KEY)
      self.sharedDefaults?.set(self.lastTripProcessedTime, forKey: self.LAST_TRIP_TIME_KEY)
      self.sharedDefaults?.synchronize()
      self.defaults.set(self.lastTripKey, forKey: self.LAST_TRIP_KEY)
    }
    
  }

  private func loadPersistedState() {
    isInitialStateLoaded = defaults.bool(forKey: INITIAL_STATE_LOADED_KEY)

    if let sharedState = sharedDefaults?.string(forKey: LAST_STATE_KEY) {
      lastState = sharedState
    } else {
      lastState = defaults.string(forKey: LAST_STATE_KEY) ?? ""
    }

    if let sharedApiTime = sharedDefaults?.double(forKey: LAST_API_TIME_KEY) as? TimeInterval,
      sharedApiTime > 0
    {
      lastApiTime = sharedApiTime
    } else {
      lastApiTime = defaults.double(forKey: LAST_API_TIME_KEY)
    }

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
    lastTripKey = defaults.string(forKey: LAST_TRIP_KEY) ?? ""
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
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
      self.safeSendEvent(withName: "onLocationStatus", body: ["status": "stopped"])
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

  // MARK: - Background Location Processing

  private func checkForPendingBackgroundLocations() {
    if isInitialStateLoaded {
      print("📍 Initial state already loaded, skipping duplicate pending location check")
      return
    }

    locationQueue.async { [weak self] in
      guard let self = self else { return }

      if let sharedData = self.sharedDefaults?.dictionary(forKey: self.BACKGROUND_LOCATION_KEY)
        as? [String: Any]
      {
        print("📍 Found pending location in shared defaults")
        self.processLocationFromBackgroundData(sharedData)
        self.sharedDefaults?.removeObject(forKey: self.BACKGROUND_LOCATION_KEY)
        self.sharedDefaults?.synchronize()
      }

      if let standardData = self.defaults.dictionary(forKey: self.BACKGROUND_LOCATION_KEY)
        as? [String: Any]
      {
        print("📍 Found pending location in standard defaults")
        self.processLocationFromBackgroundData(standardData)
        self.defaults.removeObject(forKey: self.BACKGROUND_LOCATION_KEY)
        self.defaults.synchronize()
      }

      self.isInitialStateLoaded = true
      self.defaults.set(true, forKey: self.INITIAL_STATE_LOADED_KEY)
      self.defaults.synchronize()
    }
  }

  private func processLocationFromBackgroundData(_ data: [String: Any]) {
    guard let lat = data["latitude"] as? Double,
      let lng = data["longitude"] as? Double
    else {
      return
    }

    let accuracy = data["accuracy"] as? Double ?? 100.0

    print("📍 Processing pending background location: \(lat), \(lng), accuracy: \(accuracy)")

    if accuracy < 200 {
      let location = CLLocation(latitude: lat, longitude: lng)
      self.addToPendingLocations(location)
    }
  }

  private func addToPendingLocations(_ location: CLLocation) {
    locationQueue.async { [weak self] in
      guard let self = self else { return }

      self.pendingLocations.append(location)

      if self.pendingLocations.count > 10 {
        self.pendingLocations.removeFirst()
      }

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

      guard let location = self.pendingLocations.last else {
        self.isProcessingPending = false
        return
      }

      self.pendingLocations.removeAll()

      self.processLocationInBackground(
        lat: location.coordinate.latitude, lng: location.coordinate.longitude)

      DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
        self.isProcessingPending = false
        self.processNextPendingLocation()
      }
    }
  }

  private func isInternetAvailable() -> Bool {
    return isConnected
  }

  private func processLocationInBackground(lat: Double, lng: Double) {
//    flushOfflineQueue()

    if geofencingMode == "local_native" {
      processWithLocalGeoJSON(lat: lat, lng: lng)
      return
    }

    if geofencingMode == "local_js" {
      print("local_js mode — skipping native geocoding")
      return
    }

    let currentTime = Date().timeIntervalSince1970
    lastGeocodeTime = currentTime
    backgroundProcessing = true

    let location = CLLocation(latitude: lat, longitude: lng)
    let backgroundGeocoder = CLGeocoder()

    let geocodeTimeout = 8.0
    var geocodeCompleted = false

    DispatchQueue.main.asyncAfter(deadline: .now() + geocodeTimeout) {
      if !geocodeCompleted {
        backgroundGeocoder.cancelGeocode()
        print("⏰ Geocoding timeout for background location")
        self.backgroundProcessing = false

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

      self.loadPersistedState()

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

  private func formatDate1(_ timestamp: TimeInterval) -> String {
    let date = Date(timeIntervalSince1970: timestamp / 1000)
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter.string(from: date)
  }

  // MARK: - Location Permission and Updates

  private func requestLocationPermission() {
    let status = locationManager.authorizationStatus

    switch status {
    case .notDetermined:
      locationManager.requestAlwaysAuthorization()
    case .authorizedAlways, .authorizedWhenInUse:
      startLocationUpdates()
    case .denied, .restricted:
      safeSendEvent(withName: "onLocationError", body: ["error": "Location permission denied"])
    @unknown default:
      locationManager.requestAlwaysAuthorization()
    }
  }

  private func startLocationUpdates() {
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
      self.locationManager.startUpdatingLocation()
      self.isTracking = true
      self.safeSendEvent(withName: "onLocationStatus", body: ["status": "started"])
      print("🚀 Location tracking started")
    }
  }

  // MARK: - CLLocationManagerDelegate

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let location = locations.last else { return }

    
//processWithLocalGeoJSON(lat: location.coordinate.latitude, lng: location.coordinate.longitude)
//    let locationData: [String: Any] = [
//      "latitude": location.coordinate.latitude,
//      "longitude": location.coordinate.longitude,
//      "accuracy": location.horizontalAccuracy,
//      "speed": location.speed,
//      "altitude": location.altitude,
//      "timestamp": Date().timeIntervalSince1970 * 1000,
//      "provider": "ios",
//      "isBackground": backgroundProcessing,
//    ]

//    print(
//      "📍 Location update: \(location.coordinate.latitude), \(location.coordinate.longitude), accuracy: \(location.horizontalAccuracy)"
//    )
//    safeSendEvent(withName: "onLocationChanged", body: locationData)

    if location.horizontalAccuracy < 100 {
      processLocation(location)
    } else {
      print("⚠️ Location accuracy too poor: \(location.horizontalAccuracy)")
    }
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    print("❌ Location error: \(error.localizedDescription)")
    safeSendEvent(withName: "onLocationError", body: ["error": error.localizedDescription])
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
      safeSendEvent(withName: "onLocationError", body: ["error": "Location permission denied"])
    default:
      break
    }
  }

  // MARK: - Location Processing Logic

  private func processLocation(_ location: CLLocation) {
    addToPendingLocations(location)
  }

  private func reverseGeocode(_ location: CLLocation) {
    if isGeocoding {
      return
    }

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

      self.safeSendEvent(
        withName: "onAddressResolved",
        body: [
          "latitude": location.coordinate.latitude,
          "longitude": location.coordinate.longitude,
          "city": city,
          "state": state,
          "fullAddress": fullAddress,
          "timestamp": Date().timeIntervalSince1970 * 1000,
          "isBackground": self.backgroundProcessing,
        ])

        print("❌ Reverse geocoding result:", city,state,fullAddress)


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
        return
      }

      guard let data = data else {
        print("❌ No data received for last state")
        return
      }

      do {
        if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any] {
          if let success = json["success"] as? Bool, success == true {
            if let result = json["result"] as? [String: Any] {
              if let state = result["state"] as? String {
                self.lastState = state
                print("✅ Last state fetched from API: \(state)")

                if let recordedAt = result["recordedAt"] as? String {
                  let dateFormatter = ISO8601DateFormatter()
                  if let date = dateFormatter.date(from: recordedAt) {
                    self.lastApiTime = date.timeIntervalSince1970 * 1000
                    print("⏰ Last API time updated: \(recordedAt)")
                  }
                }

                self.saveState()
              }
            }
          }
        }
      } catch {
        print("❌ Error parsing last state response: \(error.localizedDescription)")
      }
    }

    task.resume()
  }

  private func checkAndSendToAPI(
    lat: Double, lng: Double, city: String, state: String, address: String,
    isBackground: Bool = false, geocodeFailed: Bool = false
  ) {
    
    let currentTimeMs = Date().timeIntervalSince1970 * 1000
    let currentTimeSeconds = Date().timeIntervalSince1970

    let lastApiTimeSeconds = lastApiTime / 1000
    let timeDifferenceSeconds = currentTimeSeconds - lastApiTimeSeconds

    let stateChanged = !state.isEmpty && !lastState.isEmpty && state != lastState
    let timePassed = timeDifferenceSeconds >= FOUR_HOURS_IN_SECONDS

    print("⏰ Time difference: \(timeDifferenceSeconds / 60) minutes")
    print("🏛️ State changed: \(stateChanged) (last: '\(lastState)', current: '\(state)')")
    print("🕒 4 hours passed: \(timePassed)")

    if stateChanged || timePassed {
      print("✅ Conditions met - Sending to API")

      if previousEnterTime == 0 {
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousStateName = state
        previousEnterTime = currentTimeMs
      }
      let tripKey = "\(previousStateName)-\(state)-\(Int(previousEnterTime))"

      if tripKey == lastTripKey {
          print("⚠️ Duplicate trip blocked with key: \(tripKey)")
          return
      }
      let tripCooldownPassed =
        currentTimeSeconds - (lastTripProcessedTime / 1000) >= TRIP_COOLDOWN_SECONDS
      
      let timeDiff = currentTimeSeconds - (lastTripProcessedTime / 1000)

      if timeDiff < 30 {
          print("⚠️ Skipping trip - too soon")
          return
      }

      if stateChanged && previousStateName != "" && !isProcessingTrip {
        isProcessingTrip = true
        lastTripProcessedTime = currentTimeMs
        lastTripKey = tripKey

        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let today = dateFormatter.string(from: Date())

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
          isUpdated:false,
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
      }

      sendToDomigoAPI(
        lat: lat,
        lng: lng,
        city: city,
        state: state,
        address: address,
        isBackground: isBackground
      )

      lastState = state
      lastApiTime = currentTimeMs

      if !geocodeFailed {
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousStateName = state
        previousEnterTime = currentTimeMs
      }

      saveState()

      if isProcessingTrip {
        DispatchQueue.main.asyncAfter(deadline: .now() + 5.0) {
          self.isProcessingTrip = false
        }
      }
    } else {
      print("⏳ No API update required (No state change & 4hr not passed)")
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
      safeSendEvent(
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
      safeSendEvent(withName: "onLocationError", body: ["error": "Invalid API URL"])
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
      safeSendEvent(
        withName: "onLocationError",
        body: ["error": "Error creating request body: \(error.localizedDescription)"])
      return
    }

    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self = self else { return }

      if let error = error {
        print("❌ API call failed: \(error.localizedDescription)")
        return
      }

      if let httpResponse = response as? HTTPURLResponse {
        if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
          print("✅ Location sent to Domigo API successfully")

          self.safeSendEvent(
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
        }
      }
    }

    task.resume()
  }

  // MARK: - SIMPLIFIED Missing Day Functions
  
  private func scheduleMidnightMissingDay() {
    scheduleNextMidnightCheck()
  }

  private func scheduleNextMidnightCheck() {
    let calendar = Calendar.current
    let now = Date()
    
    // Get today's 1:22 PM (ya jo bhi time chahiye)
    var components = calendar.dateComponents([.year, .month, .day], from: now)
    components.hour = 0
    components.minute = 5
    components.second = 0
    
    guard let scheduledTime = calendar.date(from: components) else {
        print("❌ Failed to create date")
        return
    }
    
    // Determine next run time
    let nextRunTime: Date
    if now < scheduledTime {
        nextRunTime = scheduledTime
        print("📅 Scheduling for TODAY at 12:05 AM")
    } else {
        nextRunTime = calendar.date(byAdding: .day, value: 1, to: scheduledTime)!
        print("📅 Scheduling for TOMORROW at 12:05 AM")
    }
    
    print("⏰ Next missing day check at: \(nextRunTime)")
    
    // Cancel previous timer
    midnightCheckTimer?.cancel()
    
    // Create new timer
    let timer = DispatchSource.makeTimerSource(queue: midnightCheckQueue)
    timer.schedule(wallDeadline: .now() + nextRunTime.timeIntervalSinceNow, repeating: .never)
    timer.setEventHandler { [weak self] in
        print("🕒 Running scheduled missing day check at \(Date())")
        DispatchQueue.main.async {
            // SIMPLE - bas missing day banao, koi check nahi
            self?.createTodaysMissingDay()
            self?.scheduleNextMidnightCheck()
        }
    }
    timer.resume()
    midnightCheckTimer = timer
  }

  // SIMPLE - Bas aaj ka missing day banao
  private func createTodaysMissingDay() {
    let today = getTodayString()
    let stateToUse = getStateForMissingDay()
    
    print("📝 Creating missing day for TODAY: \(today) in state: \(stateToUse)")
    
    if stateToUse.isEmpty {
      print("❌ Cannot create missing day - no state available")
      // Try to get state from somewhere
      if !previousStateName.isEmpty {
        createWithState(previousStateName)
      } else if !lastState.isEmpty {
        createWithState(lastState)
      }
      return
    }
    
    createWithState(stateToUse)
  }
  
  private func createWithState(_ state: String) {
    let today = getTodayString()
    
    if isInternetAvailable() {
      // Online mode - send immediately
      sendTripFormData(
        kind: "missing",
        date: today,
        typeOfDayId: 1,
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
        notes: "Auto-tracked missing day",
        creationType: "automatic",
        remoteLocation: "",
        stateId: state,
        isUpdated:false,
        originCity: nil,
        originState: nil,
        originLat: nil,
        originLng: nil,
        destinationCity: nil,
        destinationState: nil,
        destinationLat: nil,
        destinationLng: nil
      )
    } else {
      // Offline mode - queue for later
      print("📱 Offline mode - queuing missing day for today")
      let payload: [String: Any] = [
        "kind": "missing",
        "date": today,
        "state": state,
        "creationType": "automatic"
      ]
      enqueueToOfflineQueue(payload)
    }
    
    updateLastTrackedDate()
  }

  private func getTodayString() -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone.current
    return formatter.string(from: Date())
  }

  private func getStateForMissingDay() -> String {
    if !previousStateName.isEmpty {
      return previousStateName
    }
    if !lastState.isEmpty {
      return lastState
    }
    return ""
  }

  private func updateLastTrackedDate() {
    let today = getTodayString()
    defaults.set(today, forKey: LAST_TRACKED_DATE_KEY)
    sharedDefaults?.set(today, forKey: LAST_TRACKED_DATE_KEY)
    defaults.synchronize()
    sharedDefaults?.synchronize()
    print("📅 Last tracked date updated to: \(today)")
  }

  private func sendTripFormData(
    kind: String,
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
    isUpdated:Bool,
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

    addField("kind", kind)
    addOptionalField("date", date)
    addOptionalIntField("typeOfDayId", typeOfDayId ?? 1)
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

    if kind == "missing" {
      addOptionalField("state", stateId)
    }

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

    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self = self else { return }

      if let error = error {
        print("❌ Trip API error: \(error.localizedDescription)")
        let queuePayload: [String: Any] = [
          "kind": kind,
          "date": date ?? "",
          "originCity": originCity ?? "",
          "originState": originState ?? "",
          "originLat": originLat ?? 0,
          "originLng": originLng ?? 0,
          "destinationCity": destinationCity ?? "",
          "destinationState": destinationState ?? "",
          "destinationLat": destinationLat ?? 0,
          "destinationLng": destinationLng ?? 0,
          "startDate": startDate ?? 0,
          "endDate": endDate ?? 0,
          "state": stateId ?? "",
          "creationType": creationType ?? "automatic"
        ]
        self.enqueueToOfflineQueue(queuePayload)
        return
      }

      let status = (response as? HTTPURLResponse)?.statusCode ?? 0
      
      if status < 200 || status >= 300 {
        print("❌ Trip API failed with status: \(status)")
        let queuePayload: [String: Any] = [
          "kind": kind,
          "date": date ?? "",
          "originCity": originCity ?? "",
          "originState": originState ?? "",
          "originLat": originLat ?? 0,
          "originLng": originLng ?? 0,
          "destinationCity": destinationCity ?? "",
          "destinationState": destinationState ?? "",
          "destinationLat": destinationLat ?? 0,
          "destinationLng": destinationLng ?? 0,
          "startDate": startDate ?? 0,
          "endDate": endDate ?? 0,
          "state": stateId ?? "",
          "creationType": creationType ?? "automatic"
        ]
        self.enqueueToOfflineQueue(queuePayload)
      } else {
        print("✅ Trip API successful for \(kind) on date: \(date ?? "")")
        self.safeSendEvent(
          withName: "onTripApiResponse",
          body: [
            "success": true,
            "kind": kind,
            "date": date ?? "",
            "timestamp": Date().timeIntervalSince1970 * 1000,
          ])
      }
    }

    task.resume()
  }

  // MARK: - Offline Queue

  private func enqueueToOfflineQueue(_ payload: [String: Any]) {
    var queue = defaults.array(forKey: OFFLINE_QUEUE_KEY) as? [[String: Any]] ?? []
    let entry: [String: Any] = [
      "payload": payload,
      "retryCount": 0,
      "timestamp": Date().timeIntervalSince1970 * 1000,
    ]
    queue.append(entry)
    defaults.set(queue, forKey: OFFLINE_QUEUE_KEY)
    defaults.synchronize()
    print("📦 Offline queue: enqueued event, queue size=\(queue.count)")
  }

  private func flushOfflineQueue() {
    guard var queue = defaults.array(forKey: OFFLINE_QUEUE_KEY) as? [[String: Any]], !queue.isEmpty
    else { return }
    guard let domigoToken = config["domigoToken"] as? String, !domigoToken.isEmpty else { return }

    print("📦 Offline queue: flushing \(queue.count) events")
    var remaining: [[String: Any]] = []

    let group = DispatchGroup()
    for var entry in queue {
      let retryCount = entry["retryCount"] as? Int ?? 0
      if retryCount >= MAX_OFFLINE_RETRIES {
        print("📦 Offline queue: dropping event after \(MAX_OFFLINE_RETRIES) retries")
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
      print("📦 Offline queue flush complete. Remaining: \(remaining.count)")
    }
  }

  private func sendQueuedEntry(
    _ payload: [String: Any], token: String, completion: @escaping (Bool) -> Void
  ) {
    let kind = payload["kind"] as? String ?? "missing"
    let boundary = UUID().uuidString
    guard let url = URL(string: "http://3.91.116.18:4001/api/trip-days") else {
      completion(false)
      return
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.setValue(
      "multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

    var body = Data()
    func addField(_ name: String, _ value: String) {
      body.append("--\(boundary)\r\n".data(using: .utf8)!)
      body.append("Content-Disposition: form-data; name=\"\(name)\"\r\n\r\n".data(using: .utf8)!)
      body.append("\(value)\r\n".data(using: .utf8)!)
    }

    addField("kind", kind)
    addField("date", payload["date"] as? String ?? "")
    
    if kind == "missing" {
      addField("state", payload["state"] as? String ?? "")
      addField("typeOfDayId", "1")
      addField("isCommissionDay", "false")
      addField("isRemoteWork", "false")
      addField("remoteHours", "0")
      addField("isTravelling", "false")
      addField("hasProof", "false")
      addField("proofType", "other")
      addField("notes", "Auto-tracked missing day (offline recovery)")
      addField("creationType", payload["creationType"] as? String ?? "automatic")
      addField("attachments", "[]")
    }

    if kind == "trip" {
      addField("originCity", payload["originCity"] as? String ?? "")
      addField("originState", payload["originState"] as? String ?? "")
      addField("destinationCity", payload["destinationCity"] as? String ?? "")
      addField("destinationState", payload["destinationState"] as? String ?? "")
      addField("originLat", "\(payload["originLat"] ?? 0)")
      addField("originLng", "\(payload["originLng"] ?? 0)")
      addField("destinationLat", "\(payload["destinationLat"] ?? 0)")
      addField("destinationLng", "\(payload["destinationLng"] ?? 0)")

      if let start = payload["startDate"] as? Double {
        addField("startDate", formatDate1(start))
      }

      if let end = payload["endDate"] as? Double {
        addField("endDate", formatDate1(end))
      }

      addField("typeOfDayId", "1")
      addField("isTravelling", "true")
      addField("tripTypeId", "1")
      addField("tripModeId", "1")
      addField("hasProof", "false")
      addField("proofType", "other")
      addField("notes", "Offline trip sync")
      addField("creationType", payload["creationType"] as? String ?? "automatic")
      addField("attachments", "[]")
    }

    body.append("--\(boundary)--\r\n".data(using: .utf8)!)
    request.httpBody = body

    URLSession.shared.dataTask(with: request) { _, response, error in
      if error != nil {
        completion(false)
        return
      }
      let status = (response as? HTTPURLResponse)?.statusCode ?? 0
      let success = status >= 200 && status < 300
      if success {
        print("✅ Offline queue entry sent successfully for date: \(payload["date"] as? String ?? "")")
      }
      completion(success)
    }.resume()
  }

  // MARK: - Local GeoJSON Detection

  private func loadGeoJsonFeatures() -> [[String: Any]] {
    if let cached = geoJsonFeatures { return cached }

    let fileName = geofencingCountry == "IN" ? "india-states" : "us-states"
    let ext = geofencingCountry == "IN" ? "geojson" : "json"

    guard let url = Bundle.main.url(forResource: fileName, withExtension: ext),
      let data = try? Data(contentsOf: url),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let features = json["features"] as? [[String: Any]]
    else {
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
        let properties = feature["properties"] as? [String: Any]
      else { continue }

      var inside = false
      if type == "Polygon", let coords = geometry["coordinates"] as? [[[Double]]] {
        inside = pointInPolygonRings(lat: lat, lng: lng, rings: coords)
      } else if type == "MultiPolygon", let polys = geometry["coordinates"] as? [[[[Double]]]] {
        for poly in polys {
          if pointInPolygonRings(lat: lat, lng: lng, rings: poly) {
            inside = true
            break
          }
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
      let xi = ring[i][0]
      let yi = ring[i][1]
      let xj = ring[j][0]
      let yj = ring[j][1]
      if ((yi > lat) != (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
        inside = !inside
      }
      j = i
    }
    return inside
  }

  private func processWithLocalGeoJSON(lat: Double, lng: Double) {
    guard let detectedState = detectStateFromGeoJSON(lat: lat, lng: lng) 
    else {
      print("local_native: no state detected",lat,lng)
      return
    }

      print("local_native: no state detected",detectedState)

          self.checkAndSendToAPI(
              lat: lat,
              lng: lng,
              city: detectedState,
              state: detectedState,
              address: detectedState,
              isBackground: false
            )
    let currentTimeMs = Date().timeIntervalSince1970 * 1000

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

    if detectedState == previousStateName {
      return
    }

    if isTransitionInProgress {
      print("⛔ Transition already in progress — skipping")
      return
    }

    print("🚗 STATE CHANGED: \(previousStateName) → \(detectedState)")

    isTransitionInProgress = true
    stateChangeDetectedTime = 0

    let originState = previousStateName
    let originLat = previousLat
    let originLng = previousLng
    let originCity = previousCity
    let startTime = previousEnterTime

    let isOnline = isInternetAvailable()

    if isOnline {
      let location = CLLocation(latitude: lat, longitude: lng)

      geocoder.reverseGeocodeLocation(location) { [weak self] placemarks, error in
        guard let self = self else { return }
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

        self.previousLat = lat
        self.previousLng = lng
        self.previousCity = city
        self.previousStateName = detectedState
        self.previousEnterTime = currentTimeMs
        self.lastTripProcessedTime = currentTimeMs
        self.isTransitionInProgress = false
        self.saveState()
      }
    } else {
      createTrip(
        originCity: originCity ?? originState,
        originState: originState,
        originLat: originLat,
        originLng: originLng,
        destinationCity: detectedState, // ✅ FIX
        destinationState: detectedState,
        destinationLat: lat,
        destinationLng: lng,
        startDate: startTime,
        endDate: currentTimeMs
      )

      previousLat = lat
      previousLng = lng
      previousCity = detectedState ?? ""
      previousStateName = detectedState
      previousEnterTime = currentTimeMs
      lastTripProcessedTime = currentTimeMs
      isTransitionInProgress = false
      saveState()
    }
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
      isUpdated:false,
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
    monitor.cancel()
    realTimeTimer?.invalidate()
    midnightCheckTimer?.cancel()
    NotificationCenter.default.removeObserver(self)
  }
}
