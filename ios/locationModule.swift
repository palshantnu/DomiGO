import Foundation
import CoreLocation
import React

@objc(LocationTracker)
class LocationTracker: RCTEventEmitter, CLLocationManagerDelegate {
  
  private var locationManager: CLLocationManager!
  private var isTracking = false
  private var config: [String: Any] = [:]
  private var lastState: String = ""
  private var lastApiTime: TimeInterval = 0
  private let FOUR_HOURS_MS: TimeInterval = 4 * 60 * 60 * 1000 // 4 hours in milliseconds
  
  override init() {
    super.init()
    print("📍 LocationTracker initialized")
    setupLocationManager()
  }
  
  private func setupLocationManager() {
    locationManager = CLLocationManager()
    locationManager.delegate = self
    locationManager.desiredAccuracy = kCLLocationAccuracyBest
    locationManager.distanceFilter = 10 // 10 meters
    locationManager.allowsBackgroundLocationUpdates = true
    locationManager.pausesLocationUpdatesAutomatically = false
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
      "onLocationStatus"
    ]
  }
  
  // MARK: - React Native Methods
  
  @objc
  func setConfig(_ config: [String: Any]) {
    print("📍 setConfig called with: \(config)")
    self.config = config
    
    // ✅ ADDED: Fetch last state when config is set
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
  
  // ✅ ADDED: Fetch last state from API
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
        self.sendEvent(withName: "onLocationError", body: ["error": "Failed to fetch last state: \(error.localizedDescription)"])
        return
      }
      
      guard let data = data else {
        print("❌ No data received for last state")
        self.sendEvent(withName: "onLocationError", body: ["error": "No data received for last state"])
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
                
                // Send event to JavaScript with the fetched state
                self.sendEvent(withName: "onLocationStatus", body: [
                  "status": "last_state_loaded",
                  "lastState": state,
                  "lastApiTime": self.lastApiTime
                ])
              }
            }
          } else {
            let errorMessage = json["message"] as? String ?? "Unknown API error"
            print("❌ API returned unsuccessful response: \(errorMessage)")
            self.sendEvent(withName: "onLocationError", body: ["error": "Last state API error: \(errorMessage)"])
          }
        }
      } catch {
        print("❌ Error parsing last state response: \(error.localizedDescription)")
        self.sendEvent(withName: "onLocationError", body: ["error": "Error parsing last state: \(error.localizedDescription)"])
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
    locationManager.startUpdatingLocation()
    isTracking = true
    sendEvent(withName: "onLocationStatus", body: ["status": "started"])
    print("🚀 Location tracking started")
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
      "provider": "ios"
    ]
    
    print("📍 Location update: \(location.coordinate.latitude), \(location.coordinate.longitude)")
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
    // Reverse geocode to get address information
    reverseGeocode(location)
  }
  
  private func reverseGeocode(_ location: CLLocation) {
    let geocoder = CLGeocoder()
    
    geocoder.reverseGeocodeLocation(location) { [weak self] (placemarks, error) in
      guard let self = self else { return }
      
      if let error = error {
        print("❌ Reverse geocoding failed: \(error.localizedDescription)")
        self.sendEvent(withName: "onLocationError", body: ["error": "Reverse geocoding failed: \(error.localizedDescription)"])
        return
      }
      
      if let placemark = placemarks?.first {
        let city = placemark.locality ?? placemark.subAdministrativeArea ?? ""
        let state = placemark.administrativeArea ?? ""
        let fullAddress = self.formatAddress(from: placemark)
        
        print("🏠 Reverse geocode result: City=\(city), State=\(state)")
        
        // Send address info to JS
        let addressData: [String: Any] = [
          "latitude": location.coordinate.latitude,
          "longitude": location.coordinate.longitude,
          "city": city,
          "state": state,
          "fullAddress": fullAddress,
          "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        self.sendEvent(withName: "onAddressResolved", body: addressData)
        
        // ✅ CHECK 4-HOUR AND STATE CHANGE LOGIC
        self.checkAndSendToAPI(
          lat: location.coordinate.latitude,
          lng: location.coordinate.longitude,
          city: city,
          state: state,
          address: fullAddress
        )
      }
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
  
  // ✅ 4 HOUR AND STATE CHANGE CHECK
  private func checkAndSendToAPI(lat: Double, lng: Double, city: String, state: String, address: String) {
    let currentTime = Date().timeIntervalSince1970 * 1000
    let timeDifference = currentTime - lastApiTime
    
    // Check conditions: state changed OR 4 hours passed
    let stateChanged = state != lastState
    let timePassed = timeDifference >= FOUR_HOURS_MS
    
    print("⏰ Time difference: \(timeDifference / 1000 / 60) minutes")
    print("🏛️ State changed: \(stateChanged) (last: '\(lastState)', current: '\(state)')")
    print("🕒 4 hours passed: \(timePassed)")
    
    // Only send to API if state changed OR 4 hours passed
    if stateChanged || timePassed {
      print("✅ Conditions met - Sending to API")
      sendToDomigoAPI(lat: lat, lng: lng, city: city, state: state, address: address)
      
      // Update tracking values
      lastState = state
      lastApiTime = currentTime
    } else {
      print("⏳ No API update required (No state change & 4hr not passed)")
    }
  }
  
  private func sendToDomigoAPI(lat: Double, lng: Double, city: String, state: String, address: String) {
    guard let domigoToken = config["domigoToken"] as? String,
          let apiUrl = config["apiUrl"] as? String else {
      print("❌ Domigo token or API URL not configured")
      sendEvent(withName: "onLocationError", body: ["error": "Domigo token or API URL not configured"])
      return
    }
    
    let body: [String: Any] = [
      "latitude": lat,
      "longitude": lng,
      "state": state,
      "city": city,
      "address": address
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
      sendEvent(withName: "onLocationError", body: ["error": "Error creating request body: \(error.localizedDescription)"])
      return
    }
    
    let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
      guard let self = self else { return }
      
      if let error = error {
        print("❌ API call failed: \(error.localizedDescription)")
        self.sendEvent(withName: "onLocationError", body: ["error": "API call failed: \(error.localizedDescription)"])
        return
      }
      
      if let httpResponse = response as? HTTPURLResponse {
        if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
          print("✅ Location sent to Domigo API successfully")
          
          self.sendEvent(withName: "onApiSuccess", body: [
            "message": "Location sent to API successfully",
            "state": state,
            "city": city,
            "timestamp": Date().timeIntervalSince1970 * 1000
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
}