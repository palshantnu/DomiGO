import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { GOOGLE_KEY } from './CommonHelpers';
import store from '../redux/store';
import { GEOFENCING_MODE, GEOFENCING_COUNTRY } from '../config/featureFlags';
import LocalStateDetectionService from '../services/LocalStateDetectionService';
import OfflineQueueService from '../services/OfflineQueueService';
import axiosinstance from '../axios/axiosinstance';

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
    const { loginToken, userData } = store.getState().auth || '';
    console.log('🔥 JS startDomigoTracking CALLED');
    console.log('🔥 NativeModules.LocationTracker =', NativeModules.LocationTracker);
    console.log(`🚀 Starting Domigo location tracking on ${Platform.OS}...`);
    console.log("🔥 GEOFENCING_MODE =", GEOFENCING_MODE)
    console.log("🔥 GEOFENCING_COUNTRY =", GEOFENCING_COUNTRY)
    // console.log('loginToken>>>>>>>>>>>>>>>>>>>>>>>>>>>', token || loginToken);

    if (!this.nativeAvailable) {
      console.warn('📍 DomigoTracker - Native module not available, cannot start tracking');
      return { started: false, subscriptions: [] };
    }

    try {
      // const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEwLCJlbWFpbCI6ImFqYXlAZ21haWwuY29tIiwiaWF0IjoxNzYzOTgzODg5LCJleHAiOjE3NjQwMTI2ODl9.V6muZZvXTE-P8DUuxnzfuhFzjB41C0tj22IxWp3eMEI";
      const API_URL = "http://3.91.116.18:4001/api/locations";

      const config = {
        interval: 20000,
        domigoToken: token || loginToken,
        apiUrl: API_URL,
        geofencingMode: GEOFENCING_MODE,
        geofencingCountry: GEOFENCING_COUNTRY,
      };

      if (GEOFENCING_MODE === 'google') {
        if (Platform.OS === 'android') {
          config.googleApiKey = GOOGLE_KEY;
        }
      } else if (GEOFENCING_MODE === 'local_native') {
        if (Platform.OS === 'android') {
          config.googleApiKey = GOOGLE_KEY;
        }
      } else if (GEOFENCING_MODE === 'local_js') {
        if (Platform.OS === 'android') {
          config.googleApiKey = '';
        }
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

        if (GEOFENCING_MODE === 'local_js' && location.accuracy < 100) {
          this._handleLocalJSDetection(location);
        }
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
          body: data.body,
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

  _handleLocalJSDetection(location) {
    LocalStateDetectionService.handleLocationUpdate(
      location.latitude,
      location.longitude,
      (change) => {
        console.log(`📍 Local JS state change: ${change.from} → ${change.to}`);
        this._sendTripFromJS(change, location);
      },
    );
  }

  async _sendTripFromJS(change, location) {
    const payload = new FormData();
    payload.append('kind', 'trip');
    payload.append('date', new Date().toISOString().split('T')[0]);
    payload.append('typeOfDayId', '1');
    payload.append('isCommissionDay', 'false');
    payload.append('isRemoteWork', 'false');
    payload.append('remoteHours', '0');
    payload.append('isTravelling', 'true');
    payload.append('tripTypeId', '1');
    payload.append('tripModeId', '1');
    payload.append('confirmationNo', '');
    payload.append('vendor', '');
    payload.append('hasProof', 'false');
    payload.append('proofType', 'other');
    payload.append('notes', '');
    payload.append('creationType', 'automatic');
    payload.append('remoteLocation', '');
    payload.append('attachments', '[]');
    payload.append('originState', change.from);
    payload.append('originLat', String(location.latitude));
    payload.append('originLng', String(location.longitude));
    payload.append('destinationState', change.to);
    payload.append('destinationLat', String(location.latitude));
    payload.append('destinationLng', String(location.longitude));
    payload.append('startDate', new Date(change.timestamp).toISOString());
    payload.append('endDate', new Date().toISOString());

    try {
      await axiosinstance.post('trip-days', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch {
      await OfflineQueueService.enqueue({
        from: change.from,
        to: change.to,
        timestamp: change.timestamp,
        payload: {
          kind: 'trip',
          date: new Date().toISOString().split('T')[0],
          originState: change.from,
          destinationState: change.to,
          originLat: location.latitude,
          originLng: location.longitude,
          destinationLat: location.latitude,
          destinationLng: location.longitude,
          startDate: new Date(change.timestamp).toISOString(),
          endDate: new Date().toISOString(),
          creationType: 'automatic',
        },
      });
    }
  }

  getTrackingState() {
    return this.isTracking;
  }

  isNativeAvailable() {
    return this.nativeAvailable;
  }
}

export default new DomigoTracker();