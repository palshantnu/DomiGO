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

import { PermissionsAndroid, Platform } from 'react-native';

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

  //   useEffect(() => {
  //   handleLocationAccess().then((enabled) => {
  //     console.log('Location Ready:', enabled);
  //   });
  // }, []);
  //   useEffect(() => {
  //   setTimeout(() => {
  //     handleLocationAccess();
  //   }, 1000);
  // }, []);
  useEffect(() => {
    setTimeout(() => {
      // ensureLocationReady();
    }, 1500);
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