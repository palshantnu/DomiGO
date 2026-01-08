// import { Platform, Alert, Linking } from 'react-native';
// import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

// export const handleLocationAccess = async () => {
//   const permission =
//     Platform.OS === 'android'
//       ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
//       : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

//   // 1️⃣ Permission check
//   let status = await check(permission);

//   if (status === RESULTS.DENIED) {
//     status = await request(permission);
//   }

//   if (status !== RESULTS.GRANTED) {
//     Alert.alert('Permission Required', 'Location permission is required');
//     return false;
//   }

//   // 2️⃣ GPS ON/OFF check
//   if (Platform.OS === 'android') {
//     try {
//       await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
//         interval: 10000,
//         fastInterval: 5000,
//       });
//       console.log('GPS ENABLED');
//       return true;
//     } catch (error) {
//       console.log('GPS NOT ENABLED');
//       return false;
//     }
//   } else {
//     Alert.alert(
//       'Location Disabled',
//       'Please enable location services from settings',
//       [
//         {
//           text: 'Open Settings',
//           onPress: () => Linking.openSettings(),
//         },
//         { text: 'Cancel', style: 'cancel' },
//       ]
//     );
//     return false;
//   }
// };
import { Platform, Alert, Linking } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

export const ensureLocationReady = async () => {
  const permission =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

  // 1️⃣ Permission check
  let status = await check(permission);

  if (status === RESULTS.DENIED) {
    status = await request(permission);
  }

  if (status !== RESULTS.GRANTED) {
    Alert.alert('Permission Required');
    return false;
  }

  // 2️⃣ GPS enable (ANDROID ONLY)
  if (Platform.OS === 'android') {
    try {
      await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });
      console.log('✅ GPS ENABLED');
      return true;
    } catch (e) {
      console.log('❌ GPS STILL OFF');
      return false;
    }
  }

  // 3️⃣ iOS
  Alert.alert(
    'Location Disabled',
    'Please enable GPS from settings',
    [{ text: 'Open Settings', onPress: () => Linking.openSettings() }]
  );
  return false;
};
