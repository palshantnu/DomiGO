import React from "react";
import { View, Image, StyleSheet, ImageBackground } from "react-native";

const SplashScreen = () => {
  return (
    <ImageBackground
      source={require("../assets/image/introbg.png")} 
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Image
          source={require("../assets/image/domigo.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  overlay: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },

  logo: {
    width: 160,
    height: 160,
  },
});
