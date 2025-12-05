import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { GOOGLE_KEY } from './CommonHelpers';
import store from '../redux/store';

// Check if native module is available
const isNativeModuleAvailable = () => {
  return NativeModules.LocationTracker != null;
};
  const { loginToken } = store?.getState()?.auth || '';
// Create event emitter only if native module exists
const locationEventEmitter = isNativeModuleAvailable() 
  ? new NativeEventEmitter(NativeModules.LocationTracker) 
  : null;

class DomigoTracker {
  constructor() {
    this.subscriptions = [];
    this.isTracking = false;
    this.nativeAvailable = isNativeModuleAvailable();
    
    console.log(`📍 DomigoTracker - Platform: ${Platform.OS}, Native available: ${this.nativeAvailable}`);
    
    if (!this.nativeAvailable) {
      console.warn('📍 DomigoTracker - Native module not available, running in fallback mode');
    }
  }

  async startDomigoTracking() {
    console.log(`🚀 Starting Domigo location tracking on ${Platform.OS}...`);

    if (!this.nativeAvailable) {
      console.warn('📍 DomigoTracker - Native module not available, cannot start tracking');
      return { started: false, subscriptions: [] };
    }

    try {
      const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6ImFqYXlAZ21haWwuY29tIiwiaWF0IjoxNzYzOTgzODg5LCJleHAiOjE3NjQwMTI2ODl9.V6muZZvXTE-P8DUuxnzfuhFzjB41C0tj22IxWp3eMEI";
      const API_URL = "http://3.91.116.18:4001/api/locations";

      // Set configuration for both platforms
      const config = {
        interval: 20000, 
        domigoToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6ImFqYXlAZ21haWwuY29tIiwiaWF0IjoxNzY0MDc1MDIzLCJleHAiOjE3NjQxMDM4MjN9.eLadDqiUV0JpGpI7L38FGq0MahIhnqjTboQZI7K0gr0',
        apiUrl: API_URL
      };
      if (Platform.OS === 'android') {
        config.googleApiKey = GOOGLE_KEY;
      }
      console.log('📍 Setting config for native module...',config);
      await NativeModules.LocationTracker.setConfig(config);

      // Set up event listeners
      this.setupEventListeners();

      console.log('📍 Starting native location tracking...');
      await NativeModules.LocationTracker.startLocationTracking();
      this.isTracking = true;
      
      console.log(`📍 Domigo ${Platform.OS} - Tracking started successfully`);
      return { started: true, subscriptions: this.subscriptions };
    } catch (error) {
      console.error(`❌ Domigo ${Platform.OS} - Failed to start tracking:`, error);
      return { started: false, subscriptions: [] };
    }
  }

  async stopDomigoTracking() {
    if (!this.nativeAvailable) {
      console.warn('📍 DomigoTracker - Native module not available, cannot stop tracking');
      return false;
    }

    console.log(`🛑 Stopping Domigo tracking on ${Platform.OS}...`);
    
    try {
      // Remove all event listeners
      this.subscriptions.forEach(subscription => subscription.remove());
      this.subscriptions = [];

      // Stop native tracking
      await NativeModules.LocationTracker.stopLocationTracking();
      this.isTracking = false;
      
      console.log(`📍 Domigo ${Platform.OS} - Tracking stopped successfully`);
      return true;
    } catch (error) {
      console.error(`❌ Domigo ${Platform.OS} - Failed to stop tracking:`, error);
      return false;
    }
  }

  async checkTrackingStatus() {
    if (!this.nativeAvailable) {
      return false;
    }

    try {
      const status = await NativeModules.LocationTracker.isTracking();
      this.isTracking = status;
      return status;
    } catch (error) {
      console.error(`❌ Domigo ${Platform.OS} - Failed to check status:`, error);
      return false;
    }
  }

  setupEventListeners() {
    if (!this.nativeAvailable || !locationEventEmitter) {
      console.warn('📍 Cannot setup event listeners - native module not available');
      return;
    }

    // Remove any existing subscriptions
    this.subscriptions.forEach(subscription => subscription.remove());
    this.subscriptions = [];

    console.log('📍 Setting up event listeners...');

    // Set up new event listeners
    this.subscriptions.push(
      locationEventEmitter.addListener('onLocationChanged', (location) => {
        console.log(`📍 Domigo ${Platform.OS} - Location:`, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          provider: location.provider
        });
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onAddressResolved', (addressData) => {
        console.log(`🏠 Domigo ${Platform.OS} - Address:`, {
          city: addressData.city,
          state: addressData.state,
          address: addressData.fullAddress
        });
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onApiSuccess', (result) => {
        console.log(`✅ Domigo ${Platform.OS} - API Success:`, result);
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onLocationError', (error) => {
        console.error(`❌ Domigo ${Platform.OS} - Error:`, error);
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onLocationStatus', (status) => {
        console.log(`ℹ️ Domigo ${Platform.OS} - Status:`, status);
      })
    );

    console.log('📍 Event listeners setup completed');
  }

  // Get current tracking state
  getTrackingState() {
    return this.isTracking;
  }

  // Check if native module is available
  isNativeAvailable() {
    return this.nativeAvailable;
  }
}

export default new DomigoTracker();