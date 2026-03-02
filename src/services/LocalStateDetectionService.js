/**
 * LOCAL STATE DETECTION SERVICE — On-device state detection using bundled GeoJSON
 *
 * PURPOSE:
 *   Replaces Google Geocoding API calls with local point-in-polygon detection.
 *   Used when GEOFENCING_MODE = 'local_js' in src/config/featureFlags.js.
 *   Eliminates Google API costs entirely for state detection.
 *
 * HOW IT WORKS:
 *   1. Loads bundled GeoJSON file for the configured country (US or India)
 *   2. On each GPS update, checks which state polygon contains the coordinate
 *   3. If state changed from previous update, fires onStateChange callback
 *   4. The callback triggers trip creation/completion via the backend API
 *
 * KEY FUNCTIONS:
 *   detectState(lat, lng)                  — returns state name string or null
 *   handleLocationUpdate(lat, lng, cb)     — tracks state internally, fires cb on change
 *   getCurrentState()                      — returns the last detected state
 *   resetState()                           — clears internal state (for testing)
 *
 * GEOJSON FILES (bundled as static assets, NEVER fetched at runtime):
 *   US: src/assets/us-states.json          — property key: feature.properties.name
 *   IN: src/assets/india-states.geojson    — property key: feature.properties.ST_NM
 *
 * GEOJSON SOURCES (download from these URLs and place in src/assets/):
 *   US:  https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json
 *   IN:  https://raw.githubusercontent.com/india-in-data/india-states-2019/master/india_states.geojson
 */
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { GEOFENCING_COUNTRY } from '../config/featureFlags';

const geoJsonModules = {
  US: () => require('../assets/us-states.json'),
  // IN: () => require('../assets/india-states.geojson'),
  IN: () => require('../assets/india-states.json'),
};

const stateNameKeys = {
  US: 'name',
  IN: 'ST_NM',
};

let cachedFeatures = null;
let cachedCountry = null;

function loadFeatures() {
  if (cachedFeatures && cachedCountry === GEOFENCING_COUNTRY) {
    return cachedFeatures;
  }
  const loader = geoJsonModules[GEOFENCING_COUNTRY];
  if (!loader) {
    console.warn(
      `LocalStateDetectionService: unsupported country "${GEOFENCING_COUNTRY}"`,
    );
    return [];
  }
  const geoJson = loader();
  cachedFeatures = geoJson.features || [];
  cachedCountry = GEOFENCING_COUNTRY;
  return cachedFeatures;
}

function detectState(latitude, longitude) {
  const features = loadFeatures();
  const key = stateNameKeys[GEOFENCING_COUNTRY] || 'name';
  const pt = point([longitude, latitude]);

  for (const feature of features) {
    if (booleanPointInPolygon(pt, feature)) {
      return feature.properties[key] || null;
    }
  }
  return null;
}

let currentState = null;

function handleLocationUpdate(latitude, longitude, onStateChange) {
  const detected = detectState(latitude, longitude);
  if (detected === null) {
    return;
  }

  if (currentState === null) {
    currentState = detected;
    return;
  }
   console.log('currentState',detected);
  if (detected !== currentState) {
    const from = currentState;
    currentState = detected;
    if (onStateChange) {
      onStateChange({ from, to: detected, timestamp: Date.now() });
    }
  }
}

function getCurrentState() {
  return currentState;
}

function resetState() {
  currentState = null;
}

export default {
  detectState,
  handleLocationUpdate,
  getCurrentState,
  resetState,
};
