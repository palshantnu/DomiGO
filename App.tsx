import React, { useEffect } from 'react';
import {
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
import DomigoTracker from './src/helpers/MainTracker'
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
    const autoStartTracking = async () => {
      const enabled = await AsyncStorage.getItem('DOMIGO_TRACKING_ENABLED');
      const token = store.getState().auth?.loginToken;
      
      if (enabled === '1' && token) {
        // Add delay to prevent immediate duplicate processing
        setTimeout(() => {
          console.log('🔁 Auto-starting Domigo tracking');
          DomigoTracker.startDomigoTracking(token);
        }, 2000); // 2 second delay
      }
    };
    
    autoStartTracking();
  }, []);
  
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            {/* <StatusBar
              barStyle={isDarkMode ? 'dark-content' : 'dark-content'}
              backgroundColor={colors.white}
              translucent={false}
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