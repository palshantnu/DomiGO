import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../theme/colors';

const PermissionScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="chevron-back" size={26} color="#000" />
      </TouchableOpacity> */}

      <Image
        source={require('../assets/image/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.title}>Grant Essential Permissions</Text>

      <Text style={styles.description}>
        ResiTrack Tax requires Location and Motion & Fitness data to accurately
        track your residency days across states. Please grant these permissions
        to get started.
      </Text>

      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.icon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Location Access</Text>
            <Text style={styles.cardDesc}>
              Allow ResiTrack to access your location in the background to
              automatically track your residency days across states. This data
              is essential for accurate tax calculations.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.allowBtn}>
          <Text style={styles.allowText}>Allow Location Access</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.cardContent}>
          <Text style={styles.icon}>🅷</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Offline Sync</Text>
            <Text style={styles.cardDesc}>
              Enable offline sync and calendar synchronization to manage data in
              the local database until it is synced to the cloud.
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.allowBtn}>
          <Text style={styles.allowText}>Allow Sync Access</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PermissionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    backgroundColor: '#f3f4f6',
    borderRadius: 30,
    padding: 4,
  },
  logo: {
    width: 110,
    height: 50,
    alignSelf: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0D1B2A',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#5C677D',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 26,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  icon: {
    fontSize: 26,
    marginRight: 12,
    color: colors.primary,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0D1B2A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#5C677D',
    lineHeight: 18,
  },
  allowBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  allowText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
