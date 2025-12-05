import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  StatusBar,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { connect } from "react-redux";
import { SIGNUP } from '../../redux/actions/action-creator';
import { CustomToast } from '../../helpers/CommonHelpers';
import NetInfo from '@react-native-community/netinfo';
import { SliderButton } from '../../components/SliderButton';

const SignupScreen = ({ navigation, signUp }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [buttonLoader, setButtonLoader] = useState(false);
  const [netInfo, setNetInfo] = useState(true);

  const SignUpUser = async () => {
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

    const data = {
      email,
      password
    }
    signUp(data, true, true).then((response) => {
      console.log('response==>', response);
      setButtonLoader(true);
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
      setButtonLoader(true);
    })
  }

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetInfo(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

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
    height: 65,
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
