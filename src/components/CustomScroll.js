import React, { useRef, useState } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";

const { height: windowHeight } = Dimensions.get("window");

const CustomScroll = ({ children }) => {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(1);
  const [scrollViewHeight, setScrollViewHeight] = useState(0);

  // Calculate indicator size dynamically
  const indicatorSize =
    contentHeight > scrollViewHeight
      ? (scrollViewHeight * scrollViewHeight) / contentHeight
      : scrollViewHeight;

  const difference =
    scrollViewHeight > indicatorSize
      ? scrollViewHeight - indicatorSize
      : 1;

  const scrollIndicator = Animated.multiply(
    scrollY,
    scrollViewHeight / contentHeight
  ).interpolate({
    inputRange: [0, difference],
    outputRange: [0, difference],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1 }}>

      <Animated.ScrollView
        style={{ flex: 1 }}   // ✅ IMPORTANT LINE
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onContentSizeChange={(w, h) => setContentHeight(h)}
        onLayout={e => setScrollViewHeight(e.nativeEvent.layout.height)}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {children}
      </Animated.ScrollView>

      {/* Custom Scroll Indicator */}
      {scrollViewHeight > 0 && (
        <View style={styles.indicatorTrack}>
          <Animated.View
            style={[
              styles.indicator,
              {
                height: indicatorSize,
                transform: [{ translateY: scrollIndicator }],
              },
            ]}
          />
        </View>
      )}

    </View>
  );

};

const styles = StyleSheet.create({
  indicatorTrack: {
    position: "absolute",
    right: 2,
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: "#EEE3FF",
    borderRadius: 2,
  },
  indicator: {
    width: 8,
    backgroundColor: "#28a0dd",
    borderRadius: 2,
  },
});

export default CustomScroll;
