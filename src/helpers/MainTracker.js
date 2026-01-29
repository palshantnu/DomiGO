import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { GOOGLE_KEY } from './CommonHelpers';
import store from '../redux/store';

// Check if native module is available
const isNativeModuleAvailable = () => {
  return NativeModules.LocationTracker != null;
};



// console.log(userData,'loginToken>>>>>>>>>>>>>>>>>>>>>>>>>>>', loginToken,userData);

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
// Update your DomigoTracker class methods:

async getLaunchContext() {
  if (!this.nativeAvailable) {
    return { launchedByLocation: false };
  }
  
  try {
    const context = await NativeModules.LocationTracker.getLaunchContext();
    return context;
  } catch (error) {
    console.error('Failed to get launch context:', error);
    return { launchedByLocation: false };
  }
}

async clearNotificationBadge() {
  if (!this.nativeAvailable) return;
  
  try {
    await NativeModules.LocationTracker.clearNotificationBadge();
  } catch (error) {
    console.error('Failed to clear notification badge:', error);
  }
}

// Add event listener for silent notifications
setupEventListeners() {
  // ... existing code ...
  
  // Add this new event listener
  // this.subscriptions.push(
  //   locationEventEmitter.addListener('onSilentNotificationReceived', (data) => {
  //     console.log('📱 Silent notification received:', data);
  //   })
  // );
}
  async startDomigoTracking(token) {
    const { loginToken,userData } = store.getState().auth || '';
    console.log('🔥 JS startDomigoTracking CALLED');
    console.log('🔥 NativeModules.LocationTracker =', NativeModules.LocationTracker);
    console.log(`🚀 Starting Domigo location tracking on ${Platform.OS}...`);
    // console.log('loginToken>>>>>>>>>>>>>>>>>>>>>>>>>>>', token || loginToken);

    if (!this.nativeAvailable) {
      console.warn('📍 DomigoTracker - Native module not available, cannot start tracking');
      return { started: false, subscriptions: [] };
    }

    try {
      // const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6ImFqYXlAZ21haWwuY29tIiwiaWF0IjoxNzYzOTgzODg5LCJleHAiOjE3NjQwMTI2ODl9.V6muZZvXTE-P8DUuxnzfuhFzjB41C0tj22IxWp3eMEI";
      const API_URL = "http://3.91.116.18:4001/api/locations";

      // Set configuration for both platforms
      const config = {
        interval: 20000,
        // domigoToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6ImFqYXlAZ21haWwuY29tIiwiaWF0IjoxNzY2MDM2Nzk1LCJleHAiOjE3NjYwNjU1OTV9.bMR_0zqYOXAhBrmdcmvGFevbA1RkLH-mVWDeTmIuecw',
        domigoToken: token || loginToken,
        apiUrl: API_URL
      };
      if (Platform.OS === 'android') {
        config.googleApiKey = GOOGLE_KEY;
      }
      console.log('📍 Setting config for native module...', config);
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
        console.log(
          `📍 [${new Date(location.timestamp).toLocaleTimeString()}] Location Update`,
          {
            lat: location.latitude.toFixed(6),
            lng: location.longitude.toFixed(6),
            accuracy: `${location.accuracy}m`,
            speed: location.speed,
            provider: location.provider
          }
        );

      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onAddressResolved', (addressData) => {
        console.log(`🏠 Domigo ${Platform.OS} - Address:`, {
          city: addressData.city,
          state: addressData.state,
          address: addressData.fullAddress,
          stateCode: addressData.stateCode,
          countryCode: addressData.countryCode
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




    //new changes
    this.subscriptions.push(
      locationEventEmitter.addListener('onTripApiResponse', (data) => {
        console.log('🚗 Trip API Success:', {
          statusCode: data.statusCode,
          response: data.response,
          time: new Date(data.timestamp).toLocaleString(),
          body:data.body,
        });
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onTripApiError', (error) => {
        console.error('🚗 Trip API Error:', error);
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