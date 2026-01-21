import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import colors from "../theme/colors";
import { connect, useDispatch } from "react-redux";
import { GET_NOTIFICATION, } from '../redux/actions/action-creator';


const AlertsScreen = ({GET_NOTIFICATION,notifications}) => {
  const dispatch = useDispatch();

  const alerts = [
    {
      id: 1,
      title: "Residency Threshold Alert",
      type: "Urgent",
      icon: "warning-outline",
      description:
        "You are approaching the 165-day threshold in New York. Review your recent records.",
      time: "2 hours ago",
      action: "View Details",
      color: "#FF3B30",
    },
    {
      id: 2,
      title: "New Tax Document Available",
      type: "Info",
      icon: "document-text-outline",
      description:
        "Your annual tax residency summary for FY 2023-2024 is now available for download.",
      time: "Yesterday",
      action: "Download",
      color: "#007AFF",
    },
    {
      id: 3,
      title: "Record Added Successfully",
      type: "Success",
      icon: "checkmark-circle-outline",
      description:
        "Your stay in California from June 1st to June 10th has been added to your records.",
      time: "3 days ago",
      color: "#34C759",
    },
    {
      id: 4,
      title: "Update Your Profile",
      type: "Info",
      icon: "person-circle-outline",
      description:
        "Ensure your residency rules are up-to-date to avoid discrepancies.",
      time: "1 week ago",
      action: "Go to Profile",
      color: "#007AFF",
    },
    {
      id: 5,
      title: "System Maintenance and Updates",
      icon: "information-circle-outline",
      description:
        "Our services will be temporarily unavailable for maintenance on July 20th, 2 AM - 4 AM EST.",
      time: "2 weeks ago",
      color: "#999",
    },
  ];

  useEffect(() => {
    dispatch(GET_NOTIFICATION)
    // return () => {
    //   stopDomigoTracking();
    // };
}, []);

console.log('notifications',notifications);

  return (
    <LinearGradient
      colors={['#9ab1fa', '#ffffff']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Alerts & Notifications</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>

          {alerts.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={item.color || "#333"}
                  />
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
                {item.type && (
                  <View
                    style={[
                      styles.badge,
                      item.type === "Urgent"
                        ? styles.badgeUrgent
                        : item.type === "Success"
                          ? styles.badgeSuccess
                          : styles.badgeInfo,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        item.type === "Urgent"
                          ? { color: "#FF3B30" }
                          : item.type === "Success"
                            ? { color: "#34C759" }
                            : { color: "#007AFF" },
                      ]}
                    >
                      {item.type}
                    </Text>
                  </View>
                )}
              </View>
              {
                item.id == '5'?
              <Text style={styles.desc}>{notifications[0].description}</Text>
                 :
              <Text style={styles.desc}>{item.description}</Text>
              }
              {/* <Text style={styles.desc}>{item.description}</Text> */}
              <View style={styles.footer}>
                <Text style={styles.time}>{item.time}</Text>
                {item.action && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionText}>{item.action}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}


function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    loginToken: state.auth.loginToken,
    notifications: state.common.notifications
  };
}


const mapDispatchToProps = {
  GET_NOTIFICATION,
};

export default connect(mapStateToProps, mapDispatchToProps)(AlertsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
  },
  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    flexShrink: 1,
  },
  desc: {
    fontSize: 13,
    color: "#555",
    marginTop: 6,
    lineHeight: 18,
  },
  footer: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeUrgent: {
    backgroundColor: "rgba(255,59,48,0.1)",
  },
  badgeSuccess: {
    backgroundColor: "rgba(52,199,89,0.1)",
  },
  badgeInfo: {
    backgroundColor: "rgba(0,122,255,0.1)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionButton: {
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 8,
    // borderWidth: 0.5,
    borderColor: '#ccc',

  },
  actionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#fff", padding: 5
  },
});
