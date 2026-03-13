import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import colors from '../theme/colors';

const TrialBanner = () => {
  const navigation = useNavigation();
  const { isTrial, trialDaysLeft, isFullPlan, isLitePlan } = useFeatureAccess();

  if (!isTrial || isFullPlan || isLitePlan) return null;

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.8}
      onPress={() =>
        navigation.navigate('Settings', { screen: 'SubscriptionScreen' })
      }
    >
      <View style={styles.iconWrap}>
        <Ionicons name="time-outline" size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>
          {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left in your free trial
        </Text>
        <Text style={styles.subtitle}>Tap to view plans</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: 2,
  },
});

export default TrialBanner;
