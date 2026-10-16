import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Background ("Allow all the time") access. Android only grants it in a second
// step after foreground access, and on Android 11+ the user has to pick it on
// the system settings page, so it gets its own disclosure right before it.
const BACKGROUND_DISCLOSURE_TITLE = 'Allow Location All The Time';
const BACKGROUND_DISCLOSURE_MESSAGE =
  'domiGo collects location data to detect your trips and count your days of ' +
  'residency even when the app is closed or not in use.\n\n' +
  'To enable this, choose "Allow all the time" on the next screen.';
const BACKGROUND_DECLINED_KEY = 'DOMIGO_BG_LOCATION_DECLINED';

let backgroundDeclinedThisSession = false;
let pendingBackgroundRequest = null;

const showBackgroundDisclosure = () =>
  new Promise(resolve => {
    Alert.alert(
      BACKGROUND_DISCLOSURE_TITLE,
      BACKGROUND_DISCLOSURE_MESSAGE,
      [
        { text: 'No Thanks', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ],
      { cancelable: false },
    );
  });

const runAndroidBackgroundRequest = async () => {
  try {
    if (Platform.Version < 29) return true;

    const permission = PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION;
    if (await PermissionsAndroid.check(permission)) return true;
    if (backgroundDeclinedThisSession) return false;
    if ((await AsyncStorage.getItem(BACKGROUND_DECLINED_KEY)) === '1') return false;

    if (!(await showBackgroundDisclosure())) {
      backgroundDeclinedThisSession = true;
      await AsyncStorage.setItem(BACKGROUND_DECLINED_KEY, '1');
      return false;
    }

    const result = await PermissionsAndroid.request(permission);
    if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

    backgroundDeclinedThisSession = true;
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      await AsyncStorage.setItem(BACKGROUND_DECLINED_KEY, '1');
    }
    return false;
  } catch (error) {
    console.log('Background location permission error:', error);
    return false;
  }
};

// Only call once foreground location is granted.
const requestAndroidBackgroundLocation = () => {
  if (!pendingBackgroundRequest) {
    pendingBackgroundRequest = runAndroidBackgroundRequest().finally(() => {
      pendingBackgroundRequest = null;
    });
  }
  return pendingBackgroundRequest;
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
    const granted = (await requestAndroidLocation(true)) === 'granted';
    if (granted) await requestAndroidBackgroundLocation();
    return granted;
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

    if (status === 'granted') await requestAndroidBackgroundLocation();

    return status === 'granted';
  }

  const granted = await requestIosLocation();
  if (!granted) showSettingsAlert();
  return granted;
};
