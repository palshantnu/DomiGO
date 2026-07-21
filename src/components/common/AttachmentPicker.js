import React from "react";
import {
  TouchableOpacity,
  Text,
  Platform,
  ActionSheetIOS,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

import {
  launchCamera,
  launchImageLibrary,
} from "react-native-image-picker";

import { pick } from "@react-native-documents/picker";

const AttachmentPicker = ({ value, onChange, style }) => {
  const openCamera = async () => {
    const result = await launchCamera({
      mediaType: "photo",
      quality: 0.8,
    });

    if (!result.didCancel && result.assets?.length) {
      onChange(result.assets[0]);
    }
  };

  const openPhotos = async () => {
    const result = await launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
    });

    if (!result.didCancel && result.assets?.length) {
      onChange(result.assets[0]);
    }
  };

  const openFiles = async () => {
    try {
      const result = await pick({
        allowMultiSelection: false,
      });

      if (result?.length) {
        onChange(result[0]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  const openPicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Photos", "Files"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            // case 1:
            //   openCamera();
            //   break;

            case 1:
              openPhotos();
              break;

            case 2:
              openFiles();
              break;
          }
        }
      );
    } else {
      Alert.alert(
        "Select Attachment",
        "",
        [
        //   {
        //     text: "Camera",
        //     onPress: openCamera,
        //   },
          {
            text: "Photos",
            onPress: openPhotos,
          },
          {
            text: "Files",
            onPress: openFiles,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={style}
      onPress={openPicker}
    >
      <Ionicons
        name="cloud-upload-outline"
        size={20}
        color="#9E9EA7"
      />

      <Text
        style={{
          flex: 1,
          marginLeft: 12,
          color: value ? "#000" : "#999",
        }}
      >
        {value?.fileName ||
          value?.name ||
          "Upload PDF / Image"}
      </Text>
    </TouchableOpacity>
  );
};

export default AttachmentPicker;