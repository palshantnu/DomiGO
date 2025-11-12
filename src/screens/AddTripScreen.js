import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import colors from "../theme/colors";

export default function AddTripScreen() {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Add New Trip</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Trip Details</Text>


          <Text style={styles.label}>Origin Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="location-outline" size={18} color="#666" />
            <TextInput
              placeholder="e.g., New York City, NY"
              placeholderTextColor="#aaa"
              style={styles.textInput}
              value={origin}
              onChangeText={setOrigin}
            />
          </View>
          <Text style={styles.label}>Destination Location</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={18} color="#666" />
            <TextInput
              placeholder="e.g., Los Angeles, CA"
              placeholderTextColor="#aaa"
              style={styles.textInput}
              value={destination}
              onChangeText={setDestination}
            />
          </View>
          <Text style={styles.label}>Travel Dates</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.dateText}>
                {startDate || "July 15, 2024"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateBox}>
              <Ionicons name="calendar-outline" size={18} color="#666" />
              <Text style={styles.dateText}>
                {endDate || "July 20, 2024"}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>Notes</Text>
          <TextInput
            placeholder="e.g., Business trip for annual conference..."
            placeholderTextColor="#aaa"
            multiline
            numberOfLines={3}
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
          />
          <Text style={styles.label}>Attachments</Text>
          <TouchableOpacity style={styles.attachmentBox}>
            <Ionicons name="attach-outline" size={18} color="#666" />
            <Text style={styles.attachmentText}>Add document or photo</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.saveButton}>
          <Text style={styles.saveButtonText}>Save Trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
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
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    padding: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 15,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#000",
    marginTop: 12,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: "#fff",
  },
  textInput: {
    flex: 1,
    color: "#000",
    marginLeft: 8,
    fontSize: 14,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 45,
    backgroundColor: "#fff",
    width: "48%",
  },
  dateText: {
    marginLeft: 8,
    color: "#000",
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
    color: "#000",
    fontSize: 14,
  },
  attachmentBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#ddd",
    borderRadius: 8,
    height: 45,
    marginTop: 5,
  },
  attachmentText: {
    color: "#666",
    fontSize: 14,
    marginLeft: 6,
  },
  saveButton: {
    backgroundColor: colors.primary || "#007AFF",
    borderRadius: 8,
    paddingVertical: 14,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 30,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
