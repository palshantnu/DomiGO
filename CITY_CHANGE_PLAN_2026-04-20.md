# City/County Change Detection — Implementation Plan

**Goal:** use the bundled `src/geo/counties/*.json` data to detect county transitions locally, create automatic records for each change, display them on the calendar, but **exclude them from trip counts**.

**Decision:** use county as the "city" proxy. This is accurate enough for most US geography but imprecise in large metros (see "Known limitations" below). Revisit later if users complain.

---

## Concept

```
Every location tick:
  state = detectState(lat, lng)
  county = detectCounty(state.fips, lat, lng)   ← NEW

  if state changed      → trip event  (existing, unchanged)
  elif county changed   → city_change event  ← NEW
  else                  → no-op
```

A **trip** is a state crossing. A **city_change** is a county crossing *within the same state*. Both fire automatically, both persist to the same `/api/trip-days` table, but the client/backend distinguish them by `kind` so trip counts ignore `city_change` rows.

---

## Data model

### New event shape (same table, new `kind`)

```json
{
  "kind": "city_change",
  "date": "2026-04-20",
  "state": "California",
  "stateCode": "CA",

  "fromCity": "San Benito",        // prev county name
  "fromCityFips": "06069",
  "fromLat": 36.50, "fromLng": -121.40,

  "destinationCity": "Monterey",   // new county name
  "destinationCityFips": "06053",
  "destinationLat": 36.60, "destinationLng": -121.60,

  "startDate": 1713600000000,      // entered prev county at
  "endDate":   1713610000000,      // entered new county at
  "creationType": "automatic",
  "isTravelling": false            // NOT a trip for count purposes
}
```

### Backend contract (coordinate with API team)

- Accept `kind = "city_change"` on `POST /api/trip-days`.
- Calendar listing endpoint returns all kinds; client filters by kind.
- **Trip-count endpoint must filter out `kind = "city_change"`.** This is the critical change on the server.
- No schema migration needed if `trip_days` already has `kind` column; just a new enum value.

### Client state additions

Add to Kotlin (`LocationModule.kt`), Swift (`locationModule.swift`), and optionally Redux:

```kotlin
private var previousCountyFips: String = ""   // "06069"
private var previousCountyName: String = ""   // "San Benito"
private var previousCountyEnterTime: Long = 0L
private var lastCityChangeKey: String = ""    // dedupe
```

Persist these alongside existing `previousStateName` in SharedPreferences / UserDefaults so they survive app kill.

---

## Architecture

### 1. Detection layer

**State detector returns FIPS + name** (small refactor). New `states.json` already has `id`:

```kotlin
data class StateMatch(val fips: String, val name: String)
private fun detectStateFromGeoJSON(lat, lng): StateMatch? { ... }
```

Then add a county detector that loads only the current state's county file:

```kotlin
private val countyCache = mutableMapOf<String, JSONArray>()

private fun detectCountyFromGeoJSON(stateFips: String, lat: Double, lng: Double): CountyMatch? {
    val features = countyCache.getOrPut(stateFips) {
        val raw = context.assets.open("counties/$stateFips.json").bufferedReader().use { it.readText() }
        JSONArray(raw)
    }
    for (i in 0 until features.length()) {
        val f = features.getJSONObject(i)
        // bbox prefilter
        val bb = f.optJSONArray("bbox")
        if (bb != null && bb.length() == 4) {
            if (lng < bb.getDouble(0) || lng > bb.getDouble(2) ||
                lat < bb.getDouble(1) || lat > bb.getDouble(3)) continue
        }
        if (pointInGeometry(lat, lng, f.getJSONObject("geometry"))) {
            return CountyMatch(f.getString("id"), f.getString("name"))
        }
    }
    return null
}
```

**Counties file bundling:** currently only `src/geo/counties/*.json` exists. Must also be copied to `android/app/src/main/assets/counties/*.json` and added to the iOS Xcode bundle. Options:

- **Simplest:** script-copy all 56 files; add to Xcode as a folder reference (`counties/` as blue-folder so new files auto-bundle).
- **Lighter:** bundle only top-N most-populated states initially, add rest later. Risky.

I'd go simple. Total added weight is 3.2 MB; acceptable.

**JS side** (`LocalStateDetectionService.js`) — Metro can't do dynamic require, so build an explicit map:

```js
const countyLoaders = {
  '01': () => require('../geo/counties/01.json'),
  '02': () => require('../geo/counties/02.json'),
  // ...all 56
};
```

Generate this at build time with a small node script (or commit manually — 56 lines).

### 2. Main dispatch: extending `processWithLocalGeoJSON`

```kotlin
private fun processWithLocalGeoJSON(lat: Double, lng: Double) {
    val state = detectStateFromGeoJSON(lat, lng) ?: return

    // First-time init (unchanged)
    if (previousStateName.isEmpty()) { /* ...seed state... */ ; return }

    // STATE CHANGE → fire trip (unchanged path)
    if (!state.name.equals(previousStateName, ignoreCase = true)) {
        // …existing online/offline branches…
        // After trip is sent, also seed previousCounty for the NEW state:
        detectCountyFromGeoJSON(state.fips, lat, lng)?.let {
            previousCountyFips = it.fips
            previousCountyName = it.name
            previousCountyEnterTime = System.currentTimeMillis()
        }
        return
    }

    // SAME STATE → check county
    val county = detectCountyFromGeoJSON(state.fips, lat, lng) ?: return

    if (previousCountyFips.isEmpty()) {
        // seed on first same-state tick after app install
        previousCountyFips = county.fips
        previousCountyName = county.name
        previousCountyEnterTime = System.currentTimeMillis()
        saveStateToPrefs()
        return
    }

    if (county.fips == previousCountyFips) return  // no change

    // COUNTY CHANGED → fire city_change event
    handleCountyTransition(state, county, lat, lng)
}
```

### 3. `handleCountyTransition` — the new method

Mirrors state-change logic but simpler (no Google call; county name is authoritative from local data):

```kotlin
private fun handleCountyTransition(state: StateMatch, newCounty: CountyMatch, lat, lng) {
    // Debounce — county borders are finer than state borders; 30 s is a good default
    val now = System.currentTimeMillis()
    if (countyChangeDetectedTime == 0L) { countyChangeDetectedTime = now; return }
    if (now - countyChangeDetectedTime < 30_000) return
    countyChangeDetectedTime = 0L

    // Min stay
    if (now - previousCountyEnterTime < MIN_COUNTY_STAY_MS) return  // suggest 3 min

    val key = "${previousCountyFips}_${newCounty.fips}_$previousCountyEnterTime"
    if (key == lastCityChangeKey) return
    lastCityChangeKey = key

    val origin = previousCountyName
    val originEnterTime = previousCountyEnterTime

    previousCountyFips = newCounty.fips
    previousCountyName = newCounty.name
    previousCountyEnterTime = now
    saveStateToPrefs()

    sendEntryFormData(
        kind = "city_change",
        date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
        isTravelling = false,
        state = state.name,
        originCity = origin,
        originState = state.name,
        destinationCity = newCounty.name,
        destinationState = state.name,
        destinationLat = lat,
        destinationLng = lng,
        startDate = originEnterTime,
        endDate = now,
        creationType = "automatic",
        // ...other fields zeroed or omitted
    )
}
```

The **`sendEntryFormData` function already exists** and just puts the `kind` field on the multipart payload. No new HTTP plumbing needed — this reuses the existing offline-queue-capable pipeline.

### 4. iOS parity

Mirror everything in Swift:
- Add `detectCountyFromGeoJSON(stateFips:, lat:, lng:)` method with a county cache.
- Extend `processWithLocalGeoJSON` similarly.
- Persist `previousCountyFips` / `previousCountyName` / `previousCountyEnterTime` in `UserDefaults` (same pattern as current `previousStateName`).

### 5. JS mirror (for `local_js` mode)

Minimal additions in `LocalStateDetectionService.js`:

```js
let currentCountyFips = null;
let currentCountyName = null;

function detectCounty(stateFips, latitude, longitude) {
  const loader = countyLoaders[stateFips];
  if (!loader) return null;
  const counties = loader();
  for (const c of counties) {
    if (c.bbox && (longitude < c.bbox[0] || longitude > c.bbox[2] ||
                   latitude < c.bbox[1] || latitude > c.bbox[3])) continue;
    if (booleanPointInPolygon(point([longitude, latitude]),
                              { type: 'Feature', geometry: c.geometry, properties: {} })) {
      return { fips: c.id, name: c.name };
    }
  }
  return null;
}

function handleLocationUpdate(lat, lng, onStateChange, onCityChange /* NEW */) {
  // state detection returns { fips, name } now
  // on same state → detectCounty → compare → fire onCityChange if changed
}
```

`MainTracker.js` wires the new callback and posts via the existing `_sendTripFromJS` but with `kind = "city_change"`.

### 6. Calendar UI

On the React Native calendar screen:

- Fetch all `trip-days` for the month (endpoint unchanged).
- Render `kind = "trip"` with current styling.
- Render `kind = "city_change"` with a distinct pill/pin: smaller dot, different color (e.g. gray), label `City → City`.
- **Trip count badge** must filter `kind !== "city_change"` — this is the one line that guarantees city changes don't inflate trip counts client-side (server should also filter, defence-in-depth).

Exact files likely affected:
- `src/screens/CalendarScreen.js`
- `src/screens/ResidencyRecords.js`
- Any trip-count selector in Redux

---

## Offline handling

Automatic, no new infrastructure: `sendEntryFormData` already enqueues to `OFFLINE_QUEUE_KEY` on network failure. The new `kind = "city_change"` payloads queue and flush exactly like trips.

---

## Edge cases & known limitations

| Issue | Mitigation |
|---|---|
| **County ≠ city in big metros.** NYC = 5 counties; LA County = 88 cities. "San Francisco" happens to be both a city and a county, but "Brooklyn → Manhattan" will fire as a county change, which is *probably* what the user wants. | Document for users. If it becomes a problem, switch to TIGER Places dataset or a cached Google-Places call keyed on county. |
| **GPS flap at county borders.** Counties are 10–100× smaller than states; borders are closer together. | 30 s debounce + 3 min min-stay. |
| **First tick after install / app kill.** `previousCountyFips` empty → seed, don't fire. | Seed-on-empty pattern (see code above). |
| **State change + county change in same tick** (user crosses state line). | State-change path takes precedence; county is seeded on entry to new state, no duplicate event. |
| **Alaska / Hawaii / island counties.** Separate landmasses, correct FIPS. | No special handling needed — polygon data is already correct. |
| **DC, Puerto Rico, territories** (FIPS 11, 72, 66, 60, 78, 69). | Already in counties/ data. Works. |
| **User drives through 5 counties on a highway.** Each transition produces an event. | Acceptable — that's the literal truth. If users complain, add a "minimum distance from prev county" check (e.g., 5 km). |
| **Counties that span a state line.** None in the US data — counties never cross state lines. | Non-issue. |
| **Metro bundler dynamic require.** `require(\`../geo/counties/${fips}.json\`)` doesn't work. | Explicit `countyLoaders` map, one entry per state. Generate with a tiny build script. |

---

## Phased rollout

**Phase 0 — Backend coordination (BLOCKING, in parallel with Phase 1)**
- Backend adds `WHERE kind != 'city_change'` to the trip-count query and the days-in-state aggregator.
- Backend accepts `kind = 'city_change'` on `POST /api/trip-days` validator.
- Ship to staging; confirm counts unchanged when test `city_change` rows are inserted manually.
- **Do not flip client feature flag to `true` until this is live in production.**

**Phase 1 — Client data plumbing (1 day)**
- Copy `src/geo/counties/*.json` into `android/app/src/main/assets/counties/` and iOS Xcode bundle (folder reference).
- Generate `countyLoaders` map for JS (explicit require per state, Metro-friendly).
- Add `CITY_CHANGE_EVENTS_ENABLED = false` to `src/config/featureFlags.js`.
- Plumb the flag through `setConfig` to native modules.

**Phase 2 — Detection (2 days)**
- `detectCountyFromGeoJSON` on Kotlin + Swift + JS with bbox prefilter + state-scoped county cache.
- Extend state detector to return `(fips, name)` tuple.
- Unit-test: feed known (lat, lng) pairs, confirm correct county.

**Phase 3 — Event pipeline (2 days)**
- Add `previousCountyFips` / `previousCountyName` / `previousCountyEnterTime` persistence on all three platforms.
- Extend `processWithLocalGeoJSON` / JS equivalent to call `handleCountyTransition` (gated behind `CITY_CHANGE_EVENTS_ENABLED`).
- Fire via existing `sendEntryFormData` with `kind = 'city_change'`.
- Verify offline queue handles the new payload identically to trip payloads.

**Phase 4 — UI + defence-in-depth filtering (2 days)**
- Calendar distinguishes `kind = 'trip'` vs `kind = 'city_change'` visually.
- Audit every trip-count selector / days-in-state display and add `kind === 'trip'` filter.
- Deep link / detail screen for city_change events ("You moved from X to Y in state Z on date").

**Phase 5 — QA + flip (2–3 days)**
- Verify Phase 0 backend changes are live in production.
- Mock-location scenarios:
  - Bay Area: SF → Alameda → Santa Clara → 3 city_change events, 0 trips, 0 Google calls.
  - NYC boroughs: Brooklyn → Manhattan → 1 city_change event.
  - State + county change: NY → NJ → trip (1), then NJ county hop → 1 city_change.
  - Offline drive through 5 counties → 5 queued events → reconnect → all flush.
- Verify trip count and days-in-state unchanged with city_change events present (both server-side and client-side).
- Battery soak: 24 h stationary + 2 h moving; compare to pre-feature baseline.
- Flip `CITY_CHANGE_EVENTS_ENABLED` to `true` for internal builds first, then staged rollout.

Estimated total: **~9 working days** client-side, plus ~0.5 day backend. Phase 0 can run in parallel with Phase 1–2.

---

## Effort breakdown

| Area | Complexity | Notes |
|---|---|---|
| Kotlin implementation | Medium | Clean extension of existing `processWithLocalGeoJSON` |
| Swift implementation | Medium | Same pattern as Kotlin |
| JS implementation | Medium | Needs explicit `countyLoaders` map |
| iOS bundling | Low | Add `counties/` folder reference in Xcode |
| Android bundling | Low | File copy into `assets/counties/` |
| Backend | Low | One new kind value + one trip-count filter |
| Calendar UI | Medium | Depends on existing component structure |
| QA / mock-location testing | Medium-High | Counties are small; many test cases |

---

## Decisions locked (2026-04-20)

- **Storage path:** server-persisted via existing `/api/trip-days`, NOT local-only. Rationale: tax-residency records must survive reinstall and appear in compliance exports.
- **Trip-count exclusion:** backend-enforced (authoritative) + frontend-enforced (defence-in-depth). See "Backend dependencies" below.
- **Feature flag kill switch:** add `CITY_CHANGE_EVENTS_ENABLED` to `src/config/featureFlags.js`. Default `false`. Only enable in production after backend filter is confirmed live.
- **County as "city" proxy:** accepted for MVP. Document for users; revisit if metro complaints arise.

## Decisions still needed (before coding)

1. **Min-stay threshold.** 3 min suggested; confirm with PM. If residency rules require demonstrable "presence", may need 5–10 min.
2. **First-tick seeding behaviour.** When user opens app for the first time in a new county — seed silently (no event), or fire a "state entry" marker? Suggested: seed silently, fire only on actual transition.
3. **Editability.** Are auto-generated city_change events user-editable like manual trips, or read-only? Suggested: read-only, with a "delete" option in case of GPS error.
4. **Calendar rendering.** Needs design input — icon, color, stacked vs inline.

## Backend dependencies (BLOCKING — must ship before feature flag flips on)

Two SQL filters to add:

```sql
-- trip-count endpoint
WHERE kind != 'city_change'

-- days-in-state aggregation
WHERE kind != 'city_change'
```

Plus accept `kind = 'city_change'` on the `POST /api/trip-days` validator (add to the enum).

Coordinator: whoever owns the residency/compliance backend code. Est. 5–10 LOC + one migration note (no schema change — `kind` is already a free-text column or enum that needs one new value).

## Client-side defence-in-depth

On top of the backend filter, the client MUST also filter `kind === 'city_change'` out of any screen that displays counts:

- Trip-count badge on home screen
- "Days in California" cards
- Any Redux selector named `selectTripCount` / `selectDaysInState` / similar

This protects against:
- Stale client cache serving an unfiltered list before backend filter deploys
- Future backend bugs accidentally un-filtering the rows
- Any `trip-days` list endpoint that returns all rows (we filter at render time, not fetch time)

Pattern:

```js
const tripCount = tripDays.filter(t => t.kind === 'trip').length;
// NOT: tripDays.length
```

## Feature-flag kill switch

Add to `src/config/featureFlags.js`:

```js
// Gate the city_change event emission. Set to true only after backend
// adds `WHERE kind != 'city_change'` to trip-count and days-in-state queries.
export const CITY_CHANGE_EVENTS_ENABLED = false;
```

Wire into `MainTracker.js` and both native modules:

```js
if (!CITY_CHANGE_EVENTS_ENABLED) return;  // early return before sendEntryFormData
```

```kotlin
if (!BuildConfig.CITY_CHANGE_EVENTS_ENABLED) return  // or pass via setConfig
```

```swift
guard cityChangeEventsEnabled else { return }
```

This means:
- Detection code ships in client immediately (safe to merge).
- Events don't flow until someone flips the flag.
- If backend filter breaks mid-production, flip flag off in hotfix without reverting the whole feature.

---

## Out of scope for this plan (flag for later)

- True city detection via TIGER Places or Google Places with caching.
- City-change based metrics (time spent per city, distance travelled).
- Redesigning the trip-days schema to be normalized (separate table for auto-events).
- Export of city-change events in tax-residency reports.
