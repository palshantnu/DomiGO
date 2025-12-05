import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Header from "../components/Header";
import Ionicons from "react-native-vector-icons/Ionicons";
import colors from "../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { connect, useDispatch } from "react-redux";
import { GET_TRIP_LIST_LIST } from "../redux/actions/action-creator";


const TripListScreen = ({ tripList }) => {
  console.log('tripList==>', tripList);
  const dispatch = useDispatch();
  const trips = [
    {
      id: 1,
      type: "Leisure",
      impact: "Low Impact",
      impactBg: "#00d250",
      impactColor: "#fff",
      city: "Miami, Florida",
      date: "Jan 15, 2024 - Jan 20, 2024",
      days: 5,
      risk: "Low Risk",
    },
    {
      id: 2,
      type: "Business",
      impact: "Moderate Impact",
      impactBg: "#00d250",
      impactColor: "#fff",
      city: "New York City, New York",
      date: "Feb 10, 2024 - Feb 28, 2024",
      days: 18,
      risk: "Low Risk",
    },
    {
      id: 3,
      type: "Business",
      impact: "Moderate Impact",
      impactBg: "#00d250",
      impactColor: "#fff",
      city: "Los Angeles, California",
      date: "Mar 05, 2024 - Mar 25, 2024",
      days: 20,
      risk: "Low Risk",
    },
    {
      id: 4,
      type: "Leisure",
      impact: "Low Impact",
      impactBg: "#00d250",
      impactColor: "#fff",
      city: "Dallas, Texas",
      date: "Apr 01, 2024 - Apr 10, 2024",
      days: 10,
      risk: "Low Risk",
    },
    {
      id: 5,
      type: "Business",
      impact: "High Impact",
      impactBg: "#00d250",
      impactColor: "#fff",
      city: "Houston, Texas",
      date: "May 10, 2024 - Jun 15, 2024",
      days: 37,
      risk: "Low Risk",
    },
  ];
  const navigation = useNavigation();
  const API_Function = useCallback(
    (startup = false) =>
      new Promise((resolve, reject) => {
        dispatch(GET_TRIP_LIST_LIST()).then(resolve).catch(reject);
      }),
    [
      GET_TRIP_LIST_LIST,
    ],
  );
  useEffect(() => {
    API_Function();
  }, [])
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      API_Function();

    });
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
        <Header title="Trip Details" />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AddTrip')} style={styles.addTripButton}>
              <Ionicons style={{ backgroundColor: colors.primary, borderRadius: 40 }} name="add" size={20} color={colors.white} />
              <Text style={styles.addTripText}>Add Trip</Text>
            </TouchableOpacity>
          </View>


          {tripList.map((trip) => (
            <View key={trip.id} style={styles.card}>

              <View style={styles.topRow}>
                <View style={styles.typeRow}>
                  <Ionicons
                    name={
                      trip.type === "Business" ? "briefcase-outline" : "leaf-outline"
                    }
                    size={15}
                    color="#4CAF50"
                    style={{ marginRight: 5 }}
                  />
                  <Text style={styles.typeText}>{trip?.type?.name}</Text>
                </View>
                <View
                  style={[styles.impactBadge, { backgroundColor: '#00d250' }]}
                >
                  <Text style={[styles.impactText, { color: '#fff' }]}>
                    {trip.impactLevel}
                  </Text>
                </View>
              </View>


              <Text style={styles.cityText}>{trip.destinationCity},{trip.destinationState}</Text>
              <Text style={styles.dateText}>{new Date(trip.endDate).toDateString()}</Text>

              <View style={styles.divider} />


              <View style={styles.bottomRow}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Text style={styles.label}>Days Spent</Text>
                  <Text style={styles.daysText}>{trip.daysSpent} Days</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 10 }}>
                  <Text style={styles.label}>Residency Impact</Text>
                  <View style={styles.riskBadge}>
                    <Text style={styles.riskText}>{trip.residencyRisk}</Text>
                  </View>
                </View>


              </View>
              <TouchableOpacity
                onLongPress={() => navigation.navigate('AddTrip', { id: trip.id })}
                onPress={() => navigation.navigate('DayDetail', trip)}
                style={{
                  width: 36,
                  height: 36,
                  backgroundColor: colors.primary,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                  alignSelf: 'flex-end',
                  bottom: -15,
                  right: 10,
                  position: 'absolute'
                }}
              >
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>

            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
function mapStateToProps(state) {
  return {
    loginToken: state.auth.loginToken,
    userData: state.auth.userData,
    tripList: state.common.tripList,
  };
}

const mapDispatchToProps = {
  GET_TRIP_LIST_LIST
};
export default connect(mapStateToProps, mapDispatchToProps)(TripListScreen);
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  addTripButton: {
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#F1F1F1",
    padding: 5
  },
  addTripText: {
    color: '#000',
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E7E7E7'
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
  impactBadge: {
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  impactText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cityText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginTop: 6,
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#EDEDED",
    marginVertical: 10,
  },
  bottomRow: {
    // flexDirection: "row",
    // justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 15
  },
  label: {
    fontSize: 12,
    color: "#888",
  },
  daysText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000",
  },
  riskBadge: {
    backgroundColor: "#00d250",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  riskText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  detailsText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
});
