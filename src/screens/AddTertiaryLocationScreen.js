import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Alert,
    PermissionsAndroid,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../components/Header";
import colors from "../theme/colors";
import Ionicons from "react-native-vector-icons/Ionicons";
import GoogleAutoComplete from "../components/GoogleAutoComplete";
import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
import Geolocation from "@react-native-community/geolocation";
// import { connect } from "react-redux";
// import { addLocation } from "../redux/actions/locationActions";

const AddTertiaryLocationScreen = ({ navigation, addLocation }) => {
    const [address, setAddress] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [stateName, setStateName] = useState("");
    const [city, setCity] = useState("");


    const getLocation = async () => {
        Geolocation.getCurrentPosition(
          async position => {
            const { latitude, longitude } = position.coords;
            // const latitude = 26.21
            // const longitude = 78.18
    
            // Reverse Geocoding API
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`
            );
    
            const json = await response.json();
    
            console.log('json', json);
    
    
            if (json.results.length > 0) {
              const countryData = json.results[0].address_components.find(c =>
                c.types.includes("country")
              );
              console.log('countryData?.long_name', countryData?.long_name);
    
              setCountry(countryData?.long_name || "");
              setCountryCode(countryData?.short_name?.toLowerCase() || "");
            }
          },
          error => console.log(error),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
      useEffect(() => {
        const requestLocationPermission = async () => {
          if (Platform.OS === 'android') {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: 'Location Permission',
                message: 'App needs access to your location',
                buttonPositive: 'OK',
              }
            );
            getLocation()
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          }
          return true;
        };
        requestLocationPermission();
      }, [])

    const handleSave = () => {
        // if (!address) return;
        if (!address) {
            Alert.alert("Please enter location");
            return;
        }

        addLocation({
            type: "TERTIARY",
            address,
        });

        navigation.goBack();
    };

    return (
        <LinearGradient
            colors={["#9ab1fa", "#ffffff"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.8, y: 0.4 }}
            locations={[0.05, 0.55]}
            style={styles.container}
        >
            <SafeAreaView style={styles.container}>
                <Header title="Add Location" />

                <View style={styles.wrapper}>
                    <Text style={styles.label}>Enter Address</Text>

                    {/* <View style={styles.inputBox}> */}
                        {/* <Ionicons name="location-outline" size={18} color="#888" /> */}
                        {/* <TextInput
              placeholder="Type location..."
              value={address}
              onChangeText={setAddress}
              style={styles.input}
            /> */}
                        <GoogleAutoComplete
                            placeholder="Search Address"
                            apiKey={GOOGLE_KEY}
                            countryCode={countryCode}
                            stateName={stateName}
                            isStateSearch={false}
                            onSelect={setCity}
                            value={city}
                        />
                    {/* </View> */}

                    {/* Save Button */}
                    <TouchableOpacity style={styles.button} onPress={handleSave}>
                        <Text style={styles.buttonText}>Save Location</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

// export default connect(null, { addLocation })(AddTertiaryLocationScreen);
export default AddTertiaryLocationScreen
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    wrapper: {
        paddingHorizontal: 16,
        marginTop: 20,
    },

    label: {
        fontSize: 14,
        color: colors.textDark,
        marginBottom: 6,
        fontWeight: "500",
    },

    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },

    input: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
    },

    button: {
        marginTop: 30,
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 25,
        alignItems: "center",
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});