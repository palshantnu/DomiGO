import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import Foundation from "react-native-vector-icons/Foundation";
import { ICON_Edit } from "../assets/svgicon";
import { useNavigation } from "@react-navigation/native";
import { connect } from "react-redux";
import { getUserPersonalDataSelelctor } from "../redux/selectors/common";
import { getPersonalProfileDataAction } from "../redux/actions/action-creator";
import { GET_SUPPORT_CONTACT } from "../redux/actions/action-creator";


const colors = {
  primary: "#28A0DD",
  background: "#F5F6F8",
  textDark: "#000",
  textLight: "#666",
  card: "#FFFFFF",
  border: "#E5E5EA",
  success: "#28a745",
};

const MenuScreen = ({ userPersonalData, getPersonalProfileDataAction,GET_SUPPORT_CONTACT,supportContact }) => {
  // console.log('userPersonalData', userPersonalData);
  // console.log('supportContact', supportContact);
  const getData = async () => {
    await getPersonalProfileDataAction();
  };

  useEffect(() => {
    getData();
    GET_SUPPORT_CONTACT()
  }, []);
  const navigation = useNavigation();
  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 30 }}
        >
          <View style={styles.profileRow}>
            <Image
              // source={{ uri: "https://i.pravatar.cc/100" }}
              source={{ uri: 'https://cdn-icons-png.flaticon.com/128/3135/3135715.png' }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userPersonalData?.name ?? 'user'}</Text>
              <Text style={styles.profileEmail}>{userPersonalData?.email ?? 'user@gmail.com'}</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.editButton}>
              <ICON_Edit />
            </TouchableOpacity>
          </View>
          <View style={styles.card}>
            <MenuRow
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => { navigation.navigate('ChangePassword') }}
            />
          </View>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <MenuRow icon="lock-closed-outline" label="My Locations" />
            <MenuRow icon="notifications-outline" label="Notifications" />
            <MenuRow
              icon="location-outline"
              label="Location Tracking"
              status="Enabled"
              statusColor="#28a745"
            />
            <MenuRow
              icon="dollar"
              label="Subscription Status"
              status="Active - Renew in 96 Days"
              statusColor="#28a745"
              isLast
            />
          </View>

          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            {/* <MenuRow onPress={() => { navigation.navigate('ResidencyHistory') }} icon="home-outline" label="Domicile / Residency Settings" /> */}
            <MenuRow
              icon="mail-outline"
              label={supportContact[0]?.email}
              isLast
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const MenuRow = ({ icon, label, status, isLast, statusColor, onPress }) => (
  <TouchableOpacity
    style={[styles.row, !isLast && styles.rowBorder]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.rowLeft}>
      <View style={styles.iconContainer}>
        {icon == 'dollar'
          ? <Foundation name={icon} size={25} color="#555" />
          : <Ionicons name={icon} size={20} color="#555" />}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.label}>{label}</Text>

          {statusColor === '#28a745' && (
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#28a745',
                marginLeft: 6,
              }}
            />
          )}
        </View>

        {status && (
          <Text style={[styles.status, { color: statusColor || colors.textLight }]}>
            {status}
          </Text>
        )}
      </View>
    </View>

    <Ionicons name="chevron-forward" size={18} color="#282828" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  profileImage: {
    height: 70,
    width: 70,
    borderRadius: 35,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  editButton: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textDark,
    marginLeft: 8,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 0,
    marginBottom: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    height: 34,
    width: 34,
    borderRadius: 17,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  label: {
    fontSize: 15,
    color: "#000",
  },
  status: {
    fontSize: 13,
    marginTop: 2,
  },
});
function mapStateToProps(state) {

  return {
    userPersonalData: getUserPersonalDataSelelctor(state),
    supportContact: state.common.supportContact,
  }
}

const mapDispatchToProps = {
  getPersonalProfileDataAction,
  GET_SUPPORT_CONTACT
}
export default connect(mapStateToProps, mapDispatchToProps)(MenuScreen);
