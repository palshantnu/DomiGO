import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import colors from "../theme/colors";
import { CustomToast } from "../helpers/CommonHelpers";
import useAPI from "../helpers/useAPI";
import { useNavigation } from "@react-navigation/native";
import { getPersonalProfileDataAction, updatePersonalInfoAction } from "../redux/actions/action-creator";
import { getUserPersonalDataSelelctor } from "../redux/selectors/common";
import { changePasswordService } from "../services/Services";
import { connect } from "react-redux";
import { SliderButton } from "../components/SliderButton";
import NetInfo from '@react-native-community/netinfo';

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const { callApi } = useAPI();
  const [netInfo, setNetInfo] = useState(true);
  const [buttonLoader, setButtonLoader] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  React.useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetInfo(state.isConnected);
    });

    return () => unsubscribe();
  }, []);


  const handleChangePassword = async () => {

    if (!currentPassword || !newPassword || !confirmPassword) {
      return CustomToast.show("Please fill all fields");
    }

    if (newPassword !== confirmPassword) {
      return CustomToast.show("New password & confirm password must match");
    }
    setButtonLoader(true);
    const payload = {
      oldPassword: currentPassword,
      newPassword: newPassword,
    };
    changePasswordService(payload).then((res) => {
      console.log("res====>", res);
      setButtonLoader(true);
      if (res.data.success) {
        CustomToast.show("Password updated successfully");
        navigation.goBack();

      }
    }).catch(() => {
      setButtonLoader(true);
      CustomToast.show(i18n.t('something_went_wrong'));
    })

      .catch(() => {
        setButtonLoader(true);
        CustomToast.show("Something went wrong");
      });
  };

  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={["top", "left", "right"]} style={styles.container}>
        <Header title="Change Password" />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Update Password</Text>

            <View style={styles.inputCard}>
              <PasswordInput
                icon="lock-closed-outline"
                placeholder="Current Password"
                value={currentPassword}
                setValue={setCurrentPassword}
                secureTextEntry={!showCurrent}
                togglePassword={() => setShowCurrent(!showCurrent)}
              />

              <PasswordInput
                icon="lock-closed-outline"
                placeholder="New Password"
                value={newPassword}
                setValue={setNewPassword}
                secureTextEntry={!showNew}
                togglePassword={() => setShowNew(!showNew)}
              />

              <PasswordInput
                icon="lock-closed-outline"
                placeholder="Confirm New Password"
                value={confirmPassword}
                setValue={setConfirmPassword}
                secureTextEntry={!showConfirm}
                togglePassword={() => setShowConfirm(!showConfirm)}
              />
            </View>
          </View>
          <View style={{alignSelf:'center',width:'90%'}}>
          <SliderButton
            isClickButton={true}
            onSubmit={() => {
              if (!netInfo) {
                CustomToast.show("No internet connection");
              } else {
                handleChangePassword();
              }
            }}
            buttonTitle={'Update Password'}
            loader={buttonLoader}
          />
          </View>
          {/* <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
            <Text style={styles.saveButtonText}>Update Password</Text>
          </TouchableOpacity> */}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const PasswordInput = ({
  icon,
  placeholder,
  value,
  setValue,
  secureTextEntry,
  togglePassword,
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
    />

    <TouchableOpacity onPress={togglePassword}>
      <Ionicons
        name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
        size={20}
        color="#595959"
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },

  section: { marginTop: 30, paddingHorizontal: 15 },

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
    borderRadius: 10,
  },

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

  textInput: {
    flex: 1,
    fontSize: 14,
    backgroundColor: "#F2F2F2",
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
const mapStateToProps = (state) => ({
  userPersonalData: getUserPersonalDataSelelctor(state),
});

const mapDispatchToProps = {
  getPersonalProfileDataAction,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ChangePasswordScreen);

