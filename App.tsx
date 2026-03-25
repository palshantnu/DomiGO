import React, { useEffect } from 'react';
import {
  AppState,
  NativeEventEmitter,
  NativeModules,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
// import SplashScreen from 'react-native-splash-screen';
import RootNavigator from './src/navigation';
import colors from './src/theme/colors';
import { store, persistor } from './src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DomigoTracker from './src/helpers/MainTracker';
import { navigationRef } from './src/helpers/NavigationService';
// import { checkLocationPermission, handleLocationAccess } from './src/helpers/locationPermission';
// import { ensureLocationReady } from './src/helpers/locationHandler';
import { checkAndRequestLocation } from './src/helpers/locationPermission2';
import OfflineQueueService from './src/services/OfflineQueueService';
import axiosinstance from './src/axios/axiosinstance';
import { GEOFENCING_MODE } from './src/config/featureFlags';
import messaging from '@react-native-firebase/messaging';

import { PermissionsAndroid, Platform } from 'react-native';

const offlineSendFn = async (event) => {
  const payload = new FormData();
  const p = event.payload || {};
  payload.append('kind', p.kind || 'trip');
  payload.append('date', p.date || new Date().toLocaleDateString("en-CA").split('T')[0]);
  payload.append('typeOfDayId', '1');
  payload.append('isCommissionDay', 'false');
  payload.append('isRemoteWork', 'false');
  payload.append('remoteHours', '0');
  payload.append('isTravelling', 'true');
  payload.append('tripTypeId', '1');
  payload.append('tripModeId', '1');
  payload.append('confirmationNo', '');
  payload.append('vendor', '');
  payload.append('hasProof', 'false');
  payload.append('proofType', 'other');
  payload.append('notes', '');
  payload.append('creationType', p.creationType || 'automatic');
  payload.append('remoteLocation', '');
  payload.append('attachments', '[]');
  payload.append('originState', p.originState || event.from || '');
  payload.append('originLat', String(p.originLat || ''));
  payload.append('originLng', String(p.originLng || ''));
  payload.append('destinationState', p.destinationState || event.to || '');
  payload.append('destinationLat', String(p.destinationLat || ''));
  payload.append('destinationLng', String(p.destinationLng || ''));
  payload.append('startDate', p.startDate || '');
  payload.append('endDate', p.endDate || '');
  await axiosinstance.post('trip-days', payload, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

function scheduleMidnight() {
  const now = new Date();
  const midnight = new Date();

  midnight.setHours(24, 0, 5, 0); // next day 00:00:05

  const delay = midnight - now;

  setTimeout(() => {
    DomigoTracker.createMissingDay();
    scheduleMidnight(); // next day again schedule
  }, delay);
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
  }
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // useEffect(() => {
  //   // Hide splash screen after loading
  //   setTimeout(() => {
  //     SplashScreen.hide();
  //   }, 2000); // optional delay for demo
  // }, []);
  // useEffect(()=>{
  //   testNativeModule()
  // },[])

    useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      checkAndRequestLocation();
    }, 1200);

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        checkAndRequestLocation();
      }
    });

    return () => subscription.remove();
  }, []);


  useEffect(() => {
    requestPermission();
    getToken();
  }, []);

  async function requestPermission() {
    const authStatus = await messaging().requestPermission();
    console.log('Permission status:', authStatus);
  }

  async function getToken() {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
  }

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
    });
  
    return unsubscribe;
  }, []);

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Background message:', remoteMessage);
  });


  //   useEffect(() => {
  //   const emitter = new NativeEventEmitter(NativeModules.LocationTracker);

  //   const sub = emitter.addListener(
  //     'onTripNotificationClick',
  //     data => {
  //       console.log('🔔 Trip notification clicked', data);

  //       navigationRef.current?.navigate('TripDetail', {
  //         tripId: data.tripId,
  //       });
  //     }
  //   );

  //   return () => sub.remove();
  // }, []);


  useEffect(() => {
    const autoStartTracking = async () => {
      const enabled = await AsyncStorage.getItem('DOMIGO_TRACKING_ENABLED');
      const token = store.getState().auth?.loginToken;

      if (enabled === '1' && token) {
        setTimeout(() => {
          console.log('🔁 Auto-starting Domigo tracking');
          DomigoTracker.startDomigoTracking(token);
        }, 2000);
      }
    };

    autoStartTracking();
  }, []);

  // useEffect(() => {

  //   setTimeout(() => {
  
  //     DomigoTracker.createMissingDay()
  
  //   },50000)
  
  // },[])

  useEffect(() => {
    if (GEOFENCING_MODE === 'local_js') {
      scheduleMidnight(); 
      OfflineQueueService.flush(offlineSendFn);
      OfflineQueueService.startListening(offlineSendFn);
      return () => OfflineQueueService.stopListening();
    }
  }, []);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            {/* <StatusBar
                barStyle={isDarkMode ? 'dark-content' : 'dark-content'}
                translucent={true}
                backgroundColor={'transparent'}
                // backgroundColor={'#9ab1fa'}
                // translucent={false}
              /> */}

            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </PersistGate>
    </Provider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={[
        styles.container,
        // { paddingTop: safeAreaInsets.top }
      ]}
    >
      <RootNavigator />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white || '#fff'
  },
});

export default App;