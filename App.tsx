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
import { store } from './src/redux/store';
function App() {
  const isDarkMode = useColorScheme() === 'dark';

  // useEffect(() => {
  //   // Hide splash screen after loading
  //   setTimeout(() => {
  //     SplashScreen.hide();
  //   }, 2000); // optional delay for demo
  // }, []);
  return (
    <Provider store={store}>
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.primary}
        translucent={false}
      />

      <AppContent />

    </SafeAreaProvider>
    </Provider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={[
        styles.container,
        // { paddingTop: safeAreaInsets.top }
      ]}
    >
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary || '#fff'
  },
});

export default App;