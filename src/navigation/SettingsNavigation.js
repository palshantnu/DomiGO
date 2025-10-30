import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsScreen from '../screens/SettingsScreen';
import TaxResidencyIntro from '../screens/TaxResidencyIntro';

export default function SettingsNavigation() {
    const Stack = createStackNavigator();
    return (
      <Stack.Navigator>
       
        <Stack.Screen
          name="TaxResidencyIntro"
          component={TaxResidencyIntro}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SettingsScreen"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />

      </Stack.Navigator>
    );
  }
  