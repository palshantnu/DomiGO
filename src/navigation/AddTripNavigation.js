import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsScreen from '../screens/SettingsScreen';
import TaxResidencyIntro from '../screens/TaxResidencyIntro';
import HomeScreen from '../screens/HomeScreen';
import MetricsScreen from '../screens/MetricsScreen';
import TripListScreen from '../screens/TripListScreen';

import AddRecordScreen from '../screens/AddRecordScreen';
import AddTripScreen from '../screens/AddTripScreen';

export default function AddTripNavigation() {
    const Stack = createStackNavigator();
    return (
      <Stack.Navigator>
       
        <Stack.Screen
          name="TripList"
          component={TripListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddTrip"
          component={AddTripScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddRecord"
          component={AddRecordScreen}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    );
  }
  