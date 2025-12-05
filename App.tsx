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
import { startDomigoTracking, stopDomigoTracking } from "./src/helpers/MainTracker";
import { testNativeModule } from './src/helpers/testNativeModule';

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

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <SafeAreaProvider>
          <NavigationContainer>
            <StatusBar
              barStyle={isDarkMode ? 'dark-content' : 'dark-content'}
              backgroundColor={colors.white}
              translucent={false}
            />

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