import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
  Platform,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { connect } from "react-redux";
import { SIGNIN } from "../../redux/actions/action-creator";
import { CustomToast } from "../../helpers/CommonHelpers";
import { SliderButton } from "../../components/SliderButton";
import NetInfo from '@react-native-community/netinfo';
import useAPI from '../../helpers/useAPI';
import { startBackgroundLocation } from "../../helpers/LocationTracker";
import { startDomigoTracking } from "../../helpers/MainTracker";
import DomigoTracker from "../../helpers/MainTracker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import appleAuth from '@invertase/react-native-apple-authentication';
import messaging from '@react-native-firebase/messaging';

GoogleSignin.configure({
  webClientId: '354808270826-gns6qrt56geta1g46vv26j9l3n3jk415.apps.googleusercontent.com', // Firebase se
});


const LoginScreen = ({ navigation, signIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { callApi: callLoginApi, loading: loginLoading } = useAPI();
  const [netInfo, setNetInfo] = useState(true);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [fcmtoken, setFcmtoken] = useState("");



  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!netInfo) {
      CustomToast.show("No internet connection");
      return false;
    }
    if (!email.trim()) {
      CustomToast.show("Please enter email");
      return false;
    }
    if (!emailRegex.test(email.trim())) {
      CustomToast.show("Please enter a valid email");
      return false;
    }
    if (!password.trim()) {
      CustomToast.show("Please enter password");
      return false;
    }
    return true;
  };

  const SignInUser = async () => {
    if (!validateForm()) return;

    setButtonLoader(true);
    const data = {
      email: email.trim(),
      password: password.trim(),
      deviceType: Platform.OS === "ios" ? "ios" : "android", // 👈 add
      deviceToken: fcmtoken || "123456", // 👈 redux se aa raha hai
    };
    callLoginApi(signIn(data))
      .then(async (response) => {
        console.log('response--==>', response);
        setButtonLoader(false);
        if (response.message != 'Success') {

          CustomToast.show(response?.message ?? response?.error);
        } else {
          console.log('response',response.token);
          await AsyncStorage.setItem('DOMIGO_TRACKING_ENABLED', '1');
          DomigoTracker.startDomigoTracking(response.token);
          // const { started } = await DomigoTracker.startDomigoTracking();
          navigation.reset({
            index: 0,
            routes: [{ name: "Main" }],
          });
          CustomToast.show('Login Successfully');
        }
      })
      .catch(e => {
        setButtonLoader(false);
        CustomToast.show('something_went_wrong');
        console.log('Catch Error SignIn Screen = ', e);
      });
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


  const signInWithGoogle = async () => {
    try {
      if (!netInfo) {
        CustomToast.show("No internet connection");
        return;
      }
  
      setButtonLoader(true);
  
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
  
      const userInfo = await GoogleSignin.signIn();
  
      console.log('Google userInfo 👉', userInfo);
  
      if (!userInfo.data.idToken) {
        throw new Error('idToken not received from Google');
      }
  
      const googleCredential =
        auth.GoogleAuthProvider.credential(userInfo.data.idToken);
  
      const userCredential =
        await auth().signInWithCredential(googleCredential);
  
      const firebaseToken = await userCredential.user.getIdToken();
  
      // await AsyncStorage.setItem('DOMIGO_TRACKING_ENABLED', '1');
      // DomigoTracker.startDomigoTracking(firebaseToken);
  
      // navigation.reset({
      //   index: 0,
      //   routes: [{ name: "Main" }],
      // });
  
      CustomToast.show("Google Login Success");
    } catch (error) {
      console.log("Google SignIn Error ❌", error);
      CustomToast.show(error.message || "Google Sign-In failed");
    } finally {
      setButtonLoader(false);
    }
  };
const signInWithApple = async () => {
  try {
    if (!netInfo) {
      CustomToast.show("No internet connection");
      return;
    }

    setButtonLoader(true);

    // Perform Apple sign-in request
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedOperation: appleAuth.Operation.LOGIN,
      requestedScopes: [
        appleAuth.Scope.EMAIL,
        appleAuth.Scope.FULL_NAME,
      ],
    });

    const { identityToken, nonce } = appleAuthRequestResponse;

    if (!identityToken) {
      throw new Error("Apple Sign-In failed - no identity token");
    }

    // Create Firebase credential with the nonce
    const appleCredential = auth.AppleAuthProvider.credential(
      identityToken,
      nonce
    );

    // Sign in to Firebase
    const userCredential = await auth().signInWithCredential(appleCredential);
    const firebaseToken = await userCredential.user.getIdToken();

    console.log("Apple User:", userCredential.user);

    // Here you can call your backend API with the firebaseToken
    // For example:
    // const response = await callLoginApi(signIn({ token: firebaseToken, provider: 'apple' }));
    
    // await AsyncStorage.setItem('DOMIGO_TRACKING_ENABLED', '1');
    // DomigoTracker.startDomigoTracking(firebaseToken);

    // navigation.reset({
    //   index: 0,
    //   routes: [{ name: "Main" }],
    // });

    CustomToast.show("Apple Login Success");

  } catch (error) {
    console.log("Apple SignIn Error ❌", error);
    
    if (error.code === 'auth/unknown') {
      CustomToast.show("Apple Sign-In configuration issue");
    } else {
      CustomToast.show(error.message || "Apple Sign-In failed");
    }
  } finally {
    setButtonLoader(false);
  }
};

  // const signInWithGoogle = async () => {
  //   if (!netInfo) {
  //     CustomToast.show("No internet connection");
  //     return;
  //   }
  
  //   try {
  //     setButtonLoader(true);
  
  //     // Android play services check
  //     await GoogleSignin.hasPlayServices({
  //       showPlayServicesUpdateDialog: true,
  //     });
  
  //     // Google sign-in
  //     const { idToken } = await GoogleSignin.signIn();
  
  //     // Firebase credential
  //     const googleCredential =
  //       auth.GoogleAuthProvider.credential(idToken);
  
  //     // Firebase login
  //     const userCredential = await auth().signInWithCredential(
  //       googleCredential
  //     );
  
  //     console.log('Google User:', userCredential.user);
  
  //     // OPTIONAL: token agar backend chahiye
  //     const firebaseToken = await userCredential.user.getIdToken();
  
  //     await AsyncStorage.setItem('DOMIGO_TRACKING_ENABLED', '1');
  //     DomigoTracker.startDomigoTracking(firebaseToken);
  
  //     navigation.reset({
  //       index: 0,
  //       routes: [{ name: "Main" }],
  //     });
  
  //     CustomToast.show("Login Successfully");
  //   } catch (error) {
  //     console.log('Google SignIn Error:', error);
  //     CustomToast.show("Google Sign-In failed");
  //   } finally {
  //     setButtonLoader(false);
  //   }
  // };
  

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <SafeAreaView style={styles.innerContainer}>
        <Text style={styles.welcomeTitle}>Welcome to{"\n"}DomiGo</Text>
        <Text style={styles.subtitle}>
          Modern residency tracking for a multi-location lifestyle.
        </Text>

        {/* Email Input */}
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

        {/* Password Input */}
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
        <View style={{ marginTop: 25, }} />
        <SliderButton
          isClickButton={true}
          onSubmit={() => {
            if (!netInfo) {
              CustomToast.show("No internet connection");
            } else {
              SignInUser();
            }
          }}
          buttonTitle={'LogIn'}
          loader={buttonLoader}
        />


        {/* <TouchableOpacity onPress={() => navigation.navigate('Main')} style={styles.loginBtn}>
          <Text style={styles.loginText}>Log in</Text>
        </TouchableOpacity> */}
        <TouchableOpacity>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <Text style={styles.footerText}>
          Don’t Have an Account?{" "}
        </Text>
        <SliderButton
          isClickButton={true}
          onSubmit={() => {
            navigation.navigate("Signup")
          }
          }
          btncolor={"#69BE7E"}
          buttonTitle={'Sign up'}
        />
        {/* <TouchableOpacity
          style={styles.signupBtn}
          onPress={() => navigation.navigate("Signup")}
        >
          <Text style={styles.signupText}>Sign up</Text>
        </TouchableOpacity> */}

        <Text style={styles.orText}>or Sign in with</Text>

        <View style={styles.socialContainer}>
          <TouchableOpacity onPress={signInWithGoogle}>
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
          <TouchableOpacity onPress={signInWithApple}>
            <Image
              source={require("../../assets/image/apple.png")}
              style={styles.socialIcon}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  innerContainer: {
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginVertical: 10,
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 60,
    marginTop: 20,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  forgotText: {
    color: "#29A0DD",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  loginBtn: {
    backgroundColor: "#29A0DD",
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 25,
  },
  loginText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 25,
  },
  footerText: {
    textAlign: "center",
    color: "#000",
    fontSize: 15,
    marginBottom: 10,
  },
  signupBtn: {
    backgroundColor: "#69BE7E",
    borderRadius: 25,
    paddingVertical: 18,
    alignItems: "center",
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
  },
  socialIcon: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
});
function mapStateToProps(state) {
  return {
    deviceToken: state.auth.deviceToken,
    userData: state.auth.userData,
  }
}

const mapDispatchToProps = {
  signIn: SIGNIN,
}
export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen);
