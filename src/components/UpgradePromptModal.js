import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';
import { useNavigation } from '@react-navigation/native';

const UpgradePromptModal = ({ visible, onClose, featureName }) => {
  const navigation = useNavigation();

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Ionicons name="lock-closed" size={48} color={colors.primary} />
          <Text style={styles.title}>Full Plan Required</Text>
          <Text style={styles.message}>
            {featureName || 'This feature'} is available with the Full plan ($99.99/year).
            Upgrade to unlock all features.
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => {
              onClose();
              navigation.navigate('Settings', {
                screen: 'SubscriptionScreen',
              });
            }}
          >
            <Text style={styles.upgradeBtnText}>View Plans</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
    color: '#000',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  upgradeBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 20,
  },
  upgradeBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  closeBtn: { marginTop: 12 },
  closeBtnText: { color: '#999', fontSize: 14 },
});

export default UpgradePromptModal;
