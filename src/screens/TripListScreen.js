import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import Header from "../components/Header";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import colors from "../theme/colors";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { connect, useDispatch } from "react-redux";
import { GET_TRIP_LIST_LIST } from "../redux/actions/action-creator";
import { CustomToast } from "../helpers/CommonHelpers";


function getTodayDateYYYYMMDD() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // months 0-based hote hain
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}




const TripListScreen = ({ tripList }) => {
  const [refreshing, setRefreshing] = React.useState(false)
  console.log('tripList==>', tripList);
  const dispatch = useDispatch();

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

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      API_Function()
    } catch (e) {
      console.log('Refresh error', e);
    }
    setRefreshing(false);
    // CustomToast.show(" refreshed");
  };

  const todayDate = getTodayDateYYYYMMDD();
console.log(todayDate); // e.g. 2026-01-03

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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}      // iOS
              colors={[colors.primary]}       // Android
            />
          }
        >

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Trips</Text>
            <TouchableOpacity onPress={() => {
              // navigation.navigate('AddTrip')} 
              navigation.navigate("DayEntryScreen", {
                mode: "TRIP", // or "TRIP"
                date: todayDate,
                isEdit: false,
                // data: item
              })}
            }
              style={styles.addTripButton}>
              <Ionicons style={{ backgroundColor: colors.primary, borderRadius: 40 }} name="add" size={20} color={colors.white} />
              <Text style={styles.addTripText}>Add Trip</Text>
            </TouchableOpacity>
          </View>


          {tripList.map((trip) => (
              trip.kind == "trip" &&
            <TouchableOpacity key={trip.id} style={styles.card}
              onPress={() => navigation.navigate('DayDetail', trip)}>

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
                  <Text style={styles.typeText}>{trip?.creationType}</Text>
                </View>
                <View
                  style={[styles.impactBadge, { backgroundColor: '#00d250' }]}
                >
                  <Text style={[styles.impactText, { color: '#fff' }]}>
                    {trip.impactLevel}
                  </Text>
                </View>
              </View>

              {
                trip.kind == "trip" ?
              <Text style={styles.cityText}>{trip.destinationCity},{trip.destinationState}</Text>
               :
              <Text style={styles.cityText}>{trip.state}</Text>

              }
              {/* <Text style={styles.dateText}>{new Date(trip.endDate).toDateString()}</Text> */}
              <Text style={styles.dateText}>{new Date(trip.date).toDateString()}</Text>

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
                // onPress={() => navigation.navigate('AddTrip', { id: trip.id })}
                onPress={() =>{
                  navigation.navigate("DayEntryScreen", {
                    mode: "TRIP", // or "TRIP"
                    date: todayDate,
                    isEdit: true,
                    data: trip
                  })}
                }
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
                <MaterialIcons name="edit" size={18} color="#fff" />
              </TouchableOpacity>

            </TouchableOpacity>
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
