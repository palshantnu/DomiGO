import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import colors from "../theme/colors";
import {
  ADDUSERLOCATIONS,
  UPDATEUSERLOCATIONS,
} from "../redux/actions/action-creator";
import { useDispatch } from "react-redux";
import AddressAutoFill from "../components/AddressAutoFill";
import { GOOGLE_KEY } from "../helpers/CommonHelpers"

// 👉 API functions (apne hisaab se adjust karna)
// import api from "../api"; 

const AddTertiaryLocationScreen = ({ route, navigation }) => {
  const { mode = "add", location, type = "other" } = route.params || {};

  const isEdit = mode === "edit";

  const [country, setCountry] = useState(location?.country || "");
  const [stateName, setStateName] = useState(location?.state || "");
  const [city, setCity] = useState(location?.city || "");
  const [address, setAddress] = useState(location?.address || "");
  const [selectedType, setSelectedType] = useState(location?.type || type);

  const dispatch = useDispatch();

  const handleSave = async () => {
    if (!country || !stateName || !city || !address) {
      Alert.alert("Please fill all fields");
      return;
    }

    const payload = {
      country,
      state: stateName,
      city,
      address,
      type: selectedType,
      isPrimary: selectedType === "primary",
      isActive: true,
    };

    try {
      if (isEdit) {
        await dispatch(
          UPDATEUSERLOCATIONS(payload, location.id)
        );
      } else {
        await dispatch(ADDUSERLOCATIONS(payload));
      }

      Alert.alert("Success");
      navigation.goBack();

    } catch (e) {
      console.log(e);
      Alert.alert("Error saving location");
    }
  };

  return (
    <LinearGradient style={{ flex: 1 }} colors={["#9ab1fa", "#fff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header title={isEdit ? "Edit Location" : "Add Location"} showBack/>

        <View style={{ padding: 16 }}>

          {/* TYPE SELECT */}
          <Text style={styles.label}>Select Type</Text>
          <View style={styles.typeRow}>
            {["primary", "secondary", "other"].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.typeBtn,
                  selectedType === item && { backgroundColor: colors.primary }
                ]}
                onPress={() => setSelectedType(item)}
              >
                <Text style={{ color: selectedType === item ? "#fff" : "#000" }}>
                  {item.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ADDRESS */}
          <Text style={styles.label}>Address</Text>
          <AddressAutoFill
            apiKey={GOOGLE_KEY}
            value={address}
            onSelect={(data) => {
              setAddress(data.address);
              setCity(data.city);
              setStateName(data.state);
              setCountry(data.country);
            }}
          />

          {/* CITY */}
          <Text style={styles.label}>City</Text>
          <TextInput
            value={city}
            style={styles.input}
            editable={false}
          />

          {/* STATE */}
          <Text style={styles.label}>State</Text>
          <TextInput
            value={stateName}
            style={styles.input}
            editable={false}
          />

          {/* COUNTRY */}
          <Text style={styles.label}>Country</Text>
          <TextInput
            value={country}
            style={styles.input}
            editable={false}
          />

          {/* BUTTON */}
          <TouchableOpacity style={styles.button} onPress={handleSave}>
            <Text style={styles.buttonText}>
              {isEdit ? "Update Location" : "Save Location"}
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default AddTertiaryLocationScreen;

const styles = StyleSheet.create({
  label: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  button: {
    marginTop: 30,
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
  },
  typeBtn: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
  },
});