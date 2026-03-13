import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { pick } from "@react-native-documents/picker";
import { useFeatureAccess } from "../hooks/useFeatureAccess";
import { FEATURES } from "../config/featureAccess";
import UpgradePromptModal from "./UpgradePromptModal";

const DocumentUpload = ({ value, onChange }) => {
  const { canAccess } = useFeatureAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isLocked = !canAccess(FEATURES.DOCUMENT_UPLOAD);

  const pickFile = async () => {
    if (isLocked) {
      setShowUpgrade(true);
      return;
    }
    const res = await pick({ allowMultiSelection: false });
    if (res?.[0]) onChange(res[0]);
  };

  return (
    <>
      <TouchableOpacity style={[styles.box, isLocked && { opacity: 0.5 }]} onPress={pickFile}>
        <Ionicons name={isLocked ? "lock-closed-outline" : "cloud-upload-outline"} size={18} />
        <Text style={{ marginLeft: 8 }}>
          {value ? value.name : "Upload Document (Optional)"}
        </Text>
      </TouchableOpacity>
      <UpgradePromptModal
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureName="Document Upload"
      />
    </>
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