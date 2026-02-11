import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  PermissionsAndroid,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import {
  getPersonalProfileDataAction,
  updatePersonalInfoAction
} from "../redux/actions/action-creator";
import { getUserPersonalDataSelelctor } from "../redux/selectors/common";
import colors from "../theme/colors";
import { connect } from "react-redux";
import { CustomToast, GOOGLE_KEY } from "../helpers/CommonHelpers";
import useAPI from "../helpers/useAPI";
import { useNavigation } from "@react-navigation/native";
import NetInfo from '@react-native-community/netinfo';
import { SliderButton } from "../components/SliderButton";
import Geolocation from '@react-native-community/geolocation'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import GoogleAutoComplete from '../components/GoogleAutoComplete';
import { launchCamera, launchImageLibrary } from "react-native-image-picker";


const ProfileManagementScreen = ({
  userPersonalData,
  getPersonalProfileDataAction,
  updatePersonalInfoAction,
}) => {
  const [netInfo, setNetInfo] = useState(true);
  const [buttonLoader, setButtonLoader] = useState(false);
  const { callApi: callUpdatePersonalInfoApi } = useAPI();
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [city, setCity] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);



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



  useEffect(() => {
    getPersonalProfileDataAction();
  }, []);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetInfo(state.isConnected);
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (userPersonalData) {
      setName(userPersonalData.name ?? "");
      setAddress(userPersonalData.address ?? "");
      setMobile(userPersonalData.mobile ?? "");
      setCity(userPersonalData.city ?? "");
      setStateName(userPersonalData.state ?? "");
      setProfileImage(userPersonalData.profileImageSignedUrl ?? null);
      setProfileImageUrl(userPersonalData.profileImageSignedUrl);
      setProfileImageFile(null);
    }
  }, [userPersonalData]);

  const personalData = {
    name,
    mobile,
    address,
    state: stateName,
    city,
    profileImage
    // current_password: currentPassword,
    // new_password: newPassword,
  };
  console.log('personalData', personalData);

  const createFormData = () => {
    const formData = new FormData();

    formData.append("name", name);
    formData.append("mobile", mobile);
    formData.append("address", address);
    formData.append("state", stateName);
    formData.append("city", city);

    // if (profileImage) {
    //   formData.append("profileImage", {
    //     uri: profileImage.uri,
    //     name: profileImage.fileName || "profile.jpg",
    //     type: profileImage.type || "image/jpeg",
    //   });
    // }
    // if (profileImage) {
    //   formData.append("profileImage", {
    //     uri:
    //       Platform.OS === "android"
    //         ? profileImage.uri
    //         : profileImage.uri.replace("file://", ""),
    //     name: profileImage.fileName || "profile.jpg",
    //     type: profileImage.type || "image/jpeg",
    //   });
    // }
    if (profileImageFile) {
      formData.append("profileImage", {
        uri: profileImageFile.uri,
        name: profileImageFile.fileName,
        type: profileImageFile.type,
      });
    }


    return formData;
  };


  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
    }
  };

  // useEffect(() => {
  //   requestLocationPermission().then(() => {
  //     Geolocation.getCurrentPosition(
  //       position => {
  //         console.log('dhsbvbdhvb',position.coords);
  //       },
  //       error => console.log(error),
  //       { enableHighAccuracy: true }
  //     );
  //   });
  // }, []);


  // useEffect(() => {
  //   const getLocation = async () => {
  //     try {
  //       Geolocation.getCurrentPosition(
  //         async position => {
  //           // try {
  //             const { latitude, longitude } = position.coords;
  //             console.log('latitude','longitude', longitude,latitude);


  //             // const response = await fetch(
  //             //   `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_KEY}`
  //             // );

  //             // const json = await response.json();

  //             // if (
  //             //   json.results &&
  //             //   json.results.length > 0 &&
  //             //   json.results[0].address_components
  //             // ) {
  //             //   const countryData = json.results[0].address_components.find(c =>
  //             //     c.types.includes("country")
  //             //   );

  //             //   setCountry(countryData?.long_name || "");
  //             // }
  //       //     } catch (apiError) {
  //       //       console.log("API Error:", apiError);
  //       //     }
  //       //   },
  //       //   error => {
  //       //     console.log("Geolocation Error:", error);
  //         },
  //       //   { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  //       );
  //     } catch (err) {
  //       console.log("Location Catch Error:", err);
  //     }
  //   };

  //   getLocation();
  // }, []);
  const openImagePicker = () => {
    Alert.alert(
      "Select Image",
      "Choose an option",
      [
        { text: "Camera", onPress: openCamera },
        { text: "Gallery", onPress: openGallery },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: "photo",
        cameraType: "back",
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        setProfileImageFile(response.assets[0]);
      }
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: "photo",
        quality: 0.7,
      },
      (response) => {
        if (response.didCancel || response.errorCode) return;
        setProfileImageFile(response.assets[0]);
      }
    );
  };

  useEffect(() => {
    console.log("Selected Image:", profileImage);
  }, [profileImage]);



  const UpdateProfile = async () => {
    const formData = createFormData();
    setButtonLoader(true);
    callUpdatePersonalInfoApi(updatePersonalInfoAction(formData))
      .then((res) => {
        console.log('res--->', res);
        setButtonLoader(false);
        if (res.data.success) {
          CustomToast.show("Profile updated successfully");
          navigation.goBack();
        }

      })
      .catch((e) => {
        setButtonLoader(false);
        console.log('res--->', e);
        CustomToast.show("Something went wrong");
      });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <LinearGradient
        colors={["#9ab1fa", "#ffffff"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.8, y: 0.4 }}
        locations={[0.05, 0.55]}
        style={styles.container}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
          <Header title="Profile Management" />

          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.profileWrapper}>
              <TouchableOpacity onPress={openImagePicker}>
                <Image
                  source={{
                    uri: profileImageFile?.uri
                      ? profileImageFile.uri
                      : profileImageUrl
                        ? profileImageUrl
                        : "https://cdn-icons-png.flaticon.com/128/3135/3135715.png",
                  }}
                  style={styles.profileImage}
                />

                <TouchableOpacity style={styles.plusButton}>
                  <Ionicons name="add" size={18} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>

              <Text style={styles.profileName}>{name || "User"}</Text>
              <Text style={styles.profileEmail}>
                {userPersonalData?.email ?? "user@gmail.com"}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Info</Text>

              <View style={styles.inputCard}>
                <InfoInput
                  icon="person-outline"
                  placeholder="Full Name"
                  value={name}
                  setValue={setName}
                />



                <InfoInput
                  icon="call-outline"
                  placeholder="Mobile Number"
                  value={mobile}
                  setValue={setMobile}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                <InfoInput
                  icon="location-outline"
                  placeholder="Address"
                  value={address}
                  setValue={setAddress}
                />

                {/* <GoogleAutoComplete
                placeholder="Select Country"
                apiKey={GOOGLE_KEY}
                type="(countries)"
                onSelect={(value, details) => {
                  const countryComponent = details.address_components.find(c =>
                    c.types.includes("country")
                  );

                  setCountry(countryComponent.long_name);
                  setCountryCode(countryComponent.short_name.toLowerCase());

                  setStateName("");
                  setCity("");
                }}
              /> */}
                <View style={{ marginHorizontal: 0, marginTop: 0 }}>
                  {/* <Text style={styles.sectionTitle}>State</Text> */}

                  {/* <GoogleAutoComplete
                  placeholder="Search State"
                  apiKey={GOOGLE_KEY}
                  country={country?.slice(0, 2).toLowerCase()}
                  type="(regions)"
                  onSelect={(value) => {
                    setStateName(value);
                    setCity("");
                  }}
                /> */}
                  {/* <GoogleAutoComplete
                    placeholder="Search State"
                    apiKey={GOOGLE_KEY}
                    country={countryCode}
                    countryCode={countryCode}
                    type="(regions)"
                    onSelect={(value) => {
                      setStateName(value);
                      setCity("");
                    }}
                  /> */}
                  <GoogleAutoComplete
                    placeholder="Search State"
                    apiKey={GOOGLE_KEY}
                    countryCode={countryCode}
                    isStateSearch={true}
                    value={stateName}
                    onSelect={(value) => {
                      setStateName(value);
                      setCity("");
                    }}
                  />
                </View>
                <View style={{ marginHorizontal: 0, marginTop: 10 }}>
                  {/* <Text style={styles.sectionTitle}>City</Text> */}

                  {/* <GoogleAutoComplete
                  placeholder="Search City"
                  apiKey={GOOGLE_KEY}
                  country={country?.slice(0, 2).toLowerCase()}
                  type="(cities)"
                  onSelect={(value) => {
                    setCity(value);
                  }}
                /> */}
                  {/* <GoogleAutoComplete
                    placeholder="Search City"
                    apiKey={GOOGLE_KEY}
                    country={countryCode}
                    type="(cities)"
                    countryCode={countryCode}
                    components={`country:${countryCode}`}
                    onSelect={(value) => {
                      setCity(value);
                    }}
                  /> */}
                  <GoogleAutoComplete
                    placeholder="Search City"
                    apiKey={GOOGLE_KEY}
                    countryCode={countryCode}
                    stateName={stateName}
                    isStateSearch={false}
                    onSelect={setCity}
                    value={city}
                  />

                </View>

              </View>
            </View>
            <View style={{ width: '90%', alignSelf: 'center' }}>
              <SliderButton
                isClickButton={true}
                onSubmit={() => {
                  if (!netInfo) {
                    CustomToast.show("No internet connection");
                  } else {
                    UpdateProfile();
                  }
                }}
                buttonTitle={'Save Changes'}
                loader={buttonLoader}
              />
            </View>
            {/* <TouchableOpacity style={styles.saveButton} onPress={UpdateProfile}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity> */}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const InfoInput = ({
  icon,
  placeholder,
  value,
  setValue,
  secureTextEntry,
  isPassword,
  togglePassword,
  keyboardType,
  maxLength
}) => (
  <View style={styles.inputRow}>
    <Ionicons name={icon} size={18} color="#595959" style={styles.inputIcon} />

    <TextInput
      style={styles.textInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      value={value}
      onChangeText={setValue}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      maxLength={maxLength}
    />

    {isPassword && (
      <TouchableOpacity onPress={togglePassword}>
        <Ionicons
          name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
          size={20}
          color="#595959"
        />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileWrapper: { alignItems: "center", marginTop: 25 },
  profileImage: { height: 100, width: 100, borderRadius: 50 },
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
  profileEmail: { fontSize: 14, color: colors.textLight },
  section: { marginTop: 30, paddingHorizontal: 15 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 10,
  },
  inputCard: { backgroundColor: "#fff", paddingVertical: 8, paddingHorizontal: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: '#F2F2F2',
    borderRadius: 25,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  inputIcon: { padding: 8, marginRight: 10 },
  textInput: { flex: 1, fontSize: 14, backgroundColor: "#F2F2F2", color: '#111' },
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

const mapStateToProps = (state) => ({
  userPersonalData: getUserPersonalDataSelelctor(state),
});

const mapDispatchToProps = {
  getPersonalProfileDataAction,
  updatePersonalInfoAction,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProfileManagementScreen);
