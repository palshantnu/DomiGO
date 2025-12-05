#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(LocationTracker, RCTEventEmitter)

RCT_EXTERN_METHOD(setConfig:(NSDictionary *)config)
RCT_EXTERN_METHOD(startLocationTracking)
RCT_EXTERN_METHOD(stopLocationTracking)
RCT_EXTERN_METHOD(isTracking:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject)

@end
