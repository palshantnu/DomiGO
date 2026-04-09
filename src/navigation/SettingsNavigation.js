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
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import CreateResidencyRecordScreen from '../screens/CreateResidencyRecordScreen';
import ResidencyRecordDetailsScreen from '../screens/ResidencyRecordDetailsScreen';
import ResidencyDeclarationChecklistScreen from '../screens/ResidencyDeclarationChecklistScreen';
import ResidencyHistoryScreen from '../screens/ResidencyRecords';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import HelpSupportScreen from '../screens/HelpSupportScreen';
import AboutUsScreen from '../screens/AboutUsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import MyLocationsScreen from '../screens/MyLocationsScreen';
import AddTertiaryLocationScreen from '../screens/AddTertiaryLocationScreen';


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
          name="ResidencyHistory"
          component={ResidencyHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CreateResidencyRecord"
          component={CreateResidencyRecordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResidencyRecordDetails"
          component={ResidencyRecordDetailsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ResidencyDeclarationChecklistScreen"
          component={ResidencyDeclarationChecklistScreen}
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
          name="ChangePassword"
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PrivacyPolicyScreen"
          component={PrivacyPolicyScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="HelpSupportScreen"
          component={HelpSupportScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AboutUsScreen"
          component={AboutUsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SubscriptionScreen"
          component={SubscriptionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MyLocationsScreen"
          component={MyLocationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddTertiaryLocation"
          component={AddTertiaryLocationScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    );
  }
  