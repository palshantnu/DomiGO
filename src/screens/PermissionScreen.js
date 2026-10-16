import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DISCLOSURE_TITLE,
  DISCLOSURE_PARAGRAPHS,
  requestLocationAfterDisclosure,
  declineLocationDisclosure,
} from "../helpers/locationPermission2";


// Prominent disclosure for location data (Google Play User Data policy). The
// system permission prompt is only shown after the user taps "Agree & Continue";
// this screen must never advance or request the permission on its own.
const PermissionScreen = ({ route }) => {
  const screenname = route.params?.screenname || 'Login';
  const navigation = useNavigation();

  const [requesting, setRequesting] = useState(false);

  const onAgree = async () => {
    if (requesting) return;
    setRequesting(true);
    await requestLocationAfterDisclosure();
    setRequesting(false);
    navigation.navigate(screenname);
  };

  const onDecline = () => {
    if (requesting) return;
    declineLocationDisclosure();
    navigation.navigate(screenname);
  };

  return (

    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: 'none' }}>
        <ScrollView showsVerticalScrollIndicator={false}>

          <View style={styles.header}>
            <Text style={styles.title}>{DISCLOSURE_TITLE}</Text>

            <Text style={styles.subtitle}>
              Please read how DomiGO collects and uses your location before
              you decide whether to allow location access.
            </Text>
          </View>


          <View style={styles.card}>

            <Text style={styles.sectionTitle}>Location Access</Text>

            {DISCLOSURE_PARAGRAPHS.map((paragraph) => (
              <Text key={paragraph} style={styles.sectionDesc}>
                {paragraph}
              </Text>
            ))}

            <View style={styles.line} />

            <TouchableOpacity
              style={[styles.agreeButton, requesting && styles.buttonDisabled]}
              onPress={onAgree}
              disabled={requesting}
            >
              <Text style={styles.agreeText}>Agree & Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.declineButton}
              onPress={onDecline}
              disabled={requesting}
            >
              <Text style={styles.declineText}>No Thanks</Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>

  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },


  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
  },

  card: {
    backgroundColor: "#fff",
    marginTop: -40,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    // elevation: 3,
    minHeight: 480,
  },

  line: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  sectionDesc: {
    fontSize: 14,
    color: "#374151",
    marginTop: 12,
    lineHeight: 20,
  },

  agreeButton: {
    backgroundColor: "#69BE7E",
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  agreeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  declineButton: {
    paddingVertical: 14,
    marginTop: 8,
    alignItems: "center",
  },

  declineText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "600",
  },
});
