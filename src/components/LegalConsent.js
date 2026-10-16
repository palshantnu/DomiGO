import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { CustomToast } from "../helpers/CommonHelpers";

// Website ke full sections ke links
export const PRIVACY_POLICY_URL = "https://stage.mydomigo.com/privacy-policy";
export const TERMS_OF_SERVICE_URL = "https://stage.mydomigo.com/terms-of-service";

export const LEGAL_CONSENT_INITIAL = { legal: false, age: false };

// Jo checkbox abhi tick nahi hua uska message deta hai, sab tick ho to null
export const getLegalConsentError = (consent) => {
  if (!consent.legal) return "Please accept the Privacy Policy and Terms of Service";
  if (!consent.age) return "Please confirm you are 16 years or older";
  return null;
};

const openLink = (url) => {
  Linking.openURL(url).catch(() => CustomToast.show("Unable to open link"));
};

const ConsentRow = ({ checked, onToggle, children }) => (
  <View style={styles.row}>
    <TouchableOpacity
      onPress={onToggle}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
    >
      <Ionicons
        name={checked ? "checkbox" : "square-outline"}
        size={22}
        color={checked ? "#29A0DD" : "#666"}
      />
    </TouchableOpacity>
    <Text style={styles.label} onPress={onToggle}>
      {children}
    </Text>
  </View>
);

const LegalConsent = ({ value, onChange, style }) => {
  const toggle = (key) => onChange({ ...value, [key]: !value[key] });

  return (
    <View style={style}>
      <ConsentRow checked={value.legal} onToggle={() => toggle("legal")}>
        I’ve read the{" "}
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => openLink(PRIVACY_POLICY_URL)}
        >
          Privacy Policy
        </Text>
        {" "}and agree to the{" "}
        <Text
          style={styles.link}
          accessibilityRole="link"
          onPress={() => openLink(TERMS_OF_SERVICE_URL)}
        >
          Terms of Service
        </Text>
      </ConsentRow>

      <ConsentRow checked={value.age} onToggle={() => toggle("age")}>
        I am 16 years or older
      </ConsentRow>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 10,
  },
  label: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    lineHeight: 22,
    color: "#333",
  },
  link: {
    color: "#29A0DD",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});

export default LegalConsent;
