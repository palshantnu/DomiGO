#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

// identifierForVendor (IDFV) deta hai. Ye naye iPhone par hamesha naya hota hai
// aur iCloud/iTunes backup se restore nahi hota, isliye "Restored from Backup"
// detect karne ke liye use hota hai.
@interface DeviceVendorId : NSObject <RCTBridgeModule>
@end

@implementation DeviceVendorId

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(getVendorId:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // Reboot ke baad phone unlock hone se pehle ye nil ho sakta hai
  NSUUID *vendorId = [[UIDevice currentDevice] identifierForVendor];
  resolve(vendorId ? vendorId.UUIDString : [NSNull null]);
}

@end
