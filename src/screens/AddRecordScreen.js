import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import colors from "../theme/colors";
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from "react-native-linear-gradient";
import Header from "../components/Header";
import Ionicons from "react-native-vector-icons/Ionicons";


export default function AddRecordScreen() {
  const [stateRegion, setStateRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <LinearGradient
      colors={['#9ab1fa', '#ffffff']}
      start={{ x: 1, y: 0 }}
      end={{ x: 0.8, y: 0.4 }}
      locations={[0.05, 0.55]}
      style={styles.container}
    >
      <SafeAreaView edges={['top', 'left', 'right']} tyle={styles.container}>
        <Header title="Travel Record" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Residency
              Period</Text>
            {/* <TouchableOpacity onPress={() => navigation.navigate('AddRecord')} style={styles.addTripButton}>
              <Ionicons style={{ backgroundColor: colors.primary, borderRadius: 40 }} name="add" size={20} color={colors.white} />
              <Text style={styles.addTripText}>Add Trip</Text>
            </TouchableOpacity> */}
          </View>
          <View style={styles.card}>

            <View style={styles.inputWrapper}>
              <Ionicons name="globe-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="State/Region"
                placeholderTextColor="#999"
                value={stateRegion}
                onChangeText={setStateRegion}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Start Date"
                placeholderTextColor="#999"
                value={startDate}
                onChangeText={setStartDate}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="End Date"
                placeholderTextColor="#999"
                value={endDate}
                onChangeText={setEndDate}
              />
            </View>

          </View>



          <View style={{ ...styles.card, marginTop: 0 }}>
            <View style={[styles.inputWrapper, { height: 120, alignItems: "flex-start", paddingTop: 14 }]}>
              <Ionicons name="document-text-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { textAlignVertical: "top" }]}
                placeholder="Leave Note..."
                placeholderTextColor="#999"
                multiline
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>



          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Record</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
  },

  card: {
    // backgroundColor: "#fff",
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    borderRadius: 10,
    // borderWidth: 1,
    borderColor: "#eee",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },



  textArea: {
    height: 90,
    textAlignVertical: "top",
  },

  saveButton: {
    marginTop: 25,
    marginHorizontal: 15,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 14,
    paddingHorizontal: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  addTripButton: {
    flexDirection: "row",
    alignItems: "center",
    // borderWidth: 1,
    // borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#F1F1F1",
    padding: 5
  },
  addTripText: {
    color: '#000',
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 15,
    backgroundColor: "#F8F8F8",
    height: 58,
    paddingHorizontal: 14,
    marginBottom: 12,
  }
  , inputIcon: {
    marginRight: 10
  }
  , input: {
    flex: 1,
    fontSize: 14,
    color: "#000",
  }

});
