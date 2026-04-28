import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  PermissionsAndroid,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { connect } from "react-redux";
import { SIGNUP } from '../../redux/actions/action-creator';
import { CustomToast } from '../../helpers/CommonHelpers';
import NetInfo from '@react-native-community/netinfo';
import { SliderButton } from '../../components/SliderButton';
import { GOOGLE_KEY } from "../../helpers/CommonHelpers";
import AddressAutoComplete from "../../components/AddressAutoComplete";
import Geolocation from "@react-native-community/geolocation";
import messaging from '@react-native-firebase/messaging';


const SignupScreen = ({ navigation, signUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [buttonLoader, setButtonLoader] = useState(false);
  const [netInfo, setNetInfo] = useState(true);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [fcmtoken, setFcmtoken] = useState("");
  const [secondaryAddress, setSecondaryAddress] = useState("");
  const [secondaryCity, setSecondaryCity] = useState("");
  const [secondaryState, setSecondaryState] = useState("");
  const [secondaryCountry, setSecondaryCountry] = useState("");




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


  const extractCountryFromAddress = async (fullAddress) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_KEY}`
      );
  
      const json = await res.json();
  
      if (json.results?.length > 0) {
        const countryData = json.results[0].address_components.find(c =>
          c.types.includes("country")
        );
  
        setCountry(countryData?.long_name || "");
      }
    } catch (error) {
      console.log("Country extract error:", error);
    }
  };

  const extractSecondaryCityState = async (fullAddress) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_KEY}`
      );
  
      const json = await res.json();
  
      if (json.results?.length > 0) {
        let city = "";
        let state = "";
  
        json.results[0].address_components.forEach(component => {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.long_name;
          }
        });
  
        setSecondaryCity(city);
        setSecondaryState(state);
      }
    } catch (error) {
      console.log("Secondary Address extract error:", error);
    }
  };

  const extractSecondaryCountry = async (fullAddress) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_KEY}`
      );
  
      const json = await res.json();
  
      if (json.results?.length > 0) {
        const countryData = json.results[0].address_components.find(c =>
          c.types.includes("country")
        );
  
        setSecondaryCountry(countryData?.long_name || "");
      }
    } catch (error) {
      console.log("Secondary country error:", error);
    }
  };



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
    getLocation()
  }, [])



  console.log('country', country);
  console.log('countryCode', countryCode);


  const extractCityStateFromAddress = async (fullAddress) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          fullAddress
        )}&key=${GOOGLE_KEY}`
      );

      const json = await res.json();

      if (json.results?.length > 0) {
        let city = "";
        let state = "";

        json.results[0].address_components.forEach(component => {
          if (component.types.includes("locality")) {
            city = component.long_name;
          }
          if (component.types.includes("administrative_area_level_1")) {
            state = component.long_name;
          }
        });

        setCity(city);
        setStateName(state);
      }
    } catch (error) {
      console.log("Address extract error:", error);
    }
  };


  const SignUpUser = async () => {
    // if (!fcmtoken) {
    //   return CustomToast.show("Please wait, initializing device...");
    // }
    console.log('SignUpUser');
    if (!netInfo) {
      return CustomToast.show("No internet connection");
    }
    if (!email.trim()) {
      return CustomToast.show("Please enter email");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return CustomToast.show("Please enter a valid email");
    }
    if (!password.trim()) {
      return CustomToast.show("Please enter password");
    }
    if (password.length < 6) {
      return CustomToast.show("Password must be at least 6 characters");
    }
    if (!confirmPassword.trim()) {
      return CustomToast.show("Please confirm your password");
    }
    if (password !== confirmPassword) {
      return CustomToast.show("Passwords do not match");
    }
    if (!address.trim()) {
      return CustomToast.show("Please select address");
    }
    if (!city || !stateName) {
      return CustomToast.show("Please select valid address");
    }

    const data = {
      email,
      password,
      city,
      address,
      state: stateName,
      country,
      deviceType: Platform.OS === "ios" ? "ios" : "android", // 👈 add
      deviceToken: fcmtoken || "123456", // 👈 redux se aa raha hai
      // 👇 optional fields
      ...(secondaryAddress && {
        secondaryAddress,
        secondaryCity,
        secondaryState,
        secondaryCountry,
      }),
    }
    console.log('sigupbody',data);
    setButtonLoader(true);
    signUp(data, true, true).then((response) => {
      console.log('response==>', response);
      try {
        if (response.success) {
          setTimeout(() => setButtonLoader(false), 2000)
          CustomToast.show('Sucessfully Register');
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
        } else {
          setButtonLoader(false)
          CustomToast.show(response.message);
        }
      } catch (error) {
        setButtonLoader(false)
        console.log('Error on OTP Screen Registration', error);
      } finally {
        setButtonLoader(false)
      }
    }).finally(() => {
      setButtonLoader(false);
    })
  }

  React.useEffect(() => {
    requestPermission()
    getToken()
  }, []);

  async function requestPermission() {
    const authStatus = await messaging().requestPermission();
    console.log('Permission status:', authStatus);
  }

  async function getToken() {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    setFcmtoken(token)
  }

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetInfo(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  console.log("Signup Address:", address);
  console.log("Signup City:", city);
  console.log("Signup State:", stateName);

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={{ paddingHorizontal: 20, }}>
        <Text style={styles.title}>Create Your{"\n"}Account</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#777"
            style={{ ...styles.input, textTransform: 'lowercase' }}
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <AddressAutoComplete
            apiKey={GOOGLE_KEY}
            value={address}
            countryCode={countryCode}
            onSelect={(selectedAddress) => {
              setAddress(selectedAddress);
              extractCityStateFromAddress(selectedAddress);
              extractCountryFromAddress(selectedAddress);
            }}
          />
        </View>
        <View style={{ marginBottom: 20 }}>
          <AddressAutoComplete
            apiKey={GOOGLE_KEY}
            value={secondaryAddress}
            countryCode={countryCode}
            placeholder="Secondary Address (Optional)"
            onSelect={(selectedAddress) => {
              setSecondaryAddress(selectedAddress);
              extractSecondaryCityState(selectedAddress); // ✅ correct
              extractSecondaryCountry(selectedAddress);
            }}
          />
        </View>
        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#777"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#777"
            style={styles.input}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <SliderButton
          isClickButton={true}
          onSubmit={() => {
            if (!netInfo) {
              CustomToast.show("No internet connection");
            } else {
              SignUpUser();
            }
          }}
          btncolor={"#69BE7E"}
          buttonTitle={'Sign up'}
          loader={buttonLoader}
        />


        {/* <TouchableOpacity onPress={() => SignUpUser()} style={styles.signupBtn}>
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity> */}


        <Text style={styles.orText}>or Sign in with</Text>


        <View style={styles.socialContainer}>
          <TouchableOpacity>
            <Image
              source={require("../../assets/image/google.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require("../../assets/image/facebook.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={require("../../assets/image/apple.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>


        <Text style={styles.footerText}>
          Already Have Account?{" "}
          <Text
            style={styles.loginLink}
            onPress={() => navigation.navigate("Login")}
          >
            Log in
          </Text>
        </Text>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 40,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 55,
    marginBottom: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  signupBtn: {
    backgroundColor: "#69BE7E",
    borderRadius: 25,
    paddingVertical: 20,
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  orText: {
    textAlign: "center",
    color: "#000",
    marginVertical: 20,
    fontSize: 15,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 25,
    marginBottom: 20,
  },
  socialIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  footerText: {
    textAlign: "center",
    color: "#000",
    fontSize: 15,
  },
  loginLink: {
    color: "#69BE7E",
    fontWeight: "600",
    fontWeight: '700'
  },
});

function mapStateToProps(state) {
  return {
    deviceToken: state.auth.deviceToken,
    userData: state.auth.userData,
  }
}

const mapDispatchToProps = {
  signUp: SIGNUP,
}
export default connect(mapStateToProps, mapDispatchToProps)(SignupScreen);
