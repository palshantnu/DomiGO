import Foundation
import React

@objc(SLCEventEmitter)
class SLCEventEmitter: RCTEventEmitter {

  override static func requiresMainQueueSetup() -> Bool {
    true
  }

  private static var shared: SLCEventEmitter?

  override init() {
    super.init()
    SLCEventEmitter.shared = self

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(onSLCEvent(_:)),
      name: Notification.Name("SLC_LOCATION"),
      object: nil
    )
  }

  @objc func onSLCEvent(_ notification: Notification) {
    if let info = notification.userInfo {
      sendEvent(withName: "SLC_LOCATION", body: info)
    }
  }

  override func supportedEvents() -> [String] {
    return ["SLC_LOCATION"]
  }
}
