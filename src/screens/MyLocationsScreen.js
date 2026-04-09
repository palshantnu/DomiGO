import React from "react";
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

const MyLocationsScreen = () => {
  const navigation = useNavigation();


    const LocationRow = ({ icon, label, value, isLast }) => (
        <View
          style={[
            styles.row,
            !isLast && { borderBottomWidth: 1, borderBottomColor: "#eee" },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color="#595959"
            style={styles.icon}
          />
      
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
      
          <TouchableOpacity>
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
        <Header title="My Locations" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          
          {/* SECTION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Locations</Text>

            <View style={styles.card}>
              
              {/* Primary */}
              <LocationRow
                icon="star"
                label="Primary Location"
                value="New York, USA"
              />

              {/* Secondary */}
              <LocationRow
                icon="location-outline"
                label="Secondary Location"
                value="Florida, USA"
              />

              {/* Add Tertiary */}
              <TouchableOpacity style={styles.addRow}
              onPress={()=>navigation.navigate("AddTertiaryLocation")}>
                <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                <Text style={styles.addText}>Add Tertiary Location</Text>
              </TouchableOpacity>

            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default MyLocationsScreen;

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