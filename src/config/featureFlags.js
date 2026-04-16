/**
 * FEATURE FLAGS — Local Geofencing & Offline Resilience
 *
 * This file controls how the app detects which state the user is in.
 * Changing these constants is the ONLY thing needed to switch behavior.
 *
 * HOW TO USE:
 *   - Set GEOFENCING_MODE to 'google' to revert to original behavior (no code changes needed).
 *   - Set GEOFENCING_MODE to 'local_js' to use JS Turf.js detection (zero Google API calls).
 *   - Set GEOFENCING_MODE to 'local_native' to use native Kotlin/Swift detection (zero Google API calls).
 *   - Set GEOFENCING_COUNTRY to 'US' or 'IN' to switch which country's state boundaries are used.
 *
 * WHAT EACH MODE DOES:
 *   'google'       — Original behavior. Android uses Google Geocoding API, iOS uses CLGeocoder.
 *                     Google API key is passed to native modules. No new code paths are activated.
 *   'local_js'     — JS-side Turf.js point-in-polygon using bundled GeoJSON files.
 *                     Google API key is NOT passed to native (saves API costs).
 *                     State detection runs in JS when onLocationChanged fires.
 *   'local_native' — Native Kotlin/Swift ray-casting point-in-polygon using bundled GeoJSON.
 *                     Most performant. Works even when JS bridge is inactive.
 *
 * RELATED FILES:
 *   - src/services/LocalStateDetectionService.js  (used by local_js mode)
 *   - src/services/OfflineQueueService.js         (offline trip queue for local_js mode)
 *   - android/.../LocationModule.kt               (native detection for local_native mode)
 *   - ios/locationModule.swift                    (native detection for local_native mode)
 */

// Geofencing mode — change this single value to switch all detection behavior
export const GEOFENCING_MODE = 'local_native';
// export const GEOFENCING_MODE = 'local_js';

// Country whose state boundaries are used — 'US' or 'IN'
export const GEOFENCING_COUNTRY = 'US'
