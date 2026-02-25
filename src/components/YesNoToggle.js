import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import colors from "../theme/colors";

const YesNoToggle = ({ value, onChange }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, value === true && styles.yesActive]}
        onPress={() => onChange(true)}
      >
        <Text style={styles.text}>Yes</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, value === false && styles.noActive]}
        onPress={() => onChange(false)}
      >
        <Text style={styles.text}>No</Text>
      </TouchableOpacity>
    </View>
  );
};

export default YesNoToggle;

const styles = StyleSheet.create({
  container: { flexDirection: "row", marginTop: 8 },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 25,
    alignItems: "center",
    backgroundColor: "#F1F1F1",
    marginHorizontal: 5
  },
  yesActive: { backgroundColor: colors.primary },
  noActive: { backgroundColor: "#E74C3C" },
  text: { color: "#fff", fontWeight: "600" }
});