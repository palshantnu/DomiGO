import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import CoreLocation
import BackgroundTasks
import UserNotifications
import Firebase

@main
class AppDelegate: UIResponder, UIApplicationDelegate, CLLocationManagerDelegate, UNUserNotificationCenterDelegate {
    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?
    
    let locationManager = CLLocationManager()
    var backgroundTask: UIBackgroundTaskIdentifier = .invalid
    static var shared: AppDelegate?
    
    // Background task identifiers
    private let locationRefreshIdentifier = "com.domigo.location.refresh"
    private let locationProcessingIdentifier = "com.domigo.location.processing"
    private let missingDayIdentifier = "com.domigo.app.missingday" // ✅ Add this
    
    // Track app state
    private var isAppInForeground = true
    private var backgroundTaskTimer: Timer? // ✅ For better background task management
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        
        AppDelegate.shared = self
        
        // ✅ 1. REGISTER BACKGROUND TASKS FIRST - CRITICAL!
        registerBackgroundTasks()
        
        // 2. Setup notification center
        setupNotificationCenter()
        
        // 3. Configure Firebase
        FirebaseApp.configure()
        
        // 4. Initialize location manager
        setupLocationManager()
        
        // Check if app was launched by location update
        if let _ = launchOptions?[.location] as? CLLocation {
            print("📍 App launched due to location update in kill mode")
            
            // Mark that app was launched by location
            UserDefaults.standard.set(true, forKey: "LocationTracker_appLaunchedByLocation")
            UserDefaults.standard.synchronize()
            
            // Start location updates immediately
            locationManager.startUpdatingLocation()
            locationManager.startMonitoringSignificantLocationChanges()
            
            // Send silent notification
            sendLaunchNotification()
            
            // Notify React Native module
            NotificationCenter.default.post(
                name: NSNotification.Name("AppLaunchedByLocation"),
                object: nil
            )
        }
        
        // Check if launched by notification
        if let notificationOption = launchOptions?[.remoteNotification] {
            print("📱 App launched by notification")
            handleNotificationLaunch(userInfo: notificationOption as? [String: Any])
        }
        
        // Initialize React Native
        let delegate = ReactNativeDelegate()
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()
        
        reactNativeDelegate = delegate
        reactNativeFactory = factory
        
        window = UIWindow(frame: UIScreen.main.bounds)
        
        factory.startReactNative(
            withModuleName: "domiGo",
            in: window,
            launchOptions: launchOptions
        )
        
        return true
    }
    
    private func setupNotificationCenter() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        
        // Request notification permissions
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        center.requestAuthorization(options: options) { granted, error in
            if granted {
                print("✅ Notification permission granted")
                DispatchQueue.main.async {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            } else if let error = error {
                print("❌ Notification permission error: \(error)")
            }
        }
    }
    
    private func sendLaunchNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Location Update"
        content.body = "Processing background location update"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "app_launched_by_location": true,
            "timestamp": Date().timeIntervalSince1970 * 1000,
            "source": "kill_mode_launch"
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "kill_mode_launch_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send launch notification: \(error.localizedDescription)")
            } else {
                print("📱 Launch notification sent for kill mode")
            }
        }
    }
    
    private func sendSilentNotificationForLocation(lat: Double, lng: Double, accuracy: Double) {
        let content = UNMutableNotificationContent()
        content.title = "Location Update"
        content.body = "Processing background location"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "latitude": lat,
            "longitude": lng,
            "accuracy": accuracy,
            "timestamp": Date().timeIntervalSince1970 * 1000,
            "silent_notification": true,
            "source": "location_tracker",
            "app_state": isAppInForeground ? "foreground" : "background"
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "location_update_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send silent notification: \(error.localizedDescription)")
            } else {
                print("📱 Silent notification sent for location update")
            }
        }
    }
    
    private func handleNotificationLaunch(userInfo: [String: Any]?) {
        guard let userInfo = userInfo else { return }
        
        if let silentNotification = userInfo["silent_notification"] as? Bool,
           silentNotification {
            
            UserDefaults.standard.set(true, forKey: "LocationTracker_appLaunchedByLocation")
            UserDefaults.standard.synchronize()
            
            NotificationCenter.default.post(
                name: NSNotification.Name("AppLaunchedByLocation"),
                object: userInfo
            )
        }
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 50
        
        // Check current authorization status without blocking
        let status = locationManager.authorizationStatus
        print("📍 Current authorization status: \(status.rawValue)")
        
        // Request permission if needed
        if status == .notDetermined {
            locationManager.requestAlwaysAuthorization()
        }
        
        // Start monitoring significant location changes for kill mode
        locationManager.startMonitoringSignificantLocationChanges()
    }
    
    private func registerBackgroundTasks() {
        // ✅ Cancel any existing tasks first
        BGTaskScheduler.shared.cancelAllTaskRequests()
        
        // Register background refresh task
        let refreshRegistered = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: locationRefreshIdentifier, 
            using: nil
        ) { task in
            self.handleAppRefresh(task: task as! BGAppRefreshTask)
        }
        print("✅ Background refresh task registered: \(refreshRegistered)")
        
        // Register background processing task
        let processingRegistered = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: locationProcessingIdentifier, 
            using: nil
        ) { task in
            self.handleLocationProcessing(task: task as! BGProcessingTask)
        }
        print("✅ Background processing task registered: \(processingRegistered)")
        
        // ✅ Register missing day task (for LocationTracker)
        let missingDayRegistered = BGTaskScheduler.shared.register(
            forTaskWithIdentifier: missingDayIdentifier,
            using: nil
        ) { task in
            self.handleMissingDayTask(task: task as! BGProcessingTask)
        }
        print("✅ Missing day task registered: \(missingDayRegistered)")
        
        // Schedule initial background tasks
        scheduleAppRefresh()
        scheduleLocationProcessing()
        scheduleMissingDayCheck()
    }
    
    // ✅ Add handler for missing day task
    private func handleMissingDayTask(task: BGProcessingTask) {
        print("🌙 Background missing day task triggered")
        
        // Schedule next check
        scheduleMissingDayCheck()
        
        // Post notification for LocationTracker to handle
        NotificationCenter.default.post(
            name: NSNotification.Name("PerformMissingDayCheck"),
            object: nil
        )
        
        task.expirationHandler = {
            print("⏰ Missing day task expired")
        }
        
        // Give time for processing
        DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
            task.setTaskCompleted(success: true)
        }
    }
    
    private func handleAppRefresh(task: BGAppRefreshTask) {
        print("🔄 Background app refresh triggered")
        
        // Schedule next refresh
        scheduleAppRefresh()
        
        // Start location updates
        locationManager.startUpdatingLocation()
        
        // Send notification about background refresh
        if !isAppInForeground {
            sendBackgroundRefreshNotification()
        }
        
        // Set expiration handler
        task.expirationHandler = {
            print("⚠️ Background refresh task expired")
            self.locationManager.stopUpdatingLocation()
            task.setTaskCompleted(success: false)
        }
        
        // Give some time for location update (max 30 seconds for refresh tasks)
        DispatchQueue.main.asyncAfter(deadline: .now() + 25) {
            self.locationManager.stopUpdatingLocation()
            print("✅ Background refresh task completed")
            task.setTaskCompleted(success: true)
        }
    }
    
    private func sendBackgroundRefreshNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Background Update"
        content.body = "Processing location in background"
        content.sound = .default
        content.badge = 1
        
        content.userInfo = [
            "background_refresh": true,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(
            identifier: "background_refresh_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send background refresh notification: \(error)")
            }
        }
    }
    
    private func handleLocationProcessing(task: BGProcessingTask) {
        print("🔄 Background location processing triggered")
        
        // Schedule next processing
        scheduleLocationProcessing()
        
        // Check for pending locations
        checkPendingBackgroundLocations()
        
        // Set expiration handler
        task.expirationHandler = {
            print("⚠️ Background processing task expired")
            task.setTaskCompleted(success: false)
        }
        
        // Complete task after processing
        DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
            print("✅ Background processing task completed")
            task.setTaskCompleted(success: true)
        }
    }
    
    private func scheduleAppRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: locationRefreshIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60) // 15 minutes minimum
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Background refresh task scheduled for 15 minutes")
        } catch {
            print("❌ Could not schedule app refresh: \(error.localizedDescription)")
        }
    }
    
    private func scheduleLocationProcessing() {
        let request = BGProcessingTaskRequest(identifier: locationProcessingIdentifier)
        request.requiresNetworkConnectivity = true
        request.requiresExternalPower = false
        request.earliestBeginDate = Date(timeIntervalSinceNow: 30 * 60) // 30 minutes minimum
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Background processing task scheduled for 30 minutes")
        } catch {
            print("❌ Could not schedule processing task: \(error.localizedDescription)")
        }
    }
    
    // ✅ Add missing day scheduling
    private func scheduleMissingDayCheck() {
        let calendar = Calendar.current
        let now = Date()
        
        // Schedule for 12:35 PM
        var components = calendar.dateComponents([.year, .month, .day], from: now)
        components.hour = 12
        components.minute = 35
        components.second = 0
        
        guard let scheduledTime = calendar.date(from: components) else { return }
        
        let nextRunTime = now < scheduledTime ? scheduledTime : calendar.date(byAdding: .day, value: 1, to: scheduledTime)!
        
        let request = BGProcessingTaskRequest(identifier: missingDayIdentifier)
        request.earliestBeginDate = nextRunTime
        request.requiresNetworkConnectivity = true
        
        do {
            try BGTaskScheduler.shared.submit(request)
            print("✅ Missing day check scheduled for \(nextRunTime)")
        } catch {
            print("❌ Could not schedule missing day check: \(error)")
        }
    }
    
    private func checkPendingBackgroundLocations() {
        // Check for any saved background locations that need processing
        if let locationData = UserDefaults.standard.dictionary(forKey: "LatestBackgroundLocation") as? [String: Any] {
            print("📍 Found pending location to process")
            
            // Post notification to process it
            NotificationCenter.default.post(
                name: NSNotification.Name("NewBackgroundLocation"),
                object: locationData
            )
            
            // Clear the saved location
            UserDefaults.standard.removeObject(forKey: "LatestBackgroundLocation")
            UserDefaults.standard.synchronize()
        }
    }
    
    // MARK: - App State Methods
    
    func applicationDidBecomeActive(_ application: UIApplication) {
        print("📱 App became active")
        isAppInForeground = true
        
        // Clear badge
        application.applicationIconBadgeNumber = 0
        
        // Clear delivered notifications
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        
        // Cancel background task timer
        backgroundTaskTimer?.invalidate()
        backgroundTaskTimer = nil
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {
        print("📱 App entered background")
        isAppInForeground = false
        
        // End any existing background task
        if backgroundTask != .invalid {
            application.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
        
        // Start new background task
        backgroundTask = application.beginBackgroundTask(withName: "LocationTracking") {
            [weak self] in
            // Clean up if task expires
            self?.backgroundTaskTimer?.invalidate()
            self?.backgroundTaskTimer = nil
            if let task = self?.backgroundTask {
                application.endBackgroundTask(task)
                self?.backgroundTask = .invalid
            }
            print("⚠️ Background task expired")
        }
        
        // ✅ Use timer instead of while loop for better performance
        backgroundTaskTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            // Check if we still have background time
            if application.backgroundTimeRemaining < 10 {
                print("⚠️ Background time running out: \(application.backgroundTimeRemaining) seconds")
            }
            
            // Your background work here
        }
        
        // Schedule background tasks (only if not already scheduled)
        scheduleAppRefresh()
        scheduleLocationProcessing()
        scheduleMissingDayCheck()
        
        // Continue location updates in background
        locationManager.startUpdatingLocation()
        locationManager.startMonitoringSignificantLocationChanges()
        
        print("⏳ Background time remaining: \(application.backgroundTimeRemaining) seconds")
    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
        print("📱 App entered foreground")
        isAppInForeground = true
        
        // End background task
        if backgroundTask != .invalid {
            application.endBackgroundTask(backgroundTask)
            backgroundTask = .invalid
        }
        
        // Cancel background task timer
        backgroundTaskTimer?.invalidate()
        backgroundTaskTimer = nil
        
        // Don't cancel all background tasks - they should continue
        // BGTaskScheduler.shared.cancelAllTaskRequests() // ❌ Remove this line
        
        // Restart location updates if we have permission
        let status = locationManager.authorizationStatus
        if status == .authorizedAlways || status == .authorizedWhenInUse {
            locationManager.startUpdatingLocation()
            print("📍 Restarted location updates")
        } else {
            print("⚠️ No location permission, not restarting updates")
        }
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        print("⚠️ App will terminate - saving state")
        
        // Send termination notification
        sendTerminationNotification()
        
        // Save any pending location data
        if let defaults = UserDefaults(suiteName: "group.com.domigo.app") {
            defaults.synchronize()
        }
        UserDefaults.standard.synchronize()
        
        // Ensure location manager stops
        locationManager.stopUpdatingLocation()
        print("📍 Stopped location updates on termination")
    }
    
    private func sendTerminationNotification() {
        let content = UNMutableNotificationContent()
        content.title = "App Terminated"
        content.body = "Location tracking will continue in background"
        content.sound = .default
        
        content.userInfo = [
            "app_terminated": true,
            "timestamp": Date().timeIntervalSince1970 * 1000
        ]
        
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
        let request = UNNotificationRequest(
            identifier: "app_termination_\(UUID().uuidString)",
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("❌ Failed to send termination notification: \(error)")
            }
        }
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              willPresent notification: UNNotification,
                              withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo
        
        // Check if it's from location tracker
        if let source = userInfo["source"] as? String,
           source == "location_tracker" {
            // Show banner and sound for location notifications
            completionHandler([.banner, .sound])
        } else {
            completionHandler([.banner, .sound, .badge])
        }
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter,
                              didReceive response: UNNotificationResponse,
                              withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        
        print("📱 Notification tapped: \(userInfo)")
        
        // Forward to location tracker if it's a location notification
        if let source = userInfo["source"] as? String,
           source == "location_tracker" {
            
            if let lat = userInfo["latitude"] as? Double,
               let lng = userInfo["longitude"] as? Double {
                
                let locationData: [String: Any] = [
                    "latitude": lat,
                    "longitude": lng,
                    "accuracy": userInfo["accuracy"] as? Double ?? 100,
                    "timestamp": userInfo["timestamp"] as? TimeInterval ?? Date().timeIntervalSince1970 * 1000,
                    "from_notification": true
                ]
                
                // Post to location tracker
                NotificationCenter.default.post(
                    name: NSNotification.Name("NewBackgroundLocation"),
                    object: locationData
                )
            }
        }
        
        completionHandler()
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        
        let accuracy = location.horizontalAccuracy
        print("📍 Location update: \(location.coordinate.latitude), \(location.coordinate.longitude), accuracy: \(accuracy)m, App in foreground: \(isAppInForeground)")
        
        // Only process if accuracy is good
        if accuracy > 0 && accuracy < 100 {
            // Send silent notification for kill mode
            if !isAppInForeground {
                sendSilentNotificationForLocation(
                    lat: location.coordinate.latitude,
                    lng: location.coordinate.longitude,
                    accuracy: accuracy
                )
            }
            
            // Save location to shared container for module to access
            let locationData: [String: Any] = [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "accuracy": accuracy,
                "timestamp": Date().timeIntervalSince1970 * 1000,
                "app_foreground": isAppInForeground
            ]
            
            // Save to UserDefaults in shared suite (for app groups)
            if let defaults = UserDefaults(suiteName: "group.com.domigo.app") {
                defaults.set(locationData, forKey: "LatestBackgroundLocation")
                defaults.synchronize()
                print("💾 Saved to shared defaults")
            }
            
            // Save to standard UserDefaults as backup
            UserDefaults.standard.set(locationData, forKey: "LatestBackgroundLocation")
            UserDefaults.standard.synchronize()
            
            // Post notification for active app
            NotificationCenter.default.post(
                name: NSNotification.Name("NewBackgroundLocation"),
                object: locationData
            )
            
            // Post SLC notification for backward compatibility
            NotificationCenter.default.post(
                name: NSNotification.Name("SLC_LOCATION"),
                object: nil,
                userInfo: locationData
            )
            
            // Stop updates to save battery if we got good accuracy
            if accuracy < 50 {
                manager.stopUpdatingLocation()
                print("⏸️ Stopped location updates (good accuracy achieved)")
            }
        } else {
            print("⚠️ Ignoring location due to poor accuracy: \(accuracy)m")
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("❌ Location error: \(error.localizedDescription)")
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        print("📍 Location authorization changed: \(status.rawValue)")
        
        switch status {
        case .authorizedAlways:
            print("✅ Location permission: Always")
            locationManager.startUpdatingLocation()
            locationManager.startMonitoringSignificantLocationChanges()
        case .authorizedWhenInUse:
            print("⚠️ Location permission: When In Use Only")
            locationManager.startUpdatingLocation()
        case .denied, .restricted:
            print("❌ Location permission denied or restricted")
        case .notDetermined:
            print("❓ Location permission not determined")
        @unknown default:
            print("❓ Unknown authorization status")
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFinishDeferredUpdatesWithError error: Error?) {
        if let error = error {
            print("❌ Deferred updates error: \(error.localizedDescription)")
        } else {
            print("✅ Deferred updates completed")
        }
    }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }
    
    override func bundleURL() -> URL? {
#if DEBUG
        RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
        Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
    }
}