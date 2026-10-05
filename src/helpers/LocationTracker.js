import { NativeModules, NativeEventEmitter, PermissionsAndroid, Platform } from 'react-native';
import { requestLocationPermission } from './locationPermission2';

const { LocationTracker } = NativeModules;
const locationEventEmitter = new NativeEventEmitter(LocationTracker);

class BackgroundLocationTracker {
  constructor() {
    this.isTracking = false;
    this.locationCallback = null;
    this.errorCallback = null;
    this.statusCallback = null;
    this.subscriptions = [];
  }

  async startTracking(onLocationUpdate, onError = null, onStatusChange = null) {
    try {
      if (this.isTracking) {
        console.log('📍 Location tracking already active');
        return true;
      }

      // Request permissions for Android
      if (Platform.OS === 'android') {
        const granted = await requestLocationPermission();

        if (!granted) {
          throw new Error('Location permission denied');
        }
      }

      // Set up callbacks
      this.locationCallback = onLocationUpdate;
      this.errorCallback = onError;
      this.statusCallback = onStatusChange;

      // Subscribe to events
      this.subscriptions.push(
        locationEventEmitter.addListener('onLocationChanged', (location) => {
          if (this.locationCallback) {
            this.locationCallback(location);
          }
        })
      );

      this.subscriptions.push(
        locationEventEmitter.addListener('onLocationError', (error) => {
          if (this.errorCallback) {
            this.errorCallback(error);
          }
        })
      );

      this.subscriptions.push(
        locationEventEmitter.addListener('onLocationStatus', (status) => {
          if (this.statusCallback) {
            this.statusCallback(status);
          }
        })
      );

      // Start native tracking
      await LocationTracker.startLocationTracking();
      this.isTracking = true;
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start location tracking:', error);
      if (this.errorCallback) {
        this.errorCallback({ error: error.message });
      }
      return false;
    }
  }

  async stopTracking() {
    try {
      if (!this.isTracking) {
        console.log('📍 Location tracking already stopped');
        return true;
      }

      // Remove all subscriptions
      this.subscriptions.forEach(subscription => subscription.remove());
      this.subscriptions = [];
      
      // Clear callbacks
      this.locationCallback = null;
      this.errorCallback = null;
      this.statusCallback = null;

      // Stop native tracking
      await LocationTracker.stopLocationTracking();
      this.isTracking = false;
      
      return true;
      
    } catch (error) {
      console.error('❌ Failed to stop location tracking:', error);
      return false;
    }
  }

  async checkTrackingStatus() {
    try {
      return await LocationTracker.isTracking();
    } catch (error) {
      console.error('❌ Failed to check tracking status:', error);
      return false;
    }
  }
}

export default new BackgroundLocationTracker();