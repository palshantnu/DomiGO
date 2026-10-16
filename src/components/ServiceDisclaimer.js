import React from "react";
import { Text, StyleSheet } from "react-native";

const ServiceDisclaimer = ({ style }) => (
  <Text style={[styles.text, style]}>
    The Service is not tax advice, legal advice, or a substitute for a
    qualified tax professional or attorney.
  </Text>
);

const styles = StyleSheet.create({
  text: {
    fontSize: 12,
    lineHeight: 17,
    color: "#777",
    textAlign: "center",
    marginTop: 20,
  },
});

export default ServiceDisclaimer;
