import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";
import colors from "../theme/colors";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { ICON_AppTheme, ICON_bell, ICON_bell_off, ICON_File_dock, ICON_Language, ICON_Lock, ICON_Menu, ICON_syncdata } from "../assets/svgicon";
import { useDispatch } from "react-redux";
import { LOGOUT } from "../redux/actions/action-creator";
import { CustomToast } from "../helpers/CommonHelpers";
import { stopDomigoTracking } from "../helpers/MainTracker";
import DomigoTracker from "../helpers/MainTracker";

export default function SettingsScreen() {
  const dispatch = useDispatch();
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [stateAlerts, setStateAlerts] = useState(true);
  const [syncData, setSyncData] = useState(true);
  const navigation = useNavigation();
  // navigation.navigate('TaxResidencyIntro')
  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header title={'Settings'} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >


          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Menu')}>
              <View style={styles.rowLeft}>
                <ICON_Menu />
                <View style={{ width: '100%' }}>
                  <Text style={styles.title}>Menu</Text>
                  <Text style={styles.subtitle}>View your quick access options</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <ICON_Language height={24} width={24} />
                <View style={{ width: '100%' }}>
                  <Text style={styles.title}>Language</Text>
                  <Text style={styles.subtitle}>English (US)</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row}>
              <View style={styles.rowLeft}>
                <ICON_AppTheme height={24} width={24} />
                <View style={{ width: '100%' }}>
                  <Text style={styles.title}>App Theme</Text>
                  <Text style={styles.subtitle}>System Default</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <ICON_bell height={24} width={24} />
                <View>
                  <Text style={styles.title}>Deadline Reminders</Text>
                  <Text style={styles.subtitle}>
                    Alerts for upcoming tax residency deadlines
                  </Text>
                </View>
              </View>
              <Switch
                value={deadlineReminders}
                onValueChange={setDeadlineReminders}
                trackColor={{ false: "#ccc", true: '#65C466' }}
                thumbColor={"#fff"}
              />
            </View>

            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <ICON_bell_off height={24} width={24} />
                <View>
                  <Text style={styles.title}>State Stay Overrun Alerts</Text>
                  <Text style={styles.subtitle}>
                    Notify if exceeding permitted days in a state
                  </Text>
                </View>
              </View>
              <Switch
                value={stateAlerts}
                onValueChange={setStateAlerts}
                trackColor={{ false: "#ccc", true: '#65C466' }}
                thumbColor={"#fff"}
              />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <ICON_syncdata height={24} width={24} />
                <View>
                  <Text style={styles.title}>Sync Data</Text>
                  <Text style={styles.subtitle}>
                    Automatically sync residency data across devices
                  </Text>
                </View>
              </View>
              <Switch
                value={syncData}
                onValueChange={setSyncData}
                trackColor={{ false: "#ccc", true: '#65C466' }}
                thumbColor={"#fff"}
              />
            </View>

            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ReportsExport')}>
              <View style={styles.rowLeft}>
                <ICON_File_dock height={24} width={24} />
                <View>
                  <Text style={styles.title}>Export Data</Text>
                  <Text style={styles.subtitle}>
                    Download your complete residency record
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.row}
            onPress={()=>navigation.navigate("PrivacyPolicyScreen")}>
              <View style={styles.rowLeft}>
                <ICON_Lock height={24} width={24} />
                <View>
                  <Text style={styles.title}>Privacy Policy</Text>
                  <Text style={styles.subtitle}>
                    Review our data handling and privacy guidelines
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                dispatch(LOGOUT());
                CustomToast.show('LogOut User Successfully');
                DomigoTracker.stopDomigoTracking();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              }}
            >
              <View style={styles.rowLeft}>

                <Ionicons name="log-out-outline" size={24} color="#d9534f" />
                <View style={{ width: '100%' }}>
                  <Text style={[styles.title]}>Logout</Text>
                  <Text style={[styles.subtitle]}>
                    Sign out from your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#999" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 16,
    marginVertical: 12,
    color: "#000",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginTop: 10,
    marginHorizontal: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 16,
    marginTop: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",

  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,

  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000",
  },
  subtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    maxWidth: "90%",

  },
});
