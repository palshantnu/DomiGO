/**
 * @format
 */
import 'react-native-get-random-values';
import { AppRegistry, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import App from './App';
import { name as appName } from './app.json';

// By default this library raises the system location prompt itself whenever
// getCurrentPosition/watchPosition runs without permission. On Android the
// prompt must only ever follow the prominent disclosure (locationPermission2),
// so never let the library request it on its own.
if (Platform.OS === 'android') {
  Geolocation.setRNConfiguration({ skipPermissionRequests: true });
}

AppRegistry.registerComponent(appName, () => App);
