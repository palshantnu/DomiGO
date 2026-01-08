import { Platform, Alert, Linking } from 'react-native';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

export const forceEnableGPS = async () => {
  if (Platform.OS === 'android') {
    try {
      await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });
      return true;
    } catch (e) {
      Alert.alert(
        'GPS Required',
        'Please turn ON location to continue using this app'
      );
      return false;
    }
  } else {
    Alert.alert(
      'Location Required',
      'Please enable location services',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    return false;
  }
};
