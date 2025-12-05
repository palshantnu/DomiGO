import { NativeModules } from 'react-native';

export const testNativeModule = () => {
  console.log('🔍 Testing native module...');
  console.log('NativeModules:', Object.keys(NativeModules));
  console.log('LocationTracker:', NativeModules.LocationTracker);
  
  if (NativeModules.LocationTracker) {
    console.log('LocationTracker methods:', Object.keys(NativeModules.LocationTracker));
  }
};
