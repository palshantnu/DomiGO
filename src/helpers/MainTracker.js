import { NativeModules, NativeEventEmitter, Platform, Alert, BackHandler } from 'react-native';
import { GOOGLE_KEY } from './CommonHelpers';
import store from '../redux/store';
import { GEOFENCING_MODE, GEOFENCING_COUNTRY, CITY_CHANGE_EVENTS_ENABLED } from '../config/featureFlags';
import LocalStateDetectionService from '../services/LocalStateDetectionService';
import OfflineQueueService from '../services/OfflineQueueService';
import axiosinstance from '../axios/axiosinstance';
import NetInfo from "@react-native-community/netinfo"

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
    this.previousCity = null;
    this.previousState = null
    this.lastTripTime = 0
    this._setupNetworkListener()
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

  _setupNetworkListener() {

    NetInfo.addEventListener(state => {

      if (state.isConnected) {

        console.log("🌐 Internet restored → flushing queue")

        // this.processOfflineQueue()
        OfflineQueueService.flush()


      }

    })

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
      const API_URL = "https://stage.mydomigo.com/api/locations";

      const config = {
        // 60s matches the native default; state-level detection doesn't need faster sampling.
        interval: 60000,
        domigoToken: token || loginToken,
        apiUrl: API_URL,
        geofencingMode: GEOFENCING_MODE,
        geofencingCountry: GEOFENCING_COUNTRY,
        // Gate city/county change detection. Must stay false until backend filter is live.
        cityChangeEventsEnabled: CITY_CHANGE_EVENTS_ENABLED,
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
          config.googleApiKey = GOOGLE_KEY;
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

  async _reverseGeocode(lat, lng) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${GOOGLE_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK') {
        const components = data.results[0].address_components;

        let city = '';

        for (let c of components) {

          if (c.types.includes('locality')) {
            city = c.long_name;
            break;
          }

          // if (!city && c.types.includes('postal_town')) {
          //   city = c.long_name;
          // }

          if (!city && c.types.includes('administrative_area_level_3')) {
            city = c.long_name;
          }

          if (!city && c.types.includes('administrative_area_level_2')) {
            city = c.long_name;
          }

        }

        return city;
      }

      return '';

    } catch (e) {
      console.log('Reverse geocode failed', e);
      return '';
    }
  }

  async processOfflineQueue() {

    const queue = await OfflineQueueService.getAll();

    for (let item of queue) {

      const destinationCity =
        item.destinationCity ||
        await this._reverseGeocode(item.lat, item.lng);

      const originCity =
        item.originCity || destinationCity;

      await this._sendTripFromJS(
        {
          from: item.from,
          to: item.to,
          timestamp: item.timestamp
        },
        {
          latitude: item.lat,
          longitude: item.lng
        },
        destinationCity,
        originCity
      );

      await OfflineQueueService.remove(item.id);
    }
  }

  async createMissingDay() {

    // if(!this.previousState) return

    const payload = new FormData()

    payload.append("kind", "missing")
    payload.append("date", new Date().toLocaleDateString("en-CA").split("T")[0])
    payload.append("state", this.previousState)

    try {

      await axiosinstance.post(
        "trip-days",
        payload,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      console.log("🌙 Missing day created")

    }
    catch (e) {

      console.log("Missing day failed")

    }

  }

  async _handleLocalJSDetection(location) {

    LocalStateDetectionService.handleLocationUpdate(
      location.latitude,
      location.longitude,
      async (change) => {

        console.log(`📍 Local JS state change: ${change.from} → ${change.to}`);

        // this.previousState = change.to; // 👈 important line

        let destinationCity = await this._reverseGeocode(
          location.latitude,
          location.longitude
        );

        const originCity = this.previousCity || destinationCity;

        this._sendTripFromJS(change, location, destinationCity, originCity);

        // update previous city
        this.previousCity = destinationCity;
      }
    );
  }
  async _sendTripFromJS(change, location, destinationCity, originCity) {
    if (Date.now() - this.lastTripTime < 5000) {
      console.log("⚠️ duplicate trip prevented")
      return
    }

    this.lastTripTime = Date.now()


    const payload = new FormData();

    payload.append('kind', 'trip');
    payload.append('date', new Date().toLocaleDateString("en-CA").split('T')[0]);
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
    payload.append('originCity', originCity);

    payload.append('originLat', String(location.latitude));
    payload.append('originLng', String(location.longitude));

    payload.append('destinationState', change.to);
    payload.append('destinationCity', destinationCity);

    payload.append('destinationLat', String(location.latitude));
    payload.append('destinationLng', String(location.longitude));

    payload.append('startDate', new Date(change.timestamp).toLocaleDateString("en-CA"));
    payload.append('endDate', new Date().toLocaleDateString("en-CA"));

    try {

      await axiosinstance.post('trip-days', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // console.log("🚗 Trip created with city:", city)
      console.log("🚗 Trip created", originCity, "→", destinationCity)

    }
    catch {

      await OfflineQueueService.enqueue({
        from: change.from,
        to: change.to,
        timestamp: change.timestamp,

        originCity: originCity,
        destinationCity: destinationCity,

        lat: location.latitude,
        lng: location.longitude
      });

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
          const state = LocalStateDetectionService.getCurrentState();

          if (state) {
            this.previousState = state;
          }

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

    this.subscriptions.push(
      locationEventEmitter.addListener('onCityChangeDetected', (data) => {
        console.log("🏙️🏙️🏙️ CITY CHANGE EVENT DETECTED! 🏙️🏙️🏙️");
        console.log("📊 City Change Data:", JSON.stringify(data, null, 2));
        console.log(`📍 From: ${data.fromCounty}`);
        console.log(`📍 To: ${data.toCounty}`);
        console.log(`📍 State: ${data.state}`);
        console.log(`📍 Lat/Lng: ${data.lat}, ${data.lng}`);

        // Optional: Show alert for testing
        if (__DEV__) {
          Alert.alert(
            'City Change Detected',
            `Moved from ${data.fromCounty} to ${data.toCounty}\nState: ${data.state}`
          );
        }
      })
    );
    this.subscriptions.push(
      locationEventEmitter.addListener('onCityChangeDetected', (data) => {
        console.log("🏙️🏙️🏙️ CITY CHANGE EVENT DETECTED! 🏙️🏙️🏙️");
        console.log("📊 City Change Data:", JSON.stringify(data, null, 2));
        console.log(`📍 From: ${data.fromCity}`);
        console.log(`📍 To: ${data.toCity}`);
        console.log(`📍 county: ${data.county}`);
        console.log(`📍 State: ${data.state}`);
        console.log(`📍 Lat/Lng: ${data.lat}, ${data.lng}`);

        // Optional: Show alert for testing
        // if (__DEV__) {
        //   Alert.alert(
        //     'City Change Detected',
        //     `Moved from ${data.fromCounty} to ${data.toCounty}\nState: ${data.state}`
        //   );
        // }
      })
    );

    this.subscriptions.push(
      locationEventEmitter.addListener('onCityChangeDebug', (data) => {
        console.log('🐛 CITY CHANGE DEBUG BODY:', JSON.stringify(data, null, 2));
      })
    );


    this.subscriptions.push(
  locationEventEmitter.addListener(
    'onFakeGpsDetected',
    () => {

      console.log("🚨 FAKE GPS DETECTED");

      Alert.alert(
        'Fake GPS Detected',
        'Please disable Fake GPS applications to continue using Domigo.',
        [
          {
            text: 'Exit App',
            onPress: async () => {

              try {

                // stop native tracking
                await NativeModules.LocationTracker.stopLocationTracking();

              } catch (e) {
                console.log(e);
              }

              // app close
              BackHandler.exitApp();
            }
          }
        ],
        {
          cancelable: false
        }
      );
    }
  )
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
    this.subscriptions.push(
      locationEventEmitter.addListener(
        'onHoursApiSuccess',
        (data) => {

          console.log(
            '🕓 HOURS API SUCCESS',
            {
              city: data.city,
              state: data.state,
              address: data.address,
              lat: data.latitude,
              lng: data.longitude,
              time: new Date(
                data.timestamp
              ).toLocaleString(),
            }
          );
        }
      )
    );

    this.subscriptions.push(
      locationEventEmitter.addListener(
        'onHoursApiError',
        (data) => {

          console.log(
            '❌ HOURS API ERROR',
            data
          );
        }
      )
    );



    console.log('📍 Event listeners setup completed');
  }

  // _handleLocalJSDetection(location) {
  //   LocalStateDetectionService.handleLocationUpdate(
  //     location.latitude,
  //     location.longitude,
  //     (change) => {
  //       console.log(`📍 Local JS state change: ${change.from} → ${change.to}`);
  //       this._sendTripFromJS(change, location);
  //     },
  //   );
  // }
  // async _handleLocalJSDetection(location) {
  //   LocalStateDetectionService.handleLocationUpdate(
  //     location.latitude,
  //     location.longitude,
  //     async (change) => {

  //       console.log(`📍 Local JS state change: ${change.from} → ${change.to}`);

  //       let city = '';

  //       try {
  //         city = await this._reverseGeocode(
  //           location.latitude,
  //           location.longitude
  //         );
  //       } catch {}

  //       this._sendTripFromJS(change, location, city);
  //     },
  //   );
  // }

  // async _sendTripFromJS(change, location) {
  //   const payload = new FormData();
  //   payload.append('kind', 'trip');
  //   payload.append('date', new Date().toLocaleDateString("en-CA").split('T')[0]);
  //   payload.append('typeOfDayId', '1');
  //   payload.append('isCommissionDay', 'false');
  //   payload.append('isRemoteWork', 'false');
  //   payload.append('remoteHours', '0');
  //   payload.append('isTravelling', 'true');
  //   payload.append('tripTypeId', '1');
  //   payload.append('tripModeId', '1');
  //   payload.append('confirmationNo', '');
  //   payload.append('vendor', '');
  //   payload.append('hasProof', 'false');
  //   payload.append('proofType', 'other');
  //   payload.append('notes', '');
  //   payload.append('creationType', 'automatic');
  //   payload.append('remoteLocation', '');
  //   payload.append('attachments', '[]');
  //   payload.append('originState', change.from);
  //   payload.append('originLat', String(location.latitude));
  //   payload.append('originLng', String(location.longitude));
  //   payload.append('destinationState', change.to);
  //   payload.append('destinationLat', String(location.latitude));
  //   payload.append('destinationLng', String(location.longitude));
  //   payload.append('startDate', new Date(change.timestamp).toLocaleDateString("en-CA"));
  //   payload.append('endDate', new Date().toLocaleDateString("en-CA"));

  //   try {
  //     await axiosinstance.post('trip-days', payload, {
  //       headers: { 'Content-Type': 'multipart/form-data' },
  //     });
  //   } catch {
  //     await OfflineQueueService.enqueue({
  //       from: change.from,
  //       to: change.to,
  //       timestamp: change.timestamp,
  //       payload: {
  //         kind: 'trip',
  //         date: new Date().toLocaleDateString("en-CA").split('T')[0],
  //         originState: change.from,
  //         destinationState: change.to,
  //         originLat: location.latitude,
  //         originLng: location.longitude,
  //         destinationLat: location.latitude,
  //         destinationLng: location.longitude,
  //         startDate: new Date(change.timestamp).toLocaleDateString("en-CA"),
  //         endDate: new Date().toLocaleDateString("en-CA"),
  //         creationType: 'automatic',
  //       },
  //     });
  //   }
  // }

  getTrackingState() {
    return this.isTracking;
  }

  isNativeAvailable() {
    return this.nativeAvailable;
  }
}

export default new DomigoTracker();