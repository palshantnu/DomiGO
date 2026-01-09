import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs access to your location',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.log('Location permission error:', error);
      return false;
    }
  }

  // iOS
  try {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

export const checkAndRequestLocation = async () => {
  const granted = await requestLocationPermission();

  if (!granted) {
    Alert.alert(
      'Location Required',
      'Location permission is required for proper app functionality.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings(),
        },
      ],
    );
  }

  return granted;
};
