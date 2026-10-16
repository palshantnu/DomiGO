import { Alert, NativeModules, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setActiveDeviceService } from '../services/Services';
import { CustomToast } from './CommonHelpers';

// Is phone ki ID jo login/"Use this device" ke time save hui thi.
// AsyncStorage backup ke saath naye phone par restore ho jata hai, jabki
// getDeviceId() naye phone par nayi ID deta hai. Dono alag = backup se restore.
const SAVED_DEVICE_ID_KEY = 'DOMIGO_SAVED_DEVICE_ID';

let checkedThisSession = false;

// Android: ANDROID_ID, iOS: identifierForVendor (ios/DeviceVendorId.m).
// Dono har device par alag hote hain aur backup se restore nahi hote.
// DeviceInfo.getUniqueId() iOS par NSUserDefaults me cache hota hai jo
// restore ho jata hai, isliye wo yahan kaam nahi karta.
export const getDeviceId = async () => {
  try {
    const id = Platform.OS === 'android'
      ? await DeviceInfo.getAndroidId()
      : await NativeModules.DeviceVendorId?.getVendorId();
    return id && id !== 'unknown' ? id : null;
  } catch (e) {
    console.log('getDeviceId error', e);
    return null;
  }
};

// Login/Signup payload ke liye. Asli ID na mile to bhi API ko kuch bhejna hai.
export const getDeviceIdForAuth = async () => {
  const id = await getDeviceId();
  if (id) return id;
  try {
    return await DeviceInfo.getUniqueId();
  } catch (e) {
    return 'unknown';
  }
};

const saveDeviceId = async (id) => {
  if (!id) return;
  try {
    await AsyncStorage.setItem(SAVED_DEVICE_ID_KEY, id);
  } catch (e) {
    console.log('saveDeviceId error', e);
  }
};

// Login/Signup successful hone par call karein (backend login par isi device ko
// active maanta hai).
export const saveCurrentDeviceId = async () => {
  saveDeviceId(await getDeviceId());
};

const isApiSuccess = (response) => response?.data?.success !== false;

const makeThisDeviceActive = async (deviceId) => {
  try {
    const response = await setActiveDeviceService(deviceId);
    if (!isApiSuccess(response)) {
      throw new Error(response?.data?.message);
    }
    await saveDeviceId(deviceId);
    Alert.alert(
      'Success',
      'Your device identifier has been successfully updated. This is now your active device.',
      [{ text: 'OK' }],
    );
  } catch (e) {
    console.log('makeThisDeviceActive error', e);
    // Save nahi kiya, isliye agli baar app khulne par popup dobara aayega
    CustomToast.show(
      e?.response?.data?.message || e?.message || 'Unable to update your device. Please try again.',
    );
  }
};

const showRestoredPrompt = (deviceId) => {
  Alert.alert(
    'Restored from Backup',
    'We detected that you have restored from backup. Would you like to make this your active device?',
    [
      { text: 'Use this device', onPress: () => makeThisDeviceActive(deviceId) },
      // User ne purana device chuna, is phone par dobara na poochein
      { text: 'Keep old device', onPress: () => saveDeviceId(deviceId) },
    ],
    { cancelable: false },
  );
};

// Logged-in user ke liye app start par ek baar call karein.
export const checkRestoredFromBackup = async () => {
  if (checkedThisSession) return;
  checkedThisSession = true;

  const currentId = await getDeviceId();
  if (!currentId) return;

  let savedId = null;
  try {
    savedId = await AsyncStorage.getItem(SAVED_DEVICE_ID_KEY);
  } catch (e) {
    return;
  }

  if (savedId === currentId) return;

  if (!savedId) {
    // Is feature se pehle ke logged-in users: chupchaap isi device ko register
    // karo, popup nahi. Fail hone par agli baar phir try hoga.
    try {
      const response = await setActiveDeviceService(currentId);
      if (isApiSuccess(response)) await saveDeviceId(currentId);
    } catch (e) {
      console.log('silent active-device sync error', e);
    }
    return;
  }

  showRestoredPrompt(currentId);
};
