import { Platform, Alert, Linking } from 'react-native';
import RNAndroidLocationEnabler from 'react-native-android-location-enabler';

export const openLocationSettings = async () => {
  if (Platform.OS === 'android') {
    try {
      await RNAndroidLocationEnabler.promptForEnableLocationIfNeeded({
        interval: 10000,
        fastInterval: 5000,
      });
    } catch {
      console.log('User cancelled GPS enable')
      Linking.openSettings()
      ;
    }
  } else {
    Alert.alert(
      'Enable Location',
      'Please enable location services',
      [
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }
};
