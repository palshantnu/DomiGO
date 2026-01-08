// import { Platform } from 'react-native';
// import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

// export const isGPSOn = async () => {
//   if (Platform.OS === 'android') {
//     try {
//       await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
//         interval: 10000,
//         fastInterval: 5000,
//         dialogTitle: '', // ❌ no dialog
//       });
//       return true; 
//     } catch {
//       return false;
//     }
//   }
//   return true; // iOS handled via settings
// };
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const checkGPSStatus = async () => {
  if (Platform.OS === 'android') {
    const enabled = await DeviceInfo.isLocationEnabled();
    return enabled; // ✅ true / false (REAL)
  }
  return true; // iOS handled via permissions
};
