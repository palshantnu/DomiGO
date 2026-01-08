import { Platform, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

export const checkLocationEnabled = async () => {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      () => {
        console.log('GPS is ON');
        resolve(true);
      },
      async (error) => {
        console.log('Location error:', error);

        if (Platform.OS === 'android') {
          try {
            await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
              interval: 10000,
              fastInterval: 5000,
            });
            resolve(true);
          } catch (err) {
            console.log('User denied GPS enable');
            resolve(false);
          }
        } else {
          Alert.alert(
            'Location Disabled',
            'Please enable location services from settings',
          );
          resolve(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000,
      }
    );
  });
};
