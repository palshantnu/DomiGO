import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import UpgradePromptModal from './UpgradePromptModal';
import colors from '../theme/colors';

const FeatureGateWrapper = ({ feature, featureName, children, style }) => {
  const { canAccess } = useFeatureAccess();
  const [showModal, setShowModal] = useState(false);

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.blurOverlay}>
        <View style={styles.lockedContent}>{children}</View>
        <TouchableOpacity
          style={styles.lockOverlay}
          activeOpacity={0.8}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={16} color="#fff" />
            <Text style={styles.lockText}>Full Plan</Text>
          </View>
        </TouchableOpacity>
      </View>
      <UpgradePromptModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        featureName={featureName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'relative' },
  blurOverlay: { position: 'relative' },
  lockedContent: { opacity: 0.3 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockBadge: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
  },
  lockText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default FeatureGateWrapper;
