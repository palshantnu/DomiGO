import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";


const PermissionScreen = ({ route }) => {
  const { screenname } = route.params;
  const navigation = useNavigation();

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [offlineSync, setOfflineSync] = useState(true);
  // useEffect(() => {
  //   if (locationEnabled && offlineSync) {
  //     navigation.navigate(screenname)
  //   }

  // }, [locationEnabled, offlineSync])


  useEffect(() => {
  let timer;

  if (locationEnabled && offlineSync) {
    timer = setTimeout(() => {
      navigation.navigate(screenname);
    }, 2000); // 2 seconds delay
  }

  return () => {
    if (timer) clearTimeout(timer);
  };
}, [locationEnabled, offlineSync]);

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
            <Text style={styles.title}>Grant Essential Permissions</Text>

            <Text style={styles.subtitle}>
              ResiTrack Tax requires Location and Motion & Fitness data to
              accurately track your residency days across states. Please grant
              these permissions to get started.
            </Text>
          </View>


          <View style={styles.card}>


            <View style={styles.line} />


            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Location Access</Text>
              <Switch
                value={locationEnabled}
                onValueChange={(val) => setLocationEnabled(val)}
                trackColor={{ false: "#D1D5DB", true: "#7ED957" }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionDesc}>
              Allow ResiTrack to access your location in the background to
              automatically track your residency days across states. This data
              is essential for accurate tax calculations.
            </Text>

            <View style={styles.line} />


            <View style={styles.row}>
              <Text style={styles.sectionTitle}>Offline Sync</Text>
              <Switch
                value={offlineSync}
                onValueChange={(val) => setOfflineSync(val)}
                trackColor={{ false: "#D1D5DB", true: "#7ED957" }}
                thumbColor="#fff"
              />
            </View>

            <Text style={styles.sectionDesc}>
              Enable offline sync and calendar sync to manage data in the local
              database until it is synced to the cloud.
            </Text>

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

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },

  sectionDesc: {
    fontSize: 13,
    color: "#4B5563",
    marginTop: 8,
    lineHeight: 18,
  },
});
