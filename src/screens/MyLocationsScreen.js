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
import Header from "../components/Header";
import colors from "../theme/colors";
import navigation from "../navigation";
import { useNavigation } from "@react-navigation/native";
import { connect } from "react-redux";
import { GET_FAQS, GET_SUPPORT_CONTACT, GET_USER_LOCATIONS } from '../redux/actions/action-creator';

const MyLocationsScreen = ({ GET_USER_LOCATIONS, userLocations, }) => {
  const navigation = useNavigation();

  useEffect(() => {
    GET_USER_LOCATIONS();
  }, []);


  console.log('userLocations', userLocations);

  const primaryLocation = userLocations?.find(loc => loc.type === "primary");
  const secondaryLocation = userLocations?.find(loc => loc.type === "secondary");
  const others = userLocations?.filter(loc => loc.type === "other");

  const formatLocation = (loc) => {
    if (!loc) return "Not Added";
    return `${loc.city}, ${loc.state}, ${loc.country}`;
  };


  const LocationRow = ({ icon, label, value, loc }) => (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} style={styles.icon} />

      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>

      <TouchableOpacity
        onPress={() =>
          navigation.navigate("AddTertiaryLocation", {
            mode: "edit",
            location: loc,
          })
        }
      >
        <Ionicons name="pencil" size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <Header title="My Locations" showBack/>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >

          {/* SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Locations</Text>

            <View style={styles.card}>

              {/* Primary */}
              {primaryLocation && (
                <LocationRow
                  icon="star"
                  label="Primary Location"
                  value={formatLocation(primaryLocation)}
                  loc={primaryLocation}
                />

              )}

              {/* Secondary */}
              <LocationRow
                icon="location-outline"
                label="Secondary Location"
                value={formatLocation(secondaryLocation)}
                loc={secondaryLocation}
              />

              {!secondaryLocation && (
                <TouchableOpacity
                  style={styles.addRow}
                  onPress={() => navigation.navigate("AddTertiaryLocation", { mode: "add", type: "secondary" })}
                >
                  <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.addText}>Add Secondary Location</Text>
                </TouchableOpacity>
              )}

              {/* Tertiary (optional show) */}
              {others.map((loc, index) => (
                <LocationRow
                  key={loc.id}
                  icon="location-outline"
                  label={`Other Location ${index + 1}`}
                  value={formatLocation(loc)}
                  loc={loc}
                />
              ))}

              {/* Add Tertiary */}
              <TouchableOpacity
                style={styles.addRow}
                onPress={() =>
                  navigation.navigate("AddTertiaryLocation", {
                    mode: "add",
                    type: "other",
                  })
                }
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addText}>Add Location</Text>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    loginToken: state.auth.loginToken,
    userLocations: state.common.userLocations,
  };
}


const mapDispatchToProps = {
  GET_USER_LOCATIONS,
};

export default connect(mapStateToProps, mapDispatchToProps)(MyLocationsScreen);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 15,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },

  icon: {
    marginRight: 10,
    backgroundColor: "#E9E9E9",
    borderRadius: 50,
    padding: 10,
  },

  label: {
    fontSize: 13,
    color: colors.textLight,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 2,
  },

  addRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    justifyContent: "center",
  },

  addText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
});