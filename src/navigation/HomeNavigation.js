import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsScreen from '../screens/SettingsScreen';
import TaxResidencyIntro from '../screens/TaxResidencyIntro';
import HomeScreen from '../screens/HomeScreen';
import MetricsScreen from '../screens/MetricsScreen';
import StateTripsScreen from '../screens/StateTripsScreen';


export default function HomeNavigation() {
  const Stack = createStackNavigator();
  return (
    <Stack.Navigator>

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Metrics"
        component={MetricsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="StateTripsScreen"
        component={StateTripsScreen}
        options={{ headerShown: false }}
      />

    </Stack.Navigator>
  );
}
