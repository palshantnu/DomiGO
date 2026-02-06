import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "../components/Header";
import { connect } from "react-redux";
import { GET_ABOUT_APP, } from '../redux/actions/action-creator';
import { useNavigation } from "@react-navigation/native";


const AboutUsScreen = ({ GET_ABOUT_APP, aboutApp }) => {

  useEffect(() => {
    GET_ABOUT_APP();
  }, []);
  console.log('aboutApp', aboutApp);

  const openWebsite = () => {
    Linking.openURL("https://www.domigo.app");
  };
  const navigation = useNavigation();
  return (
    <LinearGradient
      colors={["#9ab1fa", "#ffffff"]}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Header title="About Us" navigation={navigation} />

        {aboutApp?.length > 0 && < ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* About Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>About DomiGo</Text>

            <Text style={styles.description}>
              {aboutApp[0]?.aboutText}
            </Text>

            {/* Website */}
            <TouchableOpacity style={styles.row} onPress={openWebsite}>
              <View style={styles.rowLeft}>
                <Ionicons name="globe-outline" size={18} color="#2563EB" />
                <Text style={styles.rowText}>{aboutApp[0]?.websiteUrl}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>App Information</Text>

            <View style={styles.infoRow}>
              <Text style={styles.label}>iOS Version</Text>
              <Text style={styles.value}>{aboutApp[0]?.iosVersion}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Build Number</Text>
              <Text style={styles.value}>{aboutApp[0]?.buildNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Created By</Text>
              <Text style={styles.value}>
                {aboutApp[0]?.createdBy}
              </Text>
            </View>
          </View>

          {/* Footer Logo */}
          <View style={styles.footer}>
            <Image
              //   source={require("../assets/image/domigo.png")}
              source={require("../assets/image/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Go Home Technologies LLC
            </Text>
          </View>
        </ScrollView>}
      </SafeAreaView>
    </LinearGradient >
  );
};
function mapStateToProps(state) {
  return {
    userData: state.auth.userData,
    loginToken: state.auth.loginToken,
    aboutApp: state.common.aboutApp,
  };
}


const mapDispatchToProps = {
  GET_ABOUT_APP,
};

export default connect(mapStateToProps, mapDispatchToProps)(AboutUsScreen);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    flexGrow: 1,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
    marginBottom: 14,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowText: {
    fontSize: 14,
    color: "#2563EB",
    marginLeft: 10,
    fontWeight: "500",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  label: {
    fontSize: 14,
    color: "#475569",
  },

  value: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },

  footer: {
    marginTop: "auto",
    alignItems: "center",
    paddingTop: 30,
  },

  logo: {
    height: 26,        // 🔹 small
    width: 100,
    marginBottom: 8,
  },

  footerText: {
    fontSize: 12,
    color: "#64748B",
  },
});
