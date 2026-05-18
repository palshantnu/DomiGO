/**
 * LOCAL STATE + COUNTY DETECTION SERVICE
 *
 * On-device point-in-polygon detection using bundled GeoJSON.
 * Active when GEOFENCING_MODE = 'local_js' (the local_native path uses the
 * equivalent logic in LocationModule.kt / locationModule.swift).
 *
 * DATA SHAPES:
 *   US states (new):    src/geo/states.json             — array of { id, name, bbox, geometry }
 *   US counties (new):  src/geo/counties/<FIPS>.json    — array of { id, name, state, bbox, geometry }
 *                       lazily loaded per-state via countyLoaders map (Metro-friendly).
 *   IN states (old):    src/assets/india-states.json    — FeatureCollection, name at properties.ST_NM
 *
 * Public API:
 *   detectState(lat, lng)                        → { fips, name } | null
 *   detectCounty(stateFips, lat, lng)            → { fips, name } | null  (US only)
 *   handleLocationUpdate(lat, lng, onStateChange, onCityChange?)
 *   getCurrentState() / getCurrentCounty()
 *   resetState()
 */
import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { GEOFENCING_COUNTRY } from '../config/featureFlags';
import countyLoaders from '../geo/countyLoaders';

const stateLoaders = {
  US: () => require('../geo/states.json'),
  IN: () => require('../assets/india-states.json'),
  CA: () => require('../geo/canada.json'),
};

let cachedStateFeatures = null;
let cachedCountry = null;
const countyCache = new Map(); // stateFips -> features[]

function normalise(raw) {
  // New US array format
  if (Array.isArray(raw)) {
    return raw.map(f => ({
      type: 'Feature',
      bbox: f.bbox,
      properties: { id: f.id, name: f.name, state: f.state },
      geometry: f.geometry,
    }));
  }
  // Old GeoJSON FeatureCollection (India)
  return raw.features || [];
}

function loadStateFeatures() {
  if (cachedStateFeatures && cachedCountry === GEOFENCING_COUNTRY) {
    return cachedStateFeatures;
  }
  const loader = stateLoaders[GEOFENCING_COUNTRY];
  if (!loader) {
    console.warn(`LocalStateDetectionService: unsupported country "${GEOFENCING_COUNTRY}"`);
    return [];
  }
  cachedStateFeatures = normalise(loader());
  cachedCountry = GEOFENCING_COUNTRY;
  return cachedStateFeatures;
}

function loadCountyFeatures(stateFips) {
  if (countyCache.has(stateFips)) return countyCache.get(stateFips);
  const loader = countyLoaders[stateFips];
  if (!loader) return null;
  const raw = loader();
  const features = raw.map(f => ({
    type: 'Feature',
    bbox: f.bbox,
    properties: { id: f.id, name: f.name, state: f.state },
    geometry: f.geometry,
  }));
  countyCache.set(stateFips, features);
  return features;
}

function bboxContains(feature, longitude, latitude) {
  const bb = feature.bbox;
  if (!bb) return true;
  return longitude >= bb[0] && longitude <= bb[2] && latitude >= bb[1] && latitude <= bb[3];
}

function stateNameOf(feature) {
  if (GEOFENCING_COUNTRY === 'IN') return feature.properties?.ST_NM || null;
  return feature.properties?.name || null;
}

function stateFipsOf(feature) {
  // Only the new US format has FIPS ids; India returns null here (county detection
  // isn't supported for India anyway).
  return feature.properties?.id || null;
}

function detectState(latitude, longitude) {
  const features = loadStateFeatures();
  const pt = point([longitude, latitude]);
  for (const feature of features) {
    if (!bboxContains(feature, longitude, latitude)) continue;
    if (booleanPointInPolygon(pt, feature)) {
      return { fips: stateFipsOf(feature), name: stateNameOf(feature) };
    }
  }
  return null;
}

function detectCounty(stateFips, latitude, longitude) {
  if (GEOFENCING_COUNTRY !== 'US') return null;
  if (!stateFips) return null;
  const features = loadCountyFeatures(stateFips);
  if (!features) return null;
  const pt = point([longitude, latitude]);
  for (const feature of features) {
    if (!bboxContains(feature, longitude, latitude)) continue;
    if (booleanPointInPolygon(pt, feature)) {
      return { fips: feature.properties.id, name: feature.properties.name };
    }
  }
  return null;
}

let currentState = null; // { fips, name } | null
let currentCounty = null; // { fips, name } | null

function handleLocationUpdate(latitude, longitude, onStateChange, onCityChange) {
  const state = detectState(latitude, longitude);
  if (state === null) return;

  // State transition takes precedence. Do not fire onCityChange on a state transition —
  // the state change already carries full city metadata via reverse geocode.
  if (currentState === null) {
    currentState = state;
    // Seed county silently if available.
    currentCounty = detectCounty(state.fips, latitude, longitude);
    return;
  }

  if (state.name !== currentState.name) {
    const from = currentState;
    currentState = state;
    // Re-seed county for the new state.
    currentCounty = detectCounty(state.fips, latitude, longitude);
    if (onStateChange) {
      onStateChange({ from: from.name, to: state.name, timestamp: Date.now() });
    }
    return;
  }

  // Same state — check county (only where we have FIPS + county data).
  if (!state.fips) return;
  const county = detectCounty(state.fips, latitude, longitude);
  if (!county) return;

  if (currentCounty === null) {
    currentCounty = county;
    return;
  }

  if (county.fips !== currentCounty.fips) {
    const from = currentCounty;
    currentCounty = county;
    if (onCityChange) {
      onCityChange({
        state: state.name,
        stateFips: state.fips,
        from: from.name,
        fromFips: from.fips,
        to: county.name,
        toFips: county.fips,
        timestamp: Date.now(),
      });
    }
  }
}

function getCurrentState() {
  return currentState;
}

function getCurrentCounty() {
  return currentCounty;
}

function resetState() {
  currentState = null;
  currentCounty = null;
}

export default {
  detectState,
  detectCounty,
  handleLocationUpdate,
  getCurrentState,
  getCurrentCounty,
  resetState,
};
