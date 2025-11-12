import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";

const colors = {
  primary: "#28A0DD",
  background: "#FFFFFF",
  textDark: "#000",
  textLight: "#666",
  border: "#E5E5EA",
  inputBg: "#F5F5F5",
};

const ProfileManagementScreen = () => {
  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <Header title={"Profile Management"} />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image */}
          <View style={styles.profileWrapper}>
            <View>
              <Image
                source={{ uri: "https://i.pravatar.cc/150" }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.plusButton}>
                <Ionicons name="add" size={18} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.profileName}>Jim Wilkes</Text>
            <Text style={styles.profileEmail}>jim@jimwilkes.me</Text>
          </View>

          {/* Personal Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Info</Text>

            {/* Input Fields */}
            <View style={styles.inputCard}>
              <InfoInput
                icon="person-outline"
                placeholder="Jim Wilkes"
                value="Jim Wilkes"
              />
              <InfoInput
                icon="location-outline"
                placeholder="123 Harmony Lane, Suite 4B, Melbourne"
                value="123 Harmony Lane, Suite 4B, Melbourne"
              />
              <InfoInput
                icon="lock-closed-outline"
                placeholder="xxxxxxxxxxxxx"
                secureTextEntry
              />
              <InfoInput
                icon="lock-closed-outline"
                placeholder="New Password"
                secureTextEntry
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

// Reusable Input Row
const InfoInput = ({ icon, placeholder, value, secureTextEntry }) => (
  <View style={styles.inputRow}>
    <Ionicons
      name={icon}
      size={18}
      color="#595959"
      style={styles.inputIcon}
    />
    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      secureTextEntry={secureTextEntry}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileWrapper: {
    alignItems: "center",
    marginTop: 25,
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
  },
  plusButton: {
    position: "absolute",
    bottom: 4,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 8,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textLight,
  },
  section: {
    marginTop: 30,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 10,
  },
  inputCard: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputIcon: {
  
    padding: 8,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
  },
  saveButton: {
    backgroundColor: colors.primary,
    marginTop: 25,
    marginHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ProfileManagementScreen;
