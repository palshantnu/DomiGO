import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';

import LoginScreen from '../screens/Auth/LoginScreen';
import SignupScreen from '../screens/Auth/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AddTripScreen from '../screens/AddTripScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import TripDetailScreen from '../screens/TripDetailScreen';
import colors from '../theme/colors';
import TaxResidencyIntro from '../screens/TaxResidencyIntro';
import SettingsNavigation from './SettingsNavigation';
import PermissionScreen from '../screens/PermissionScreen';
import HomeNavigation from './HomeNavigation';
import TripListScreen from '../screens/TripListScreen';
import AddTripNavigation from './AddTripNavigation';
import DayDetailScreen from '../screens/DayDetailScreen';
import { View } from 'react-native';
import { ICON_ADD, ICON_CALENDAR, ICON_HOME, ICON_NOTIFICATION, ICON_SETTINGS } from '../assets/svgicon';
import { connect } from 'react-redux';
import { LOGOUT } from '../redux/actions/action-creator';
import SplashScreen from '../screens/SplashScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          paddingTop: 10,
          borderTopWidth: 0.5,
          borderTopColor: '#E0E0E0',
          backgroundColor: '#fff',
          elevation: 8,
        },
        tabBarIcon: ({ focused }) => {
          let iconName;
          let iconColor = '#000';
          let iconSize = 26;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Calendar') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'AddTripNavigation') {
            iconName = 'add-circle-outline';
            iconColor = colors.primary; // center + icon color
            iconSize = 35;
          } else if (route.name === 'Alerts') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return (
            <View style={{ alignItems: 'center', justifyContent: 'center', height: 70 }}>
              {route.name == 'Dashboard' ? <ICON_HOME height={24} width={24} />
                : route.name == 'Calendar' ? <ICON_CALENDAR height={24} width={24} />
                  : route.name == 'AddTripNavigation' ? <ICON_ADD height={30} width={30} />
                  // : route.name == 'AddTripNavigation' ? <Icon name='arrow-back-circle-outline' size={32} color="#29A0DD" />
                    : route.name == 'Alerts' ? <ICON_NOTIFICATION height={24} width={24} />
                      : route.name == 'Settings' ? <ICON_SETTINGS height={24} width={24} />
                        : null}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeNavigation} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="AddTripNavigation" component={AddTripNavigation} />
      {/* <Tab.Screen
        name="AddTripNavigation"
        component={AddTripNavigation}
        listeners={({ navigation }) => ({
          tabPress: e => {
            e.preventDefault(); // stop default tab switch
            console.log();
            

            if (navigation.canGoBack()) {
              navigation.goBack(); // normal back behavior
            } else {
              // navigation.navigate('Dashboard'); // fallback
              navigation.goBack(); // normal back behavior

            }
          },
        })}
      /> */}

      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="Settings" component={SettingsNavigation} />
    </Tab.Navigator>
  );
}


const RootNavigator = (props) => {
  const [isSplashDone, setIsSplashDone] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplashDone(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);
  return (
    <Stack.Navigator>
      {!isSplashDone && (
        <Stack.Screen options={{ headerShown: false }} name="Splash" component={SplashScreen} />
      )}
      {isSplashDone && props.SignIn && props.userData !== '' ? (
        <Stack.Screen options={{ headerShown: false }} name="Main" component={MainTabs} />
      ) : isSplashDone ? (
        <Stack.Screen
          name="TaxResidencyIntro"
          component={TaxResidencyIntro}
          options={{ headerShown: false }}
        />
      ) : null}

      <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />

      <Stack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ headerShown: false }}
      />


      <Stack.Screen
        name="SplashScreen"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
        options={{
          title: 'Trip Detail',
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <Stack.Screen
        name="PermissionScreen"
        component={PermissionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddTrip"
        component={AddTripScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    SignIn: state.auth.SignIn,
  }
}

const mapDispatchToProps = {
  LOGOUT,
}

export default connect(mapStateToProps, mapDispatchToProps)(RootNavigator);
