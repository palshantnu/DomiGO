import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { pick } from "@react-native-documents/picker";

const DocumentUpload = ({ value, onChange }) => {
  const pickFile = async () => {
    const res = await pick({ allowMultiSelection: false });
    if (res?.[0]) onChange(res[0]);
  };

  return (
    <TouchableOpacity style={styles.box} onPress={pickFile}>
      <Ionicons name="cloud-upload-outline" size={18} />
      <Text style={{ marginLeft: 8 }}>
        {value ? value.name : "Upload Document (Optional)"}
      </Text>
    </TouchableOpacity>
  );
};

export default DocumentUpload;

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    marginTop: 10
  }
});