import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import CoreLocation

@main
class AppDelegate: UIResponder, UIApplicationDelegate, CLLocationManagerDelegate {
  var window: UIWindow? 

  var reactNativeDelegate: ReactNativeDelegate? 
  var reactNativeFactory: RCTReactNativeFactory?

 let locationManager = CLLocationManager()

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

     locationManager.delegate = self
    locationManager.requestAlwaysAuthorization()
    locationManager.startMonitoringSignificantLocationChanges()

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
  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
      guard let loc = locations.last else { return }

      let event: [String: Any] = [
        "latitude": loc.coordinate.latitude,
        "longitude": loc.coordinate.longitude
      ]


      NotificationCenter.default.post(
        name: NSNotification.Name("SLC_LOCATION"),
        object: nil,
        userInfo: event
      )
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
