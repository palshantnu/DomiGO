// import { Platform, Alert } from 'react-native';
// import {
//   check,
//   request,
//   PERMISSIONS,
//   RESULTS,
// } from 'react-native-permissions';

// export const checkLocationPermission = async () => {
//   const permission =
//     Platform.OS === 'android'
//       ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
//       : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

//   try {
//     const result = await check(permission);

//     switch (result) {
//       case RESULTS.GRANTED:
//         console.log('Location permission granted');
//         return true;

//       case RESULTS.DENIED:
//         const requestResult = await request(permission);
//         return requestResult === RESULTS.GRANTED;

//       case RESULTS.BLOCKED:
//         Alert.alert(
//           'Permission Required',
//           'Please enable location permission from settings',
//         );
//         return false;

//       default:
//         return false;
//     }
//   } catch (error) {
//     console.log('Permission error:', error);
//     return false;
//   }
// };


import { Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { checkLocationEnabled } from './locationService';

export const handleLocationAccess = async () => {
  const permission =
    Platform.OS === 'android'
      ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

  const permissionStatus = await check(permission);

  if (permissionStatus === RESULTS.GRANTED) {
    return await checkLocationEnabled();
  }

  if (permissionStatus === RESULTS.DENIED) {
    const result = await request(permission);
    if (result === RESULTS.GRANTED) {
      return await checkLocationEnabled();
    }
  }

  return false;
};

