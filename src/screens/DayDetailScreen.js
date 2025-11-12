import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import colors from "../theme/colors";
import { useNavigation } from "@react-navigation/native";

export default function DayDetailScreen() {
  const navigation = useNavigation();

  const timelineData = [
    { icon: "home-outline", time: "08:00 AM", place: "Los Angeles, CA", desc: "Departed from home" },
    { icon: "restaurant-outline", time: "12:30 PM", place: "Barstow, CA", desc: "Lunch break at roadside diner" },
    { icon: "map-outline", time: "03:00 PM", place: "Primm, NV (State Border)", desc: "Crossed into Nevada" },
    { icon: "bed-outline", time: "04:30 PM", place: "Las Vegas, NV", desc: "Arrived at hotel" },
    { icon: "bed-outline", time: "09:00 AM", place: "Las Vegas, NV", desc: "Departed from hotel" },
    { icon: "home-outline", time: "02:00 PM", place: "Los Angeles, CA", desc: "Arrived back home" },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="chevron-back" onPress={() => navigation.goBack()} size={24} color="#000" />
        <Text style={styles.headerTitle}>Day Detail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Trip Info */}
        <View style={styles.card}>
          <View style={styles.tripInfoHeader}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
            <Text style={styles.tripTitle}>Los Angeles to Las Vegas</Text>
          </View>
          <Text style={styles.tripDate}>October 26 - October 27, 2024</Text>

          <Image
            source={{
              uri: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
            }}
            style={styles.mapImage}
          />
        </View>

        {/* Trip Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Summary</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="map-marker-distance" size={18} color={colors.primary} />
              </View>
              <View style={{ alignItems: "center" }}>
              <Text style={styles.summaryLabel}>Distance</Text>
                <Text style={styles.summaryValue}>270 miles</Text>
                
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.iconBox}>
                <Ionicons name="flag-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ alignItems: "center" }}>
              <Text style={styles.summaryLabel}>States Visited</Text>
                <Text style={styles.summaryValue}>2</Text>
              
              </View>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.iconBox}>
                <Ionicons name="time-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ alignItems: "center" }}>
              <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>2 days</Text>
               
              </View>
            </View>

            <View style={styles.summaryItem}>
              <View style={[styles.iconBox, ]}>
                <Ionicons name="checkmark-circle" size={18} color="#34C759" />
              </View>
              <View style={{ alignItems: "center" }}>
              <Text style={styles.summaryLabel}>Status</Text>
                <Text style={[styles.summaryValue, { color: "#34C759" }]}>Active</Text>
               
              </View>
            </View>
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Timeline of Events</Text>

          {timelineData.map((item, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineCircle}>
                  <Ionicons name={item.icon} size={16} color={colors.white} />
                </View>
                {index !== timelineData.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.timelineTextContainer}>
                <Text style={styles.timeText}>{item.time}</Text>
                <Text style={styles.placeText}>{item.place}</Text>
                <Text style={styles.descText}>{item.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Edit Button */}
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil-outline" size={18} color="#fff" />
          <Text style={styles.editButtonText}>Edit Trip Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 55,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },

  tripInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginLeft: 6,
  },
  tripDate: {
    color: "#555",
    marginTop: 4,
    marginBottom: 10,
  },
  mapImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000",
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
    flexDirection: "row",
    // justifyContent: "space-between",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    // backgroundColor: "#F1F6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  summaryLabel: {
    fontSize: 17,
    color: "#777",
    fontWeight: "600",
  },

  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timelineIconContainer: {
    width: 30,
    alignItems: "center",
    position: "relative",
  },
  timelineCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  timelineLine: {
    position: "absolute",
    top: 28,
    left: 14,
    width: 2,
    height: 38,
    backgroundColor: "#E0E0E0",
  },
  timelineTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    color: "#000",
    fontWeight: "500",
  },
  placeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
    marginTop: 2,
  },
  descText: {
    fontSize: 13,
    color: "#555",
    marginTop: 2,
  },

  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 30,
    paddingVertical: 14,
    borderRadius: 10,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
});
