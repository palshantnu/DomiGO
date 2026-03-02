# Geofencing Changes — Developer Guide

## Overview

This document summarizes all code changes made to replace Google API state detection
with local on-device detection, plus full offline resilience so no trip events are lost.

Everything is controlled by **one file**: `src/config/featureFlags.js`.
Set `GEOFENCING_MODE = 'google'` to revert to 100% original behavior.

---

## Quick Start

1. Open `src/config/featureFlags.js`
2. Set `GEOFENCING_MODE` to one of:
   - `'google'` — original behavior, no changes activated
   - `'local_js'` — JS-based Turf.js state detection (zero Google API calls)
   - `'local_native'` — native Kotlin/Swift detection (zero Google API calls, most performant)
3. Set `GEOFENCING_COUNTRY` to `'US'` or `'IN'`
4. Rebuild and run

---

## New Files Created

| File | Purpose |
|------|---------|
| `src/config/featureFlags.js` | Feature flag: controls geofencing mode and country |
| `src/services/LocalStateDetectionService.js` | JS Turf.js point-in-polygon state detection (Option A) |
| `src/services/OfflineQueueService.js` | Offline queue: persists failed trip events to AsyncStorage, auto-retries |
| `src/assets/us-states.json` | US state boundaries GeoJSON (52 features) |
| `src/assets/india-states.geojson` | India state boundaries GeoJSON (271 features) |
| `android/.../assets/us-states.json` | Copy of US GeoJSON for Android native access |
| `android/.../assets/india-states.geojson` | Copy of India GeoJSON for Android native access |
| `android/.../BootReceiver.kt` | Auto-restarts tracking after phone reboot |

## Existing Files Modified

| File | What Changed |
|------|-------------|
| `src/helpers/MainTracker.js` | Branches on GEOFENCING_MODE: passes different config to native, sets up JS detection for local_js mode |
| `App.tsx` | Mounts OfflineQueueService (startListening + immediate flush) when local_js mode is active |
| `android/.../LocationModule.kt` | Added: SharedPreferences state persistence, native offline trip queue, GeoJSON ray-casting, config branching, API key guard fix, missing day backfill |
| `ios/locationModule.swift` | Added: UserDefaults offline trip queue, GeoJSON ray-casting, config branching, missing day backfill, last tracked date persistence |
| `android/.../AndroidManifest.xml` | Added: RECEIVE_BOOT_COMPLETED permission + BootReceiver registration |
| `package.json` | Added: @turf/helpers, @turf/boolean-point-in-polygon |

---

## Feature Flag Behavior Matrix

| Setting | State Detection | Trip API | Offline Queue | Google API Cost |
|---------|----------------|----------|---------------|-----------------|
| `GEOFENCING_MODE = 'google'` | Google Geocoding / CLGeocoder (original) | Native OkHttp / URLSession | Native SharedPrefs / UserDefaults | YES (original cost) |
| `GEOFENCING_MODE = 'local_js'` | JS Turf.js + bundled GeoJSON | JS axios | JS AsyncStorage + NetInfo | ZERO |
| `GEOFENCING_MODE = 'local_native'` | Native ray-casting + bundled GeoJSON | Native OkHttp / URLSession | Native SharedPrefs / UserDefaults | ZERO |

---

## Offline Resilience — What's Covered

### Gap 1: Android State Persistence
**Problem**: Android lost tracking state (previous state, city, coordinates) on app kill.
**Solution**: SharedPreferences persistence mirroring iOS's existing UserDefaults pattern.
**Files**: `LocationModule.kt` — `saveStateToPrefs()` / `loadStateFromPrefs()`

### Gap 2: Native Offline Trip Queue
**Problem**: Failed trip API calls (no network) lost events permanently.
**Solution**: Failed payloads queued to SharedPreferences (Android) / UserDefaults (iOS), retried on next location update.
**Files**: `LocationModule.kt` — `enqueueToOfflineQueue()` / `flushOfflineQueue()`, `locationModule.swift` — same pattern.

### Gap 3: JS Offline Queue Flush on Startup
**Problem**: Queued events sat unflushed if connectivity was already available on restart.
**Solution**: `OfflineQueueService.flush()` called immediately on app mount in `App.tsx`.

### Gap 4: Android Boot Receiver
**Problem**: Tracking stopped after phone reboot until user opened app.
**Solution**: `BootReceiver.kt` listens for BOOT_COMPLETED, restarts LocationForegroundService.
**iOS**: Already handled by `startMonitoringSignificantLocationChanges()`.

### Gap 5: Missing Day Backfill
**Problem**: Phone off for multiple days = midnight schedulers don't fire, no entries created.
**Solution**: On startup, compare `lastTrackedDate` vs today. For each gap day, POST missing-day entry.
**Files**: Both `LocationModule.kt` and `locationModule.swift` — `backfillMissingDays()`.

---

## GeoJSON Data Files

The GeoJSON files contain real state boundary polygon data:

| File | Country | Features | State Name Key | Source URL |
|------|---------|----------|----------------|------------|
| `us-states.json` | US | 52 | `feature.properties.name` | https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json |
| `india-states.geojson` | India | 271 | `feature.properties.ST_NM` | https://raw.githubusercontent.com/india-in-data/india-states-2019/master/india_states.geojson |

These files are **bundled as static assets** and NEVER fetched at runtime.
Copies exist in both `src/assets/` (for JS/Metro) and `android/app/src/main/assets/` (for native Android).
For iOS native, add the files to the Xcode project's bundle resources.

---

## NPM Packages Added

| Package | Version | Used By |
|---------|---------|---------|
| `@turf/helpers` | ^7.3.4 | LocalStateDetectionService.js (creates GeoJSON point) |
| `@turf/boolean-point-in-polygon` | ^7.3.4 | LocalStateDetectionService.js (point-in-polygon check) |

`@react-native-community/netinfo` was already installed (^11.4.1).

---

## Testing Checklist

- [ ] Set `GEOFENCING_MODE = 'google'` — verify app behaves exactly as before
- [ ] Set `GEOFENCING_MODE = 'local_js'` — verify state detection works with no Google API calls
- [ ] Set `GEOFENCING_MODE = 'local_native'` — verify native detection works
- [ ] Switch `GEOFENCING_COUNTRY` between `'US'` and `'IN'` — verify correct boundaries
- [ ] Turn off network, cross a state boundary — verify event is queued
- [ ] Turn network back on — verify queued events are flushed automatically
- [ ] Kill app with queued events, reopen — verify events flush on startup
- [ ] Reboot phone — verify tracking resumes automatically (Android)
- [ ] Keep phone off for 2+ days — verify missing days are backfilled on startup
