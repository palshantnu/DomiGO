# DomiGo — Architecture

## 1. What the app does

DomiGo is a React Native (0.82, RN new architecture-era deps) app that automatically
tracks which **US state** (and, optionally, **county**) a user is physically present
in each day, using background location. It turns that into a day-by-day residency
calendar, trip/day records, and exports — used to help users manage **state tax
residency** (e.g. the 183-day rule). Subscriptions unlock reporting/compliance
features.

Platforms: Android + iOS, one shared JS codebase, two platform-specific native
location modules (Kotlin / Swift) that do the heavy lifting of background tracking
and (in one mode) on-device geofencing math.

---

## 2. High-level layers

```
┌─────────────────────────────────────────────────────────────────┐
│  UI layer (React Native screens + navigation)                   │
│  src/screens/*, src/navigation/*                                 │
├─────────────────────────────────────────────────────────────────┤
│  State layer (Redux Toolkit + redux-persist)                     │
│  src/redux/{store,rootReducer,reducers,actions,selectors}         │
├─────────────────────────────────────────────────────────────────┤
│  Domain/services layer (JS)                                      │
│  src/helpers/MainTracker.js        — orchestrates tracking        │
│  src/services/LocalStateDetectionService.js — JS geofencing (Turf)│
│  src/services/OfflineQueueService.js        — offline retry queue │
│  src/services/subscriptionService.js        — IAP wrapper         │
│  src/config/featureFlags.js, featureAccess.js — flags/entitlements│
├─────────────────────────────────────────────────────────────────┤
│  Native bridge (per-platform, same JS-facing API)                │
│  NativeModules.LocationTracker                                    │
│   → android/.../LocationModule.kt   (~3.3k LOC)                  │
│   → ios/locationModule.swift        (~3.2k LOC)                  │
├─────────────────────────────────────────────────────────────────┤
│  Backend API (external)                                          │
│  https://stage.mydomigo.com/api/  (staging — see §8)             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Navigation

`src/navigation/index.js` — one `RootNavigator` (stack) that switches on auth state:

- **Splash** (5s timer) → then either:
  - `Main` (bottom tabs) if `state.auth.SignIn && userData !== ''`
  - `TaxResidencyIntro` (onboarding) otherwise
- Auth stack: `Login`, `Signup` (email/password + Google + Apple sign-in;
  Facebook button present but not wired up)
- `Main` = bottom tab navigator (`MainTabs`):
  - **Dashboard** → `HomeNavigation` (stack wrapping `HomeScreen`, `MetricsScreen`, etc.)
  - **Calendar** → `CalendarScreen`
  - **AddTripNavigation** (center "+" tab) → manual trip/day entry flow
  - **Alerts** → `AlertsScreen`
  - **Settings** → `SettingsNavigation` (Profile, Subscription, Reports export,
    Privacy, Help, About)
- Modal/detail screens pushed on top of tabs: `TripDetail`, `DayDetail`,
  `StateTripsScreen`, `AddMissingDayScreen`, `ReportsExport`, `PermissionScreen`.

Auth-gating is read straight from the Redux store via `connect()` (not a
navigation guard/effect), so login state changes trigger a re-render of
`RootNavigator` which swaps the stack.

---

## 4. State management

`src/redux/store.js` — `configureStore` (Redux Toolkit) wrapped in `redux-persist`
(AsyncStorage-backed), persisting the whole `auth` + `common` + `subscription`
slices.

| Slice | Reducer | Holds |
|---|---|---|
| `auth` | `reducers/auth.js` | login token, user profile, sign-in flag |
| `common` | `reducers/common/common.js` | misc app/UI state |
| `subscription` | `reducers/subscription.js` | plan (`none/trial/lite/full`), product id, purchase/expiry dates, IAP product list, loading/error |

Async logic lives in **thunks** dispatched from `action-creator.js` (e.g. `SIGNIN`,
`INIT_IAP`), using `axiosinstance` for HTTP. There's no RTK Query / saga — plain
thunks + a small `useAPI` hook (`src/helpers/useAPI.js`) that wraps a promise with
loading state for screens.

Feature gating (`src/config/featureAccess.js`) is a pure lookup table
(`plan → { compliance_score, export_reports, document_upload, ... }` booleans),
consumed by `src/helpers/featureGate.js`; **not** derived from the backend at
runtime — it's a client-side matrix keyed by `subscription.plan`.

---

## 5. Networking

- `src/axios/axiosinstance.js` — single axios instance, `baseURL` hardcoded to
  `https://stage.mydomigo.com/api/` (⚠️ staging — see §8). A request interceptor
  reads `loginToken` straight out of the Redux store and attaches
  `Authorization: Bearer <token>`.
- `src/services/EndPoints.js` — flat map of REST paths (`auth/login`, `trips`,
  `residency-doc`, …).
- Trip/day records are posted as `multipart/form-data` to `trip-days` (see §6) —
  this path is **not** in `EndPoints.js`, it's inlined in `MainTracker.js`/`App.tsx`.

---

## 6. Location tracking & geofencing (the core feature)

### 6.1 Control point

Everything branches on two flags in `src/config/featureFlags.js`:

```js
GEOFENCING_MODE     // 'google' | 'local_js' | 'local_native'   (currently 'local_native')
GEOFENCING_COUNTRY  // 'US' | 'IN' | 'CA'                        (currently 'US')
CITY_CHANGE_EVENTS_ENABLED // bool kill-switch for county-level events
```

| Mode | State detection | Google API cost |
|---|---|---|
| `google` | Android: Google Geocoding API · iOS: `CLGeocoder` | Yes |
| `local_js` | JS: Turf.js point-in-polygon over bundled GeoJSON (`src/assets/us-states.json`, `india-states.geojson`) | Zero |
| `local_native` | Kotlin/Swift ray-casting over the same bundled GeoJSON, run natively | Zero |

### 6.2 Flow

1. `LoginScreen` / `App.tsx` (auto-resume on relaunch) call
   `DomigoTracker.startDomigoTracking(token)` (`src/helpers/MainTracker.js`).
2. That calls `NativeModules.LocationTracker.setConfig({...})` then
   `.startLocationTracking()` — a **native foreground/background location
   service** (Android foreground service + significant-location-change on iOS)
   takes over.
3. Native side detects the current state (via one of the 3 modes above),
   compares to the last-known state (persisted in `SharedPreferences` /
   `UserDefaults` so it survives app kill), and on a change:
   - `local_native`: builds and POSTs the trip payload itself (native HTTP —
     OkHttp/URLSession), then emits `onTripApiResponse` / `onTripApiError` back to JS
     for logging/UI.
   - `local_js`: emits `onLocationChanged` to JS; `MainTracker.js`
     (`_handleLocalJSDetection`) runs `LocalStateDetectionService` in JS, reverse-
     geocodes the city via Google Geocoding (`_reverseGeocode`), and POSTs to
     `trip-days` itself via axios.
4. **Offline resilience** (both paths): a failed POST is queued —
   natively to SharedPreferences/UserDefaults, or in JS to AsyncStorage via
   `OfflineQueueService` (`enqueue` → retried on `NetInfo` reconnect, capped at
   5 retries, dropped after that). `App.tsx` flushes the JS queue on mount.
5. **Boot / midnight resilience**: Android `BootReceiver` restarts the tracking
   service after reboot; a JS `scheduleMidnight()` timer (local_js mode only)
   calls `DomigoTracker.createMissingDay()` to backfill a day with no
   state-change event; native code does the equivalent `backfillMissingDays()`
   for multi-day gaps (phone off for N days).
6. **County/city-change detection** (`CITY_CHANGE_EVENTS_ENABLED`): same GeoJSON
   approach, one level finer (county within a state), debounced (30s) and
   min-stay gated (see `CITY_CHANGE_PLAN_2026-04-20.md`), posted as
   `kind: "city_change"` — excluded from trip/day counts client-side
   (`kind === 'trip'` filters) and (should be) server-side.

### 6.3 Native module surface (`NativeModules.LocationTracker`)

JS-facing methods: `setConfig`, `startLocationTracking`, `stopLocationTracking`,
`isTracking`, `getLaunchContext`, `clearNotificationBadge`.

Events (via `NativeEventEmitter`): `onLocationChanged`, `onAddressResolved`,
`onApiSuccess`, `onLocationError`, `onLocationStatus`, `onCityChangeDetected`,
`onCityChangeDebug`, `onTripApiResponse`, `onTripApiError`, `onHoursApiSuccess`,
`onHoursApiError`.

Implemented in parallel in `android/app/src/main/java/com/domigo/LocationModule.kt`
and `ios/locationModule.swift` — these two files are the largest in the codebase
(~3,300 LOC each) and must be kept behaviorally in sync; see
`GEOFENCING_CHANGES.md` for the full changelog of what was added to each.

---

## 7. Authentication

- Email/password: `POST auth/login` via `SIGNIN` thunk → `axiosinstance`.
- Google: `@react-native-google-signin/google-signin` → Firebase
  `signInWithCredential` → backend login call with `type: "social", provider: "google"`.
- Apple: `@invertase/react-native-apple-authentication` → same Firebase +
  backend pattern with `provider: "apple"`.
- On successful login (any method): `DOMIGO_TRACKING_ENABLED` flag set in
  AsyncStorage, `DomigoTracker.startDomigoTracking(token)` kicked off, nav reset
  to `Main`. `App.tsx` re-arms tracking automatically on cold start if that flag
  and a stored token are present.
- Push notifications: Firebase Cloud Messaging, token fetched but not yet sent
  to backend (`deviceToken: fcmtoken || "123456"` fallback is a placeholder).

---

## 8. Monetization (IAP)

`src/services/subscriptionService.js` wraps `react-native-iap` (v15):

- Products: `domigo_lite_yearly`, `domigo_full_yearly` (both `type: 'subs'`).
- `initIAP()` — memoized connection init.
- `buySubscription(sku)` — Android path resolves the offer token from the last
  fetched product list (required by IAP v15+ for subscriptions); iOS just
  requests the SKU.
- `subscribeToPurchaseUpdates` — global listener wired once in `App.tsx` via the
  `INIT_IAP` thunk; finishes/acknowledges transactions and dispatches
  `SET_SUBSCRIPTION_PLAN`.
- Entitlements are then read off `subscription.plan` through
  `featureAccess.js`'s static matrix (trial/full = everything on, lite/none =
  everything off — i.e. "lite" currently grants no extra features over free,
  which looks unintentional and worth double-checking against product intent).

---

## 9. Directory map (JS side)

```
App.tsx                        — app root: providers, IAP init, FCM, location
                                  permission bootstrap, midnight scheduler
src/
  navigation/                  — RootNavigator, per-tab stack navigators
  screens/                     — one file per screen (Auth/, plus flat list)
  redux/
    store.js, rootReducer.js
    reducers/{auth,common,subscription}.js
    actions/{action-creator,action-types}.js
    selectors/common.js
  services/
    EndPoints.js
    LocalStateDetectionService.js  — Turf.js state detection (local_js mode)
    OfflineQueueService.js         — AsyncStorage retry queue
    subscriptionService.js         — react-native-iap wrapper
  helpers/
    MainTracker.js              — JS orchestration of native tracker
    LocationTracker.js, locationPermission2.js, locationGuard.js,
    locationRedirect.js, locationService.js, gpsStatus.js — permission/UX glue
    NavigationService.js        — navigationRef for nav-outside-components
    useAPI.js                   — promise+loading hook for screens
    featureGate.js              — reads featureAccess.js matrix
    CommonHelpers.js            — toast, Google key constant, misc utils
  config/
    featureFlags.js             — geofencing mode/country/kill-switches
    featureAccess.js            — plan → feature boolean matrix
  axios/axiosinstance.js        — HTTP client + auth header interceptor
  assets/                       — images, bundled GeoJSON state boundaries
  geo/counties/                 — per-state county GeoJSON (city-change feature)
  theme/colors.js

android/app/src/main/java/com/domigo/
  LocationModule.kt             — native tracking, geofencing, offline queue, HTTP
  BootReceiver.kt               — restarts tracking service after reboot

ios/
  locationModule.swift          — native tracking, geofencing, offline queue, HTTP
```

---

## 10. Cross-cutting design notes

- **Single source of truth for tracking behavior** is
  `src/config/featureFlags.js` — flipping one constant changes JS + both native
  platforms' behavior without touching call sites (documented in
  `GEOFENCING_CHANGES.md`).
- **Data model**: everything the tracker creates is a row in the backend's
  `trip-days` table, distinguished by a `kind` field (`trip`, `missing`,
  `city_change`, …). The client is expected to filter non-`trip` kinds out of
  any count/badge (`tripDays.filter(t => t.kind === 'trip')`), and the server is
  expected to do the same authoritatively — see `CITY_CHANGE_PLAN_2026-04-20.md`
  §"Client-side defence-in-depth" for why both layers filter.
- **Offline-first for tracking events**: both the native and JS paths never
  drop a state-change event outright on network failure — they queue, and
  three separate mechanisms (NetInfo listener, app-mount flush, retry cap)
  exist to eventually deliver or give up loudly (`console.warn`) after 5 tries.
- **Dead/duplicate code present**: `LoginScreen.js` carries ~250 lines of
  commented-out earlier implementations of Google/Apple sign-in; a Facebook
  login icon renders but has no handler; "Forgot Password" has no handler.
  Worth cleaning up before a store submission review.

---

## 11. Known gaps / risks (worth tracking)

| Area | Risk |
|---|---|
| `axiosinstance.js` baseURL | Hardcoded to `stage.mydomigo.com` — must point to production before release builds. |
| Dead UI controls | Facebook button, Forgot Password — no-ops that read as bugs to reviewers/users. |
| `featureAccess.js` | `lite` plan currently maps to all-`false`, identical to `none` — confirm this is intentional. |
| FCM device token | Falls back to a hardcoded `"123456"` if the real token isn't ready yet; backend will store junk tokens for those users. |
| Native module duplication | Kotlin and Swift implementations (~3.2–3.3k LOC each) must be manually kept in sync for every geofencing change — no shared logic layer between platforms for the native modes. |
| `CITY_CHANGE_EVENTS_ENABLED` | Currently `true` in `featureFlags.js` — per `CITY_CHANGE_PLAN_2026-04-20.md` this must only be `true` once the backend's `WHERE kind != 'city_change'` filters are confirmed live, otherwise trip/day counts inflate. |
