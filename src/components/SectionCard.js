import React from "react";
import { View, Text, StyleSheet } from "react-native";

const SectionCard = ({ title, children }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
};

export default SectionCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 18,
    marginBottom: 20,
    elevation: 2
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10
  }
});