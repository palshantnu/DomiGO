import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import SettingsScreen from '../screens/SettingsScreen';
import TaxResidencyIntro from '../screens/TaxResidencyIntro';
import ReportsExportScreen from '../screens/ReportsExportScreen';
import MenuScreen from '../screens/MenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileManagementScreen from '../screens/ProfileManagementScreen';

export default function SettingsNavigation() {
    const Stack = createStackNavigator();
    return (
      <Stack.Navigator>
        <Stack.Screen
          name="SettingsScreen"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ReportsExport"
          component={ReportsExportScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Menu"
          component={MenuScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileManagement"
          component={ProfileManagementScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TaxResidencyIntro"
          component={TaxResidencyIntro}
          options={{ headerShown: false }}
        />
       

      </Stack.Navigator>
    );
  }
  