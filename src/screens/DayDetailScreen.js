import React, { useCallback, useEffect } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import { GET_TRIP_SUMMARY_DETAILS } from "../redux/actions/action-creator";
import { connect, useDispatch } from "react-redux";

function DayDetailScreen({
  GET_TRIP_SUMMARY_DETAILS,
  route,
  TripSummaryDetails
}) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const trip = route.params;
  console.log('trip', TripSummaryDetails);
  // console.log("DATE TEST => ", new Date().toString());

  const timelineData = [
    { icon: "home-outline", time: "08:00 AM", place: "Los Angeles, CA", desc: "Departed from home" },
    { icon: "restaurant-outline", time: "12:30 PM", place: "Barstow, CA", desc: "Lunch break at roadside diner" },
    { icon: "map-outline", time: "03:00 PM", place: "Primm, NV (State Border)", desc: "Crossed into Nevada" },
    { icon: "bed-outline", time: "04:30 PM", place: "Las Vegas, NV", desc: "Arrived at hotel" },
    { icon: "bed-outline", time: "09:00 AM", place: "Las Vegas, NV", desc: "Departed from hotel" },
    { icon: "home-outline", time: "02:00 PM", place: "Los Angeles, CA", desc: "Arrived back home" },
  ];
  const API_Function = useCallback(async () => {
    try {
      await dispatch(GET_TRIP_SUMMARY_DETAILS(trip.id));
    } catch (e) {
      console.log("Error fetching trip summary:", e);
    }
  }, [dispatch, trip.id]);

  useEffect(() => {
  API_Function();
}, []);

useEffect(() => {
  const unsubscribe = navigation.addListener('focus', API_Function);
  return unsubscribe;
}, [navigation]);

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        <Header title="Day Detail" />


        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.card}>
            <View style={styles.tripInfoHeader}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
              <Text style={styles.tripTitle}>{TripSummaryDetails?.tripDay?.originState} to {TripSummaryDetails?.tripDay?.destinationState}</Text>
            </View>
            {/* <Text style={styles.tripDate}>{new Date(TripSummaryDetails?.tripDay?.startDate).toDateString()} - {new Date(TripSummaryDetails?.tripDay?.endDate).toDateString()}</Text> */}
            <Text style={styles.tripDate}>{new Date(TripSummaryDetails?.tripDay?.date).toDateString()}</Text>
            {TripSummaryDetails?.tripDay?.creationType && (
                <View style={styles.creationTypeBadge}>
                  <Text style={styles.creationTypeText}>
                    Trip Type: {TripSummaryDetails?.tripDay?.creationType.toUpperCase()}
                  </Text>
                </View>
              )}

            <Image
              source={{
                uri: "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png",
              }}
              style={styles.mapImage}
            />
          </View>


          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Trip Summary</Text>


            <View style={styles.summaryRow}>


              <View style={styles.summaryBox}>
                <Ionicons name="car-outline" size={22} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.summaryLabel}>Distance</Text>
                  <Text style={styles.summaryValue}>{TripSummaryDetails?.summary?.distanceMiles} miles</Text>
                </View>
              </View>


              <View style={styles.summaryBox}>
                <Ionicons name="flag-outline" size={22} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.summaryLabel}>States Visited</Text>
                  <Text style={styles.summaryValue}>{TripSummaryDetails?.summary?.statesVisited}</Text>
                </View>
              </View>

            </View>


            <View style={styles.summaryRow}>

              {/* Duration */}
              <View style={styles.summaryBox}>
                <Ionicons name="time-outline" size={22} color={colors.primary} />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.summaryLabel}>Duration</Text>
                  <Text style={styles.summaryValue}>{TripSummaryDetails?.summary?.durationDays} days</Text>
                </View>
              </View>


              <View style={styles.summaryBox}>
                <Ionicons name="checkmark-circle-outline" size={22} color="#34C759" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.summaryLabel}>Status</Text>
                  <Text style={[styles.summaryValue, { color: "#34C759", textTransform: 'capitalize' }]}>
                    {TripSummaryDetails?.trip?.status}
                  </Text>
                </View>
              </View>

            </View>
          </View>



          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline of Events</Text>

            {/* {TripSummaryDetails?.events.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIconContainer}>
                  <View style={styles.timelineCircle}>
                    <Ionicons name={'home-outline'} size={16} color={colors.white} />
                  </View>
                  {index !== TripSummaryDetails?.events.length - 1 && <View style={styles.timelineLine} />}
                </View>

                <View style={styles.timelineTextContainer}>
                  <Text style={styles.timeText}>{item.time}</Text>
                  <Text style={styles.placeText}>{item.state},{item.city}</Text>
                  <Text style={styles.descText}>{item.description}</Text>
                </View>
              </View>
            ))} */}
          </View>


          {/* <TouchableOpacity onPress={() => navigation.navigate('AddTrip', {  id: trip.id })} style={styles.editButton}> */}
          <TouchableOpacity onPress={() =>  navigation.navigate("DayEntryScreen", {
                        mode: "TRIP", // or "TRIP"
                        date: "2026-01-03",
                        isEdit: true,
                        data: trip
                      })} 
          style={styles.editButton}>
            <Ionicons name="pencil-outline" size={18} color="#fff" />
            <Text style={styles.editButtonText}>Edit Trip </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
function mapStateToProps(state) {
  return {
    loginToken: state.auth.loginToken,
    userData: state.auth.userData,
    TripSummaryDetails: state.common.TripSummaryDetails,
  };
}

const mapDispatchToProps = {
  GET_TRIP_SUMMARY_DETAILS
};
export default connect(mapStateToProps, mapDispatchToProps)(DayDetailScreen);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: "#fff",
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  summaryBox: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    backgroundColor: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 4,
  },

  summaryLabel: {
    fontSize: 13,
    color: "#777",
    marginBottom: 2,
  },

  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  creationTypeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 15,
  },
  
  creationTypeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3C9BF4",
  },
  
});
