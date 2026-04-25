# Geofencing Follow-Up — 2026-04-20

> ## ⏰ REMIND ME NEXT SESSION
> Items deferred on 2026-04-20:
>
> **Apple review (before App Store submission):**
> 1. **Audit `startUpdatingLocation()` call sites in [AppDelegate.swift](ios/domiGo/AppDelegate.swift)** (lines 57, 278, 476, 502, 674, 678). Confirm each is a bounded burst (start → get fix → stop within ~15 s), not continuous. Apple reviewers reject apps that run continuous full-accuracy GPS in background when `startMonitoringSignificantLocationChanges` already covers the use case.
> 2. **Strengthen Info.plist location-usage strings** ([Info.plist:56-61](ios/domiGo/Info.plist#L56-L61)). Current text is generic ("track movements"); Apple reviewers prefer specific, user-facing justification. Suggested copy already drafted in today's session.
>
> **City/county change feature:**
> 3. Full plan in [CITY_CHANGE_PLAN_2026-04-20.md](CITY_CHANGE_PLAN_2026-04-20.md). Storage decision: server-persisted via existing `/api/trip-days` with `kind = 'city_change'`. Backend must add `WHERE kind != 'city_change'` to trip-count and days-in-state queries BEFORE client flag flips on. Client ships behind `CITY_CHANGE_EVENTS_ENABLED` feature flag (default `false`).
> 4. **Phase 1 done:** county data bundled + `CITY_CHANGE_EVENTS_ENABLED` flag + flag plumbed through `setConfig` to both native modules. **Manual step required:** in Xcode, drag `ios/counties/` into the `domiGo` target as a **folder reference** (blue folder icon, not yellow group) with target membership = `domiGo`. Without this step, `loadCountyFeatures(stateFips:)` will fail at runtime on iOS.
> 5. **Phase 2 done:** `detectCountyFromGeoJSON` implemented on all three platforms with bbox prefilter + state-scoped county cache. State detectors now return `StateMatch { fips, name }` (Kotlin data class, Swift struct, JS object). Algorithm validated against 10 known coordinates (CA, NYC boroughs, NJ, TX, HI, AK, DC, PR, ocean). Nothing is yet wired into the event pipeline — detectors are dormant until Phase 3 calls them.
> 6. **Next up (Phase 3):** add `previousCountyFips` / `previousCountyName` / `previousCountyEnterTime` state vars + persistence; extend `processWithLocalGeoJSON` to call `handleCountyTransition`; fire `sendEntryFormData(kind = "city_change")`; still gated by `CITY_CHANGE_EVENTS_ENABLED`. Ping Claude with "start city_change Phase 3".
>
> Ping Claude with "resume Apple-review items" for items 1–2, or "start city_change Phase 3" for item 6.


Snapshot of what was changed in this session and what still needs attention. Pair this with `GEOFENCING_CHANGES.md` (architecture doc, updated today).

---

## What was done today

### 1. Root Google-API leak fixed (Android `local_native`)
- **Symptom:** Google Cloud billing alert — ~180 Geocoding requests/hour, 76k+ in 30 days.
- **Root cause:** `LocationModule.kt → processWithLocalGeoJSON` called `reverseGeocodeInBackground` on every 20 s tick whenever online, regardless of whether the polygon-detected state had changed. The same-state guard existed only in the offline branch, so online traffic bypassed it entirely.
- **Fix:** moved the `newState == oldState` skip ahead of the online/offline branch at [LocationModule.kt:1711-1714](android/app/src/main/java/com/domigo/LocationModule.kt#L1711-L1714). Google now fires only on genuine state transitions (~0–5 calls/day/user vs. ~4,320 before).

### 2. State-boundary dataset replaced (us-atlas 10m)
- Old `us-states.json` (89 KB, low-resolution PublicaMundi) replaced with `src/geo/states.json` (612 KB, us-atlas 10m, 56 features incl. DC + territories).
- New format is an **array of `{ id, name, bbox, geometry }`** instead of a GeoJSON FeatureCollection. Loaders on all 3 platforms (JS, Kotlin, Swift) auto-detect root shape for backward compatibility with the India FeatureCollection.
- Per-state county files generated in `src/geo/counties/<FIPS>.json` (3,231 counties, 56 files, 3.2 MB total). Bundled but not currently loaded — reserved for future city-enrichment work.
- Converter script: `geo-convert.js` at repo root. Re-run with `node geo-convert.js` (requires `topojson-client` + `us-atlas` as devDeps, installed with `--legacy-peer-deps`).

### 3. bbox prefilter added
- All three detectors now skip polygons whose bounding box doesn't contain the point before running ray-casting / Turf.
- Expected polygon-in-polygon math reduction: >95% per location tick.
- India features carry no bbox — the check is a safe no-op for them.

### 4. Dead code cleanup
- `processWithLocalGeoJSON` in `LocationModule.kt` — stripped six commented-out blocks (legacy "Strong comparison", duplicate same-state check, dead `sendToDomigoAPI` calls, stale init block). Function is ~60% shorter, same behavior.
- `LocalStateDetectionService.js` — rewritten; old header comments pointed at removed files.

### 5. File layout changes
- **Added:** `src/geo/states.json`, `src/geo/counties/*.json`, `geo-convert.js`
- **Replaced (content):** `android/app/src/main/assets/us-states.json`, `ios/us-states.json`
- **Deleted:** `src/assets/us-states.json` (JS now reads from `src/geo/`)
- **Unchanged:** `src/assets/india-states.json`, `android/.../india-states.geojson`, `ios/india-states.geojson`
- `GEOFENCING_CHANGES.md` updated with new paths, regeneration instructions, bbox notes.

---

## Current feature-flag state

```js
// src/config/featureFlags.js
GEOFENCING_MODE    = 'local_native'
GEOFENCING_COUNTRY = 'US'
```

Under this config, the only automatic Google call path is the enrichment call inside `processWithLocalGeoJSON` — now state-change gated.

---

## Required before shipping

- [ ] **Android rebuild.** `android/app/src/main/assets/us-states.json` content changed + native Kotlin loader/detector changed. Ship requires Play build, not OTA.
- [ ] **iOS rebuild.** `ios/us-states.json` content changed + Swift loader/detector changed. Xcode will pick up new bundle content on clean build.
- [ ] **Smoke test `local_native` path.** Drop a test device across a state line (physically or via mock location); verify exactly one Google call per transition in API dashboard.
- [ ] **Smoke test same-state stationary.** Stationary device should produce zero Google calls over an hour. Previously ~180.
- [ ] **Verify bbox prefilter didn't break anything.** Detect state from a coordinate in each of CA, NY, TX, AK, HI, PR and confirm correct names returned.
- [ ] **Offline transition still works.** Turn airplane mode on, cross a state line (mock), reconnect — queued trip should flush.

---

## Outstanding issues (prioritized)

### Critical / security
- **`GOOGLE_KEY` hardcoded in source** at [CommonHelpers.js:7](src/helpers/CommonHelpers.js#L7). Still in git history. Rotate the key and move to `.env`. The `.env.development` file exists but the key is not referenced from it.
- **Backend URL is plain HTTP** — `http://3.91.116.18:4001` in [MainTracker.js:111](src/helpers/MainTracker.js#L111) and [axiosinstance.js:5](src/axios/axiosinstance.js#L5). Force HTTPS.

### High (Google cost)
- **`GEOCODE_INTERVAL = 0L`** at [LocationModule.kt:105](android/app/src/main/java/com/domigo/LocationModule.kt#L105). Throttle is disabled. Currently dormant because flag is `local_native`, but if anyone flips back to `'google'` mode for any reason, traffic returns. Restore to `45 * 60 * 1000L`.
- **Online path lacks debounce.** The 10-second debounce in `processWithLocalGeoJSON` only runs in the offline branch. A rapid GPS flap across a border while online triggers an immediate Google call + trip. Hoisting the debounce above the online/offline split would fix this.
- **`sendQueuedEntry` does inline Google call** at [LocationModule.kt:1455](android/app/src/main/java/com/domigo/LocationModule.kt#L1455) for city enrichment on each queued trip during offline-queue flush. Bounded by queue size so low impact, but worth capping.
- **Address autocomplete components have no debounce visible** in `AddressAutoComplete.js`, `GoogleAutoComplete.js`, `AddressAutoFill.js`. Every keystroke may be billed Places-autocomplete. Audit separately — this cost driver is distinct from the Geocoding leak we fixed.

### Medium (reliability / correctness)
- **`MIN_STAY_TIME = 10 * 1000`** at [LocationModule.kt:91](android/app/src/main/java/com/domigo/LocationModule.kt#L91). Comment says "2 min"; value is 10 s. Either fix the comment or raise to 2 min. Short stays create spurious trips during highway transit.
- **Midnight scheduler DST-fragile.** [App.tsx:72](App.tsx#L72) uses `setHours(24, 0, 5, 0)` — non-standard. Replace with proper date arithmetic (or `dayjs`).
- **Listener cleanup missing on app termination.** `locationEventEmitter.addListener` subscribers in [MainTracker.js:406-486](src/helpers/MainTracker.js#L406-L486) are only removed when tracking stops explicitly. Memory accumulates if tracking toggles during a session.
- **`OfflineQueueService.flush()` called without `sendFn`** at [MainTracker.js:86](src/helpers/MainTracker.js#L86). Silent `TypeError` inside the flush loop drops retries. Pass the JS `sendFn` or guard the call.
- **No React Error Boundary.** Any unhandled render error crashes the app with no fallback.

### Low (code quality)
- 377+ `console.log` calls throughout `src/`. Strip with `babel-plugin-transform-remove-console` for production builds.
- ESLint has no enforced rules — `.eslintrc.js` just extends `@react-native`. Add at minimum: `no-unused-vars`, `no-console` (warn), `prefer-const`.
- TypeScript barely adopted — `tsconfig.json` includes 1 file. Migrate `src/helpers/` and `src/redux/` first.
- Only smoke test exists in `__tests__/`. No unit tests for `OfflineQueueService` or `LocalStateDetectionService`.

### Architectural (longer-term)
- **County ≠ city for tax-residency purposes.** The bundled county data is not a correct proxy for "city" in NYC (5 counties), Bergen County NJ (70 municipalities), LA County (88 cities), etc. Before building a county→city cache, revisit the data source — TIGER "places" dataset or Google Places as a limited, cached fallback.
- **Large screen files** — CalendarScreen (2,455 lines), ResidencyRecords (2,272), HomeScreen (1,449). Break up + memoize heavy lists.
- **Redux selectors underused** — screens access `state.auth` / `state.common` directly. Refactoring Redux shape would break all screens.

---

## Useful artifacts from this session

- Converter: `geo-convert.js`
- Devdeps added (via `npm install --legacy-peer-deps`): `topojson-client`, `us-atlas` — both can be removed after regeneration is done:
  ```bash
  npm uninstall topojson-client us-atlas --legacy-peer-deps
  ```
- `node_modules/us-atlas` is ~18 MB, ships nothing to the RN bundle — safe to remove once `src/geo/` is checked in.

---

## Quick reference — Google API trigger map (post-fix)

| Path | When it fires | Guard |
|---|---|---|
| `processWithLocalGeoJSON` → `reverseGeocodeInBackground` | State transition (polygon) | `newState != oldState` + `isInternetAvailable` |
| `processLocationInBackground` → `reverseGeocodeInBackground` | Every tick in `google` mode | `GEOCODE_INTERVAL` (currently disabled) |
| `sendQueuedEntry` inline geocode | Offline queue flush on reconnect | `isInternetAvailable` only |
| `MainTracker.js:_handleLocalJSDetection` → `_reverseGeocode` | State change in `local_js` mode | Turf `onStateChange` callback |
| UI forms / address autocomplete | User keystrokes | None visible — audit needed |

---

_Session conducted with GEOFENCING_MODE='local_native', GEOFENCING_COUNTRY='US'. All code paths for `'google'` and `'IN'` preserved but untested this session._

---

## Addendum — battery + Apple-review optimizations (same day)

### Android
- `locationInterval: 20000L → 60000L` ([LocationModule.kt:62](android/app/src/main/java/com/domigo/LocationModule.kt#L62))
- `locationDistance: 0f → 100f` ([LocationModule.kt:63](android/app/src/main/java/com/domigo/LocationModule.kt#L63)) — stationary users now produce zero GPS wake-ups
- `GEOCODE_INTERVAL: 0L → 60 * 60 * 1000L` ([LocationModule.kt:110](android/app/src/main/java/com/domigo/LocationModule.kt#L110)) — restored the 1 h safety throttle for the `google` fallback mode

### iOS
- `desiredAccuracy: kCLLocationAccuracyBest → kCLLocationAccuracyHundredMeters` in both [locationModule.swift:250](ios/locationModule.swift#L250) and [AppDelegate.swift:197](ios/domiGo/AppDelegate.swift#L197) — ~10× less battery
- `distanceFilter: 50 → 100`
- Added `activityType = .other` — lets iOS power-manage more aggressively

### JS
- `MainTracker.js` config `interval: 20000 → 60000` ([MainTracker.js:115](src/helpers/MainTracker.js#L115))

### Accuracy impact (verified)
- State widths are 100+ km; 100 m accuracy is 1000× over-sufficient for state-border detection.
- At 60 mph a driver covers 1.6 km/min; 1-min polling still catches every state crossing well before the next tick.
- Walkers (~5 km/h): cover 83 m/min → will trigger the 100 m filter every ~1.2 min. Still adequate.

### Apple review posture — improved but not complete
- Primary wakeup is `startMonitoringSignificantLocationChanges()` (Apple-endorsed for this use case). ✓
- Accuracy matches the stated purpose (state-level tracking, not street-level). ✓
- `activityType` set, signalling intent to iOS. ✓

Remaining review risks (not touched today):
- `startUpdatingLocation()` is called in multiple places in [AppDelegate.swift](ios/domiGo/AppDelegate.swift) (lines 57, 278, 476, 502, 674, 678). Some may be intentional (bounded bursts after SLC wake); others may be leftovers. Needs an audit — Apple reviewers ask why `startUpdatingLocation` is needed if SLC covers the use case.
- Info.plist usage descriptions ([Info.plist:56-61](ios/domiGo/Info.plist#L56-L61)) are generic. Apple prefers specific, user-facing language, e.g. "to track which state you're in for accurate tax-residency reporting, even when the app is closed."
