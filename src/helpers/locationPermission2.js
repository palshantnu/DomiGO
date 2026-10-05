import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

// Google Play "Prominent Disclosure" requirement: before the system location
// prompt, the app must explain in-app what location data is collected, that it
// is collected even when the app is closed or not in use, and how it is used,
// and get an explicit affirmative action from the user.
export const DISCLOSURE_TITLE = 'Location Data Disclosure';
export const DISCLOSURE_PARAGRAPHS = [
  'domiGo collects location data to determine which state or country you are in, ' +
    'record your trips, and count your days of residency for your residency reports, ' +
    'even when the app is closed or not in use.',
  'Your location is sent to domiGo servers and to Google Maps services to identify ' +
    'your state/country. It is used only to provide residency tracking features and ' +
    'is not sold or used for advertising.',
  'You can turn off location access at any time in your device Settings.',
];
const DISCLOSURE_MESSAGE = DISCLOSURE_PARAGRAPHS.join('\n\n');

// Once the disclosure or the system prompt is declined, don't ask again until
// the next launch.
let declinedThisSession = false;
let pendingRequest = null;
let settingsAlertShown = false;

const showLocationDisclosure = () =>
  new Promise(resolve => {
    Alert.alert(
      DISCLOSURE_TITLE,
      DISCLOSURE_MESSAGE,
      [
        { text: 'No Thanks', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Agree & Continue', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });

const hasAndroidLocationPermission = () =>
  PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

// Resolves to 'granted', 'denied' (system prompt refused) or 'declined'
// (disclosure refused, now or earlier in this session).
const runAndroidRequest = async disclosureAccepted => {
  try {
    if (await hasAndroidLocationPermission()) return 'granted';
    if (declinedThisSession) return 'declined';

    const accepted = disclosureAccepted || (await showLocationDisclosure());
    if (!accepted) {
      declinedThisSession = true;
      return 'declined';
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    if (result === PermissionsAndroid.RESULTS.GRANTED) return 'granted';

    declinedThisSession = true;
    return 'denied';
  } catch (error) {
    console.log('Location permission error:', error);
    return 'declined';
  }
};

// Callers can overlap (app launch, screen mounts, AppState changes), so share
// one in-flight request instead of stacking dialogs.
const requestAndroidLocation = (disclosureAccepted = false) => {
  if (!pendingRequest) {
    pendingRequest = runAndroidRequest(disclosureAccepted).finally(() => {
      pendingRequest = null;
    });
  }
  return pendingRequest;
};

const requestIosLocation = async () => {
  try {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  } catch (error) {
    return false;
  }
};

export const requestLocationPermission = async () => {
  if (Platform.OS === 'android') {
    return (await requestAndroidLocation()) === 'granted';
  }
  return requestIosLocation();
};

// For PermissionScreen, which shows the disclosure itself: the user has just
// tapped "Agree & Continue" there, so go straight to the system prompt.
export const requestLocationAfterDisclosure = async () => {
  if (Platform.OS === 'android') {
    return (await requestAndroidLocation(true)) === 'granted';
  }
  return requestIosLocation();
};

export const declineLocationDisclosure = () => {
  declinedThisSession = true;
};

const showSettingsAlert = () => {
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
};

export const checkAndRequestLocation = async () => {
  if (Platform.OS === 'android') {
    const status = await requestAndroidLocation();

    // Only offer Settings when the user agreed to the disclosure but the system
    // permission is still denied — never nag after they declined the disclosure.
    if (status === 'denied' && !settingsAlertShown) {
      settingsAlertShown = true;
      showSettingsAlert();
    }

    return status === 'granted';
  }

  const granted = await requestIosLocation();
  if (!granted) showSettingsAlert();
  return granted;
};
