package com.gohome.domigo

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import okhttp3.*
import org.json.JSONObject
import java.io.IOException
import java.util.concurrent.TimeUnit
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.Calendar
import org.json.JSONArray
import androidx.core.location.LocationCompat
// import android.os.Build


class LocationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: Context = reactContext
    private lateinit var locationManager: LocationManager
    private lateinit var locationListener: LocationListener
    private var isTracking = false

    init {
        LocationModuleHolder.module = this
        // loadStateFromPrefs()
    }
    override fun initialize() {
        super.initialize()
        loadStateFromPrefs()
    }

    // HTTP client for background network calls
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    private val prefs: SharedPreferences =
        reactContext.getSharedPreferences("domigo_location", Context.MODE_PRIVATE)

    // Configuration
    // 60s interval + 100m distance filter: for state-level tracking this is the sweet spot —
    // stationary users produce 0 wake-ups (GPS noise < 100m), driving users still get a fix
    // well before crossing any state line (at 60 mph ≈ 1.7km/min vs. state widths of 100+ km).
    // private var locationInterval: Long = 60000L
    private var locationInterval: Long = 20000L
    // private var locationDistance: Float = 100f
    private var locationDistance: Float = 0f
    private var googleApiKey: String = ""
    private var domigoToken: String = ""
    private var apiUrl: String = ""
    private var geofencingMode: String = ""
    private var geofencingCountry: String = ""

    // Phase 1 kill switch for city/county change detection. Set via JS setConfig.
    // When false (default), no county_change events are emitted regardless of GPS input.
    // Must stay false until the backend filters kind='county_change' from trip-count queries.
    private var cityChangeEventsEnabled: Boolean = false

    // Track last values to avoid duplicate API calls
    private var lastState: String = ""
    private var lastApiTime: Long = 0

    // Track previous state info
    private var previousLat: Double? = null
    private var previousLng: Double? = null
    private var previousCity: String = ""
    private var previousStateName: String = ""
    private var previousStateCode: String = ""
    private var previousCountryCode: String = ""
    private var previousEnterTime: Long = 0L

    private var currentStateName: String = ""
    private var isTransitionInProgress = false
    private var stateChangeDetectedTime: Long = 0L


    private var previousCountyFips: String = ""
    private var previousCountyName: String = ""
    private var previousCountyEnterTime: Long = 0L

    private var previousCityFips: String = ""
    private var previousCityName: String = ""
    private var previousCityEnterTime: Long = 0L

    private var lastCityChangeKey: String = ""
    private var countyChangeDetectedTime: Long = 0L

    private var lastBoundaryStartTime: Long = 0L

    // private val MIN_COUNTY_STAY_MS = 1 * 60 * 1000 // 3 min
    // private val MIN_COUNTY_STAY_MS = 20 * 1000 // 3 min
    private val MIN_COUNTY_STAY_MS =  3000 // 3 min

    private var lastGeocodeTime: Long = 0L

    // GeoJSON cache for local_native mode
    private var geoJsonFeatures: JSONArray? = null

    private var lastTripKey: String = ""
    // private val MIN_STAY_TIME = 2 * 60 * 1000 // 2 min
    private val MIN_STAY_TIME = 10 * 1000 // 2 min
    private var lastLocationPingTime: Long = 0
    private var lastHoursApiTime: Long = 0
    private var lastSentState: String = ""



    companion object {
        private const val TAG = "LocationModule"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "location_service_domigo"
        private const val GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
        private const val FOUR_HOURS_MS = 4 * 60 * 60 * 1000
        // private const val FOUR_HOURS_MS = 1 * 60 * 1000
        // Safety throttle for the `google` fallback mode only. Active mode `local_native`
        // calls Google on state change (not by this interval). 1 h = defence-in-depth in case
        // the feature flag is ever flipped back to `google` without reviewing cost.
        private const val GEOCODE_INTERVAL = 60 * 60 * 1000L
        private const val OFFLINE_QUEUE_KEY = "domigo_offline_trip_queue"
        private const val MAX_OFFLINE_RETRIES = 5
        private const val PREF_PREV_STATE_CODE = "domigo_prev_state_code"
        private const val PREF_PREV_STATE_NAME = "domigo_prev_state_name"
        private const val PREF_PREV_CITY = "domigo_prev_city"
        private const val PREF_PREV_LAT = "domigo_prev_lat"
        private const val PREF_PREV_LNG = "domigo_prev_lng"
        private const val PREF_PREV_COUNTRY = "domigo_prev_country"
        private const val PREF_PREV_ENTER_TIME = "domigo_prev_enter_time"
        private const val PREF_LAST_TRACKED_DATE = "domigo_last_tracked_date"
        private const val PREF_CURRENT_STATE = "domigo_current_state"
        private const val LOCATION_PING_INTERVAL = 15 * 60 * 1000 // 15 min
        private const val HOURS_API_INTERVAL = 4 * 60 * 60 * 1000L
        // private const val HOURS_API_INTERVAL = 30 * 60 * 1000L
        private const val PREF_LAST_HOURS_API_TIME = "pref_last_hours_api_time"
        private const val PREF_PREV_COUNTY_NAME = "pref_prev_county_name"
        private const val PREF_PREV_COUNTY_FIPS = "pref_prev_county_fips"
        private const val PREF_PREV_COUNTY_ENTER = "pref_prev_county_enter"

        private const val PREF_PREV_CITY_NAME = "pref_prev_city_name"
        private const val PREF_PREV_CITY_FIPS = "pref_prev_city_fips"
        private const val PREF_PREV_CITY_ENTER = "pref_prev_city_enter"
        
    }

    override fun getName(): String {
        return "LocationTracker"
    }

    @ReactMethod
    fun setConfig(config: ReadableMap) {
        try {
            if (config.hasKey("interval")) {
                locationInterval = config.getInt("interval").toLong()
            }
            if (config.hasKey("googleApiKey")) {
                googleApiKey = config.getString("googleApiKey") ?: ""
            }
            if (config.hasKey("domigoToken")) {
                domigoToken = config.getString("domigoToken") ?: ""
            }
            if (config.hasKey("apiUrl")) {
                apiUrl = config.getString("apiUrl") ?: ""
            }
            if (config.hasKey("geofencingMode")) {
                geofencingMode = config.getString("geofencingMode") ?: ""
            }
            if (config.hasKey("geofencingCountry")) {
                val nextCountry = config.getString("geofencingCountry") ?: ""
                if (nextCountry != geofencingCountry) {
                    geoJsonFeatures = null
                    countyFeatureCache.clear()
                    cityFeatureCache.clear()
                }
                geofencingCountry = nextCountry
            }
            if (config.hasKey("cityChangeEventsEnabled")) {
                cityChangeEventsEnabled = config.getBoolean("cityChangeEventsEnabled")
            }

            Log.d(TAG, "Config updated - Interval: $locationInterval, Mode: $geofencingMode, Country: $geofencingCountry, CityChange: $cityChangeEventsEnabled")

            backfillMissingDays()
        } catch (e: Exception) {
            Log.e(TAG, "Error setting config: ${e.message}")
            }
        }

    @ReactMethod
    fun startLocationTracking() {
        if (isTracking) {
            Log.d(TAG, "Location tracking already started")
            return
        }

        // Check location permissions
        if (ActivityCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED &&
            ActivityCompat.checkSelfPermission(
                context,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.e(TAG, "Location permission not granted")
            sendEvent("onLocationError", Arguments.createMap().apply {
                putString("error", "Location permission not granted")
            })
            return
        }

        // Only require Google API key when mode is 'google' or not set
        if (googleApiKey.isEmpty() && (geofencingMode.isEmpty() || geofencingMode == "google")) {
            Log.e(TAG, "Google API key not set")
            sendEvent("onLocationError", Arguments.createMap().apply {
                putString("error", "Google API key not configured")
            })
            return
        }

        try {
            startForegroundService()
            setupLocationListener()
            isTracking = true
            scheduleMidnightMissingDay()
            Log.d(TAG, "Location tracking started successfully with interval: $locationInterval ms")
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException: ${e.message}")
            sendEvent("onLocationError", Arguments.createMap().apply {
                putString("error", "Security exception: ${e.message}")
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error starting location tracking: ${e.message}")
            sendEvent("onLocationError", Arguments.createMap().apply {
                putString("error", "Failed to start location tracking: ${e.message}")
            })
        }
    }

    @ReactMethod
    fun stopLocationTracking() {
        if (!isTracking) {
            Log.d(TAG, "Location tracking already stopped")
            return
        }

        try {
            if (::locationManager.isInitialized && ::locationListener.isInitialized) {
                locationManager.removeUpdates(locationListener)
            }
            stopForegroundService()
            isTracking = false
            Log.d(TAG, "Location tracking stopped successfully")
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping location tracking: ${e.message}")
        }
    }

    @ReactMethod
    fun isTracking(promise: Promise) {
        promise.resolve(isTracking)
    }


    // private fun isLocationMocked(location: Location): Boolean {
    //     return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    //         location.isMock
    //     } else {
    //         LocationCompat.isMock(location)
    //     }
    // }

//     private fun sendFakeGpsDetectedEvent() {
//     try {
//         reactApplicationContext
//             .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
//             .emit("onFakeGpsDetected", null)
//     } catch (e: Exception) {
//         Log.e(TAG, "Error sending fake GPS event", e)
//     }
//    }

    private fun setupLocationListener() {
        locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                Log.d(TAG, "New location: ${location.latitude}, ${location.longitude}, Accuracy: ${location.accuracy}")

                // if (isLocationMocked(location)) {

                //     Log.e(TAG, "🚨 FAKE GPS DETECTED")

                //     sendFakeGpsDetectedEvent()

                //     stopLocationTracking()

                //     return
                // }
                                
                // Send basic location data to JS
                val locationData = Arguments.createMap().apply {
                    putDouble("latitude", location.latitude)
                    putDouble("longitude", location.longitude)
                    putDouble("accuracy", location.accuracy.toDouble())
                    putDouble("speed", location.speed.toDouble())
                    putDouble("altitude", location.altitude)
                    putDouble("bearing", location.bearing.toDouble())
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                    putString("provider", location.provider)
                }
                sendEvent("onLocationChanged", locationData)

                // Process location in background (reverse geocoding + API call)
                if (location.accuracy < 100) { // Only process if accuracy is better than 100 meters
                    processLocationInBackground(location)
                } else {
                    Log.w(TAG, "Location accuracy too poor: ${location.accuracy}, skipping processing")
                }
            }

            override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {
                Log.d(TAG, "Location status changed: $provider - $status")
            }

            override fun onProviderEnabled(provider: String) {
                Log.d(TAG, "Location provider enabled: $provider")
                sendEvent("onLocationStatus", Arguments.createMap().apply {
                    putString("provider", provider)
                    putString("status", "enabled")
                })
            }

            override fun onProviderDisabled(provider: String) {
                Log.d(TAG, "Location provider disabled: $provider")
                sendEvent("onLocationStatus", Arguments.createMap().apply {
                    putString("provider", provider)
                    putString("status", "disabled")
                })
            }
        }

        // Request location updates from both GPS and Network providers
        val providers = listOf(LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER)
        
        providers.forEach { provider ->
            try {
                if (locationManager.isProviderEnabled(provider)) {
                    locationManager.requestLocationUpdates(
                        provider,
                        locationInterval,
                        locationDistance,
                        locationListener
                    )
                    Log.d(TAG, "Location updates requested for provider: $provider with interval: $locationInterval ms")
                } else {
                    Log.w(TAG, "Location provider not enabled: $provider")
                }
            } catch (e: SecurityException) {
                Log.e(TAG, "SecurityException for provider $provider: ${e.message}")
            } catch (e: IllegalArgumentException) {
                Log.e(TAG, "IllegalArgumentException for provider $provider: ${e.message}")
            }
        }

        // Try to get last known location immediately
        try {
            var bestLocation: Location? = null
            providers.forEach { provider ->
                if (locationManager.isProviderEnabled(provider)) {
                    val lastLocation = locationManager.getLastKnownLocation(provider)
                    if (lastLocation != null && (bestLocation == null || 
                        lastLocation.accuracy < bestLocation!!.accuracy)) {
                        bestLocation = lastLocation
                    }
                }
            }
            
            bestLocation?.let { location ->
                Log.d(TAG, "Last known location: ${location.latitude}, ${location.longitude}")
                if (location.accuracy < 100) {
                    processLocationInBackground(location)
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "SecurityException getting last known location: ${e.message}")
        }
    }

    private fun isInternetAvailable(): Boolean {
        return try {
            val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE)
                    as android.net.ConnectivityManager
            val network = cm.activeNetwork ?: return false
            val capabilities = cm.getNetworkCapabilities(network) ?: return false
            capabilities.hasCapability(android.net.NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } catch (e: Exception) {
            false
        }
    }


private fun showTripCreatedNotification(
    title: String,
    message: String,
    tripId: String
) {
    val manager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Domigo Notifications",
            NotificationManager.IMPORTANCE_HIGH
        )
        manager.createNotificationChannel(channel)
    }

    val intent = Intent(context, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
        putExtra("type", "TRIP_CREATED")
        putExtra("tripId", tripId)
    }

    val pendingIntent = PendingIntent.getActivity(
        context,
        2001,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(android.R.drawable.ic_dialog_info)
        .setContentTitle(title)
        .setContentText(message)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_HIGH)
        .setContentIntent(pendingIntent)
        .build()

    manager.notify(System.currentTimeMillis().toInt(), notification)
}

fun toEnglishSafe(text: String): String {
    return text.replace(Regex("[^\\p{ASCII}]"), "")
}



private fun scheduleMidnightMissingDay() {

    val calendar = Calendar.getInstance().apply {
        timeInMillis = System.currentTimeMillis()
        // add(Calendar.MINUTE, 1)
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 5)
        add(Calendar.DAY_OF_MONTH, 1) // next midnight
    }
    // calendar.add(Calendar.MINUTE, 1) 

    val intent = Intent(context, MissingDayReceiver::class.java)

    val pendingIntent = PendingIntent.getBroadcast(
        context,
        8888,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val alarmManager =
        context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    // alarmManager.setExactAndAllowWhileIdle(
    //     AlarmManager.RTC_WAKEUP,
    //     calendar.timeInMillis,
    //     pendingIntent
    // )
    alarmManager.setAndAllowWhileIdle(
    AlarmManager.RTC_WAKEUP,
    calendar.timeInMillis,
    pendingIntent
)

    Log.d(TAG, "⏰ Midnight missing-day alarm scheduled")
}






    private fun formatDate(timestamp: Long): String {
    val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.getDefault())
    sdf.timeZone = TimeZone.getTimeZone("UTC")
    return sdf.format(Date(timestamp))
}

    private fun processLocationInBackground(location: Location) {
        flushOfflineQueue()

        val currentTime = System.currentTimeMillis()
        val timeDiff = currentTime - lastGeocodeTime


    

        if (geofencingMode == "local_native") {
            processWithLocalGeoJSON(location.latitude, location.longitude)
        } else if (geofencingMode == "local_js") {
            // JS handles detection via onLocationChanged event; native does nothing here
            Log.d(TAG, "local_js mode — skipping native geocoding")
        } else {
            if (timeDiff < GEOCODE_INTERVAL) {
                Log.d(TAG, "⏳ Skipping geocode call. Next allowed in ${(GEOCODE_INTERVAL - timeDiff)/60000} min")
                return
            }
            lastGeocodeTime = currentTime
            reverseGeocodeInBackground(location.latitude, location.longitude)
            }
        }

    private fun reverseGeocodeInBackground(
        lat: Double,
        lng: Double,
        match: StateMatch? = null,
        newState: String? = null,
        stateTripOriginCity: String? = null,
        stateTripStartTime: Long? = null,
        stateTripEndTime: Long? = null
    ) {
        val url = "$GOOGLE_GEOCODING_URL?latlng=$lat,$lng&language=en&key=$googleApiKey"

        val request = Request.Builder()
            .url(url)
            .build()

        // Any failure below (timeout, bad response, empty/blank result, parse error)
        // used to silently drop the trip — a flaky connection while "online" would
        // lose the transition entirely with no retry. Fall back to the same local
        // GeoJSON detection the offline path uses. (match/newState are only supplied
        // by the local_native state-change path; the legacy periodic 'google' mode
        // call below has neither, so it just skips the fallback like before.)
        val fallbackToLocalTrip = {
            if (match != null && newState != null) {
                createLocalFallbackTrip(match, newState, lat, lng, stateTripOriginCity, stateTripStartTime, stateTripEndTime)
            }
        }

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                Log.e(TAG, "Reverse geocoding failed: ${e.message}")
                sendEvent("onLocationError", Arguments.createMap().apply {
                    putString("error", "Reverse geocoding failed: ${e.message}")
                })
                fallbackToLocalTrip()
            }

            override fun onResponse(call: okhttp3.Call, response: Response) {
                try {
                    val responseBody = response.body?.string()
                    if (response.isSuccessful && responseBody != null) {
                        val json = JSONObject(responseBody)
                        val status = json.getString("status")
                        
                        if (status == "OK") {
                            val results = json.getJSONArray("results")
                            
                            if (results.length() > 0) {
                                val firstResult = results.getJSONObject(0)
                                val addressComponents = firstResult.getJSONArray("address_components")
                                
                                var city = ""
                                var state = ""
                                var stateCode = ""
                                var countryCode = ""
                                var fullAddress = firstResult.getString("formatted_address")
                                
                                for (i in 0 until addressComponents.length()) {
                                    val component = addressComponents.getJSONObject(i)
                                    val types = component.getJSONArray("types")
                                    
                                    for (j in 0 until types.length()) {
                                        when (types.getString(j)) {
                                            "locality", "administrative_area_level_2" -> {
                                                if (city.isEmpty()) {
                                                    city = component.getString("long_name")
                                                }
                                            }
                                            "administrative_area_level_1" -> {
                                                state = component.getString("long_name")
                                                stateCode = component.getString("short_name")
                                                currentStateName = state
                                            }
                                            "country" -> {
                                                countryCode = component.getString("short_name") // IN, US, JP
                                            }
                                        }
                                    }
                                }
                                
                                Log.d(TAG, "Reverse geocode result: City=$city, State=$state")
                                
                                // Send address info back to JS
                                val addressData = Arguments.createMap().apply {
                                    putDouble("latitude", lat)
                                    putDouble("longitude", lng)
                                    putString("city", city)
                                    putString("state", state)
                                    putString("stateCode", stateCode)
                                    putString("countryCode", countryCode)
                                    putString("fullAddress", fullAddress)
                                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                                }
                                // 🚫 DUPLICATE BLOCK
                                if (state.equals(previousStateName, ignoreCase = true)) {
                                    Log.d(TAG, "🚫 Reverse geocode duplicate blocked")
                                    return
                                }

                                                // If first-time or app started fresh
                if (previousEnterTime == 0L) {
                    previousLat = lat
                    previousLng = lng
                    previousCity = city
                    previousStateName = state
                    previousStateCode = stateCode
                    previousCountryCode = countryCode
                    previousEnterTime = System.currentTimeMillis()

                    Log.d(TAG, "Initialized previous state tracking")
                }
                                
                                sendEvent("onAddressResolved", addressData)
                                if (state.isBlank() || city.isBlank()) {
                                    Log.d(TAG, "🚫 Invalid geocode data — falling back to local detection")
                                    fallbackToLocalTrip()
                                    return
                                }
                                
                                // Send to Domigo API with conditions
                                sendToDomigoAPI(
                                    lat,
                                    lng,
                                    city,
                                    state,
                                    stateCode,
                                    countryCode,
                                    fullAddress,
                                    stateTripOriginCity,
                                    stateTripStartTime,
                                    stateTripEndTime
                                )
                                // if (geofencingMode == "local_native") {

                                //     // if (state.equals(previousStateName, ignoreCase = true)) {
                                //     //     isTransitionInProgress = false
                                //     //     return
                                //     // }
                                
                                //     val originStateSafe = previousStateName
                                //     val originLatSafe = previousLat
                                //     val originLngSafe = previousLng
                                //     val originCitySafe = previousCity
                                //     val originEnterTimeSafe = previousEnterTime
                                
                                //     sendEntryFormData(
                                //         kind = "trip",
                                //         date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
                                //         typeOfDayId = null,
                                //         isCommissionDay = false,
                                //         isRemoteWork = false,
                                //         remoteHours = 0,
                                //         isTravelling = true,
                                //         tripTypeId = 1,
                                //         tripModeId = 1,
                                //         confirmationNo = "",
                                //         vendor = "",
                                //         hasProof = false,
                                //         proofType = "other",
                                //         notes = "",
                                //         creationType = "automatic",
                                //         remoteLocation = "",
                                //         state = null,
                                //         isUpdated=false,
                                
                                //         originCity = originCitySafe,
                                //         originState = originStateSafe,
                                //         originLat = originLatSafe,
                                //         originLng = originLngSafe,
                                
                                //         destinationCity = city,
                                //         destinationState = state,
                                //         destinationLat = lat,
                                //         destinationLng = lng,
                                
                                //         startDate = originEnterTimeSafe,
                                //         endDate = System.currentTimeMillis()
                                //     )
                                
                                //     // 🔥 UPDATE STATE HERE (Online case)
                                //     previousStateName = state
                                //     previousStateCode = stateCode
                                //     previousCountryCode = countryCode
                                //     previousLat = lat
                                //     previousLng = lng
                                //     previousCity = city
                                //     previousEnterTime = System.currentTimeMillis()
                                //     saveStateToPrefs()
                                
                                //     isTransitionInProgress = false
                                //     return
                                // }
                            } else {
                                Log.d(TAG, "🚫 Geocoding returned no results — falling back to local detection")
                                fallbackToLocalTrip()
                            }
                        } else {
                            Log.e(TAG, "Google Geocoding API error: $status")
                            sendEvent("onLocationError", Arguments.createMap().apply {
                                putString("error", "Geocoding API error: $status")
                            })
                            fallbackToLocalTrip()
                        }
                    } else {
                        Log.e(TAG, "Reverse geocode response unsuccessful or empty body")
                        fallbackToLocalTrip()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing reverse geocode response: ${e.message}")
                    sendEvent("onLocationError", Arguments.createMap().apply {
                        putString("error", "Geocoding parse error: ${e.message}")
                    })
                    fallbackToLocalTrip()
                }
            }
        })
    }

    // Builds and commits a "trip" locally via GeoJSON when the online reverse-geocode
    // path couldn't complete (timeout, error, empty/blank result). Mirrors the offline
    // branch of processWithLocalGeoJSON so a flaky connection never silently drops a trip.
    private fun createLocalFallbackTrip(
        match: StateMatch,
        newState: String,
        lat: Double,
        lng: Double,
        stateTripOriginCity: String?,
        stateTripStartTime: Long?,
        stateTripEndTime: Long?
    ) {
        if (newState.equals(previousStateName, ignoreCase = true)) {
            Log.d(TAG, "🚫 Fallback trip skipped — state already committed")
            return
        }

        val now = stateTripEndTime ?: System.currentTimeMillis()
        val tripKey = "${previousStateName}_${newState}_${previousEnterTime}"
        if (tripKey == lastTripKey) {
            Log.d(TAG, "🚫 Duplicate fallback trip blocked")
            return
        }

        val originStateSafe = previousStateName
        val originLatSafe = previousLat
        val originLngSafe = previousLng
        val originCitySafe = stateTripOriginCity?.takeIf { it.isNotBlank() }
            ?: previousCityName.ifBlank { previousCity }
        val tripStartTime = stateTripStartTime?.takeIf { it > 0L }
            ?: if (previousCityEnterTime > 0L) previousCityEnterTime else previousEnterTime

        val destinationCityFallback = detectCityFromGeoJSON(newState, lat, lng)

        previousStateName = newState
        previousStateCode = match.fips ?: newState
        previousCountryCode = match.countryCode
        previousLat = lat
        previousLng = lng
        previousEnterTime = now
        saveStateToPrefs()
        if (match.countryCode == "US") {
            match.fips?.let { fips ->
                val county = detectCountyFromGeoJSON(fips, lat, lng)
                if (county != null) {
                    previousCountyFips = county.fips
                    previousCountyName = county.name
                    previousCountyEnterTime = now
                }
            }
            if (destinationCityFallback != null) {
                previousCityFips = destinationCityFallback.fips
                previousCityName = destinationCityFallback.name
                previousCityEnterTime = now
            } else {
                previousCityFips = ""
                previousCityName = ""
                previousCityEnterTime = 0L
            }
        } else {
            previousCountyFips = ""
            previousCountyName = ""
            previousCountyEnterTime = 0L
            previousCityFips = ""
            previousCityName = ""
            previousCityEnterTime = 0L
        }
        lastTripKey = tripKey

        Log.d(TAG, "🌐➡️📴 Online geocode unavailable — created trip via local fallback: $originStateSafe -> $newState")

        sendEntryFormData(
            kind = "trip",
            date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
            typeOfDayId = null,
            isCommissionDay = false,
            isRemoteWork = false,
            remoteHours = 0,
            isTravelling = true,
            tripTypeId = 1,
            tripModeId = 1,
            confirmationNo = "",
            vendor = "",
            hasProof = false,
            proofType = "other",
            notes = "",
            creationType = "automatic",
            remoteLocation = "",
            state = null,
            isUpdated = false,
            originCity = originCitySafe,
            originState = originStateSafe,
            originLat = originLatSafe,
            originLng = originLngSafe,
            destinationCity = destinationCityFallback?.name ?: newState,
            destinationState = newState,
            destinationLat = lat,
            destinationLng = lng,
            startDate = tripStartTime,
            endDate = now
        )
    }



    private fun sendToDomigoAPI(
        lat: Double,
        lng: Double,
        city: String,
        state: String,
        stateCode: String,
        countryCode: String,
        address: String,
        stateTripOriginCity: String? = null,
        stateTripStartTime: Long? = null,
        stateTripEndTime: Long? = null
    ) {
       

        val currentTime = System.currentTimeMillis()
        val timeDifference = currentTime - lastApiTime
        val stateChanged = state != lastState
        val sameState = stateCode == previousStateCode
        val sameCountry = countryCode == previousCountryCode
        val timePassed = timeDifference >= FOUR_HOURS_MS
        val tripStartTime =
            stateTripStartTime?.takeIf { it > 0L }
                ?: if (previousCityEnterTime > 0L)
                    previousCityEnterTime
                else
                    previousEnterTime
        val tripEndTime =
            stateTripEndTime?.takeIf { it > 0L } ?: currentTime
        val originCityForStateTrip =
            stateTripOriginCity?.takeIf { it.isNotBlank() }
                ?: previousCityName.ifBlank { previousCity }

        // if (previousStateCode.isEmpty()) {
        //     previousStateCode = stateCode
        //     previousCountryCode = countryCode
        //     previousStateName = state
        //     previousLat = lat
        //     previousLng = lng
        //     previousCity = city
        //     previousEnterTime = System.currentTimeMillis()
        //     saveStateToPrefs()
        //     Log.d(TAG, "📍 Initial state captured: $stateCode")
        //     return
        // }
    // if (geofencingMode == "local_native") {
    //     return
    // }

        // Only send to API if state changed or 4 hours passed
   
        //     if (!stateChanged && !timePassed) {
        //         Log.d(TAG, "⏳ No API update required")
        //         return
        //     }

        // if (state == previousStateName) {
        //     Log.d(TAG, "🏠 Same state ($state), no trip required")
        //      return
        //   }
        //   if (sameState && sameCountry) {
        //     Log.d(TAG, "🏠 Same state ($state), no trip required")
        //      return
        //   }

    Log.d(TAG, "🚦 STATE CHANGED: $previousStateName → $state")



    Log.d(TAG, "STATE CHANGED! Triggering trip API")
    // if (stateCode == previousStateCode && countryCode == previousCountryCode) {
    if (stateCode == previousStateCode && countryCode == previousCountryCode) {
        Log.d(TAG, "🏠 Same state ($stateCode), skipping trip")
    } else 
    // {
    //     Log.d(TAG, "🚗 STATE CHANGED: $previousStateCode → $stateCode")
    
    //     sendEntryFormData(
    //         kind = "trip",
    //         date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
    
    //         typeOfDayId = null,
    //         isCommissionDay = false,
    //         isRemoteWork = false,
    //         remoteHours = 0,
    //         isTravelling = true,
    //         tripTypeId = 1,
    //         tripModeId = 1,
    //         confirmationNo = "",
    //         vendor = "",
    //         hasProof = false,
    //         proofType = "",
    //         notes = "",
    //         creationType = "automatic",
    //         remoteLocation = "",
    //         state = null,
    
    //         // originCity = previousCity,
    //         originCity =  toEnglishSafe(previousCity),
    //         // originState = previousStateName,
    //         originState =  toEnglishSafe(previousStateName),
    //         originLat = previousLat,
    //         originLng = previousLng,
    
    //         // destinationCity = city,
    //         destinationCity =  toEnglishSafe(city),
    //         // destinationState = state,
    //         destinationState =  toEnglishSafe(state),
    //         destinationLat = lat,
    //         destinationLng = lng
    //         startDate = previousEnterTime,
    //         endDate = System.currentTimeMillis()
    //     )
    
    //     // UPDATE STATE AFTER TRIP
    //     previousStateCode = stateCode
    //     previousCountryCode = countryCode
    //     previousStateName = state
    //     previousLat = lat
    //     previousLng = lng
    //     previousCity = city
    //     previousEnterTime = System.currentTimeMillis()
    // }

    if (previousStateCode.isNotEmpty()) {

        // SAME STATE → DO NOTHING
        if (stateCode == previousStateCode) {
            Log.d(TAG, "🏠 Same state ($stateCode) — Trip NOT created")
            return
        }
        if (state.isBlank() || stateCode.isBlank()) {
            Log.d(TAG, "🚫 Skipped: Empty state")
            return
        }
        if (stateCode.equals(previousStateCode, ignoreCase = true)) {
            Log.d(TAG, "🏠 Same state — skipped")
            return
        }
    
        // DIFFERENT STATE → CREATE TRIP
        Log.d(TAG, "🚗 STATE CHANGED: $previousStateCode → $stateCode")
    
        sendEntryFormData(
            kind = "trip",
            date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
    
            typeOfDayId = null,
            isCommissionDay = false,
            isRemoteWork = false,
            remoteHours = 0,
            isTravelling = true,
            tripTypeId = 1,
            tripModeId = 1,
            confirmationNo = "",
            vendor = "",
            hasProof = false,
            proofType = "",
            notes = "",
            creationType = "automatic",
            remoteLocation = "",
            state = null,
            isUpdated = false,
            // originCity = toEnglishSafe(previousCity),
            originCity = toEnglishSafe(originCityForStateTrip),
            originState = toEnglishSafe(previousStateName),
            originLat = previousLat,
            originLng = previousLng,
    
            destinationCity = toEnglishSafe(city),
            destinationState = toEnglishSafe(state),
            destinationLat = lat,
            destinationLng = lng,
    
            startDate = tripStartTime,
            endDate = tripEndTime
        )
    
        previousStateCode = stateCode
        previousCountryCode = countryCode
        previousStateName = state
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousEnterTime = tripEndTime
        saveStateToPrefs()
    
    } else {
        previousStateCode = stateCode
        previousCountryCode = countryCode
        previousStateName = state
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousEnterTime = System.currentTimeMillis()
        saveStateToPrefs()
    
        Log.d(TAG, "📍 Initial state captured: $stateCode")
    }

    // sendTripFormData(
    //     originLat = previousLat ?: lat,
    //     originLng = previousLng ?: lng,
    //     originCity = previousCity,
    //     originState = previousStateName,
    //     originStartDate = previousEnterTime,

    //     destinationLat = lat,
    //     destinationLng = lng,
    //     destinationCity = city,
    //     destinationState = state,
    //     destinationEnterDate = System.currentTimeMillis()
    // )
//     sendEntryFormData(
//     kind = "trip",
//     // date = formatDate(System.currentTimeMillis()),
//     date = SimpleDateFormat(
//         "yyyy-MM-dd",
//         Locale.getDefault()
//     ).format(Date()),
//     typeOfDayId = null,
//     isCommissionDay = false,
//     isRemoteWork = false,
//     remoteHours = 0,
//     isTravelling = true,
//     tripTypeId = 1,
//     tripModeId = 1,
//     confirmationNo = "",
//     vendor = "",
//     hasProof = false,
//     proofType = "",
//     notes = "",
//     creationType = "automatic",
//     remoteLocation = "",
//     state = null,

//     originCity = previousCity,
//     originState = previousStateName,
//     originLat = previousLat,
//     originLng = previousLng,

//     destinationCity = city,
//     destinationState = state,
//     destinationLat = lat,
//     destinationLng = lng
// )


//     // Reset previous state to new state
//     previousLat = lat
//     previousLng = lng
//     previousCity = city
//     previousStateName = state
//     previousEnterTime = System.currentTimeMillis()

if (!stateChanged && !timePassed) {
    Log.d(TAG, "⏳ Location API skipped")
    return
}
        val jsonBody = JSONObject().apply {
            put("latitude", lat)
            put("longitude", lng)
            put("state", state)
            put("city", city)
            put("address", address)
        }

        Log.d(TAG, "📡 Sending location to API → $city, $state")


        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = jsonBody.toString().toRequestBody(mediaType)

        val request = Request.Builder()
            .url(apiUrl)
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $domigoToken")
            .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                Log.e(TAG, "Domigo API call failed: ${e.message}")
                sendEvent("onLocationError", Arguments.createMap().apply {
                    putString("error", "API call failed: ${e.message}")
                })
            }

            override fun onResponse(call: okhttp3.Call, response: Response) {
                try {
                    if (response.isSuccessful) {
                        Log.d(TAG, "✅ Location sent to Domigo API successfully")
                        
                        // Update tracking values
                        lastState = state
                        lastApiTime = currentTime
                        
                        sendEvent("onApiSuccess", Arguments.createMap().apply {
                            putString("message", "Location sent to API successfully")
                            putString("state", state)
                            putString("city", city)
                        })
                    } else {
                        Log.e(TAG, "❌ Domigo API call failed with status: ${response.code}")
                        val errorBody = response.body?.string() ?: "Unknown error"
                        sendEvent("onLocationError", Arguments.createMap().apply {
                            putString("error", "API error ${response.code}: $errorBody")
                        })
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error handling API response: ${e.message}")
                }
            }
        })
    }


    private fun sendLocationPing(
        lat: Double,
        lng: Double,
        state: String,
        stateCode: String,
        countryCode: String
    ) 
    {
        val currentTime = System.currentTimeMillis()
        val timeDiff = currentTime - lastLocationPingTime

        val isTimeBased = timeDiff >= LOCATION_PING_INTERVAL
        val isStateChanged = stateCode != lastSentState

        // 🚫 skip if neither condition met
        if (!isTimeBased && !isStateChanged) {
        Log.d(TAG, "⏳ Location ping skipped (no 15min / no state change)")
        return
        }

        val jsonBody = JSONObject().apply {
        put("latitude", lat)
        put("longitude", lng)
        put("state", state)
        put("city", state) // optional
        put("address", state)
        }

        Log.d(TAG, "📡 Sending LOCATION PING → $state ($lat,$lng)")

        val mediaType = "application/json; charset=utf-8".toMediaType()
        val requestBody = jsonBody.toString().toRequestBody(mediaType)

        val request = Request.Builder()
        .url(apiUrl)
        .post(requestBody)
        .addHeader("Content-Type", "application/json")
        .addHeader("Authorization", "Bearer $domigoToken")
        .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
        override fun onFailure(call: Call, e: IOException) {
            Log.e(TAG, "❌ Location ping failed: ${e.message}")
        }

        override fun onResponse(call: Call, response: Response) {
            if (response.isSuccessful) {
                Log.d(TAG, "✅ Location ping success")

                lastLocationPingTime = currentTime
                lastSentState = stateCode
                sendEvent("onApiSuccess", Arguments.createMap().apply {
                    putString("message", "Location sent to API successfully")
                    putString("state", state)
                    putString("city", state)
                })
            } else {
                Log.e(TAG, "❌ Location ping error: ${response.code}")
                val errorBody = response.body?.string() ?: "Unknown error"
                sendEvent("onLocationError", Arguments.createMap().apply {
                    putString("error", "API error ${response.code}: $errorBody")
                })
            }
        }
        })
    }

    private fun checkAndSendHoursAPI(
        lat: Double,
        lng: Double
    ) 
    {

        val now = System.currentTimeMillis()

        // 🔥 configurable interval
        val interval = HOURS_API_INTERVAL

        if ((now - lastHoursApiTime) < interval) {

            Log.d(TAG, "⏳ Hours API skipped")
            return
        }

        // 🔥 interval complete
        // lastHoursApiTime = now

        // prefs.edit()
        //     .putLong(PREF_LAST_HOURS_API_TIME, now)
        //     .apply()

        reverseGeocodeForHoursAPI(lat, lng)
    }
    private fun reverseGeocodeForHoursAPI(
        lat: Double,
        lng: Double
    ) 
    {

        val url =
            "$GOOGLE_GEOCODING_URL?latlng=$lat,$lng&language=en&key=$googleApiKey"

        val request = Request.Builder()
            .url(url)
            .build()

        httpClient.newCall(request)
          .enqueue(object : okhttp3.Callback {

                override fun onFailure(
                    call: Call,
                    e: IOException
                ) {

                    Log.e(TAG, "❌ Hours geocode failed")
                }

                override fun onResponse(
                    call: Call,
                    response: Response
                ) {

                    try {

                        val body =
                            response.body?.string() ?: return

                        val json = JSONObject(body)

                        if (json.getString("status") != "OK") {
                            return
                        }

                        val result =
                            json.getJSONArray("results")
                                .getJSONObject(0)

                        val components =
                            result.getJSONArray("address_components")

                        var city = ""
                        var county = ""
                        var state = ""

                        for (i in 0 until components.length()) {

                            val component =
                                components.getJSONObject(i)

                            val types =
                                component.getJSONArray("types")

                            for (j in 0 until types.length()) {

                                when (types.getString(j)) {

                                    "locality" -> {
                                        city =
                                            component.getString("long_name")
                                    }

                                    "administrative_area_level_2" -> {
                                        county = component.getString("long_name")
                                    }

                                    "administrative_area_level_1" -> {
                                        state =
                                            component.getString("long_name")
                                    }
                                }
                            }
                        }

                        val address =
                            result.optString(
                                "formatted_address",
                                ""
                            )

                        sendHoursLocationAPI(
                            lat,
                            lng,
                            city,
                            county,
                            state,
                            address
                        )

                    } catch (e: Exception) {

                        Log.e(TAG, "❌ Hours parse error")
                    }
                }
            })
    }

    private fun sendHoursLocationAPI(
    lat: Double,
    lng: Double,
    city: String,
    county: String,
    state: String,
    address: String
    ) 
    {

        val jsonBody = JSONObject().apply {

            put("latitude", lat)
            put("longitude", lng)
            put("state", state)
            put("city", city)
            put("county", county)
            put("address", address)
        }

        val mediaType =
            "application/json; charset=utf-8".toMediaType()

        val requestBody =
            jsonBody.toString().toRequestBody(mediaType)

        val request = Request.Builder()
            .url("https://stage.mydomigo.com/api/locations/hours")
            .post(requestBody)
            .addHeader("Content-Type", "application/json")
            .addHeader("Authorization", "Bearer $domigoToken")
            .build()

        httpClient.newCall(request)
            .enqueue(object : okhttp3.Callback {

                override fun onFailure(
                    call: Call,
                    e: IOException
                ) {

                    Log.e(TAG, "❌ Hours API failed")
                }

                override fun onResponse(
                    call: Call,
                    response: Response
                ) {

                    if (response.isSuccessful) {

                        Log.d(TAG, "✅ Hours API success")
                        lastHoursApiTime = System.currentTimeMillis()

                            prefs.edit()
                                .putLong(
                                    PREF_LAST_HOURS_API_TIME,
                                    lastHoursApiTime
                                )
                                .apply()

                        val eventData = Arguments.createMap().apply {

                            putBoolean("success", true)

                            putDouble("latitude", lat)
                            putDouble("longitude", lng)

                            putString("city", city)
                            putString("state", state)
                            putString("address", address)

                            putDouble(
                                "timestamp",
                                System.currentTimeMillis().toDouble()
                            )
                        }

                        sendEvent(
                            "onHoursApiSuccess",
                            eventData
                        )

                    } else {

                        Log.e(
                            TAG,
                            "❌ Hours API error: ${response.code}"
                        )
                        val errorData = Arguments.createMap().apply {

                        putBoolean("success", false)

                        putInt("statusCode", response.code)

                        putString("city", city)
                        putString("state", state)

                        putDouble(
                            "timestamp",
                            System.currentTimeMillis().toDouble()
                        )
                    }

                    sendEvent(
                        "onHoursApiError",
                        errorData
                    )
                    }
                }
            })
    }


    private fun startForegroundService() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceIntent = Intent(context, LocationForegroundService::class.java)
            context.startForegroundService(serviceIntent)
        } else {
            val serviceIntent = Intent(context, LocationForegroundService::class.java)
            context.startService(serviceIntent)
        }
    }

    private fun stopForegroundService() {
        val serviceIntent = Intent(context, LocationForegroundService::class.java)
        context.stopService(serviceIntent)
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            Log.e(TAG, "Error sending event to JS: ${e.message}")
        }
    }






// private fun sendTripFormData(
//     originLat: Double,
//     originLng: Double,
//     originCity: String,
//     originState: String,
//     originStartDate: Long,

//     destinationLat: Double,
//     destinationLng: Double,
//     destinationCity: String,
//     destinationState: String,
//     destinationEnterDate: Long
// ) {
//     val bodyDebug = Arguments.createMap()

// bodyDebug.putString("originLat", originLat.toString())
// bodyDebug.putString("originLng", originLng.toString())
// bodyDebug.putString("originCity", originCity)
// bodyDebug.putString("originState", originState)
// bodyDebug.putString("startDate", formatDate(originStartDate))

// bodyDebug.putString("destinationLat", destinationLat.toString())
// bodyDebug.putString("destinationLng", destinationLng.toString())
// bodyDebug.putString("destinationCity", destinationCity)
// bodyDebug.putString("destinationState", destinationState)
// bodyDebug.putString("endDate", formatDate(destinationEnterDate))
// bodyDebug.putString("attachments", "[]")
// bodyDebug.putString("modeId", "11")
// bodyDebug.putString("typeId", "10")

//     val formBody = MultipartBody.Builder()
//         .setType(MultipartBody.FORM)

//         // ORIGIN
//         .addFormDataPart("originLat", originLat.toString())
//         .addFormDataPart("originLng", originLng.toString())
//         .addFormDataPart("originCity", originCity)
//         .addFormDataPart("originState", originState)
//         .addFormDataPart("startDate", formatDate(originStartDate))

//         // DESTINATION
//         .addFormDataPart("destinationLat", destinationLat.toString())
//         .addFormDataPart("destinationLng", destinationLng.toString())
//         .addFormDataPart("destinationCity", destinationCity)
//         .addFormDataPart("destinationState", destinationState)
//         .addFormDataPart("endDate", formatDate(destinationEnterDate))
//         .addFormDataPart("attachments", "[]")
//         .addFormDataPart("modeId", 1.toString())
//         .addFormDataPart("typeId", 1.toString())

//         .build()

//     val request = Request.Builder()
//         .url("https://stage.mydomigo.com/api/trips")  // replace with your addTrip URL
//         .post(formBody)
//         .addHeader("Authorization", "Bearer $domigoToken")
//         .build()

//     httpClient.newCall(request).enqueue(object : okhttp3.Callback {
//         override fun onFailure(call: Call, e: IOException) {
//     val errorData = Arguments.createMap().apply {
//         putString("error", e.message)
//         putDouble("timestamp", System.currentTimeMillis().toDouble())
//     }
//     sendEvent("onTripApiError", errorData)
// }

//         override fun onResponse(call: Call, response: Response) {
//     val responseBody = response.body?.string() ?: ""

//     Log.d(TAG, "🚗 Trip API Response: ${response.code}")
    
//     if (response.isSuccessful) {
//         try {
//             val json = JSONObject(responseBody)
//             val tripId = json
//                 .optJSONObject("result")
//                 ?.optInt("id")
//                 ?.toString()

//             if (tripId != null) {
//                 showTripCreatedNotification(
//                     title = "🚗 Trip Created",
//                     message = "Tap to view trip details",
//                     tripId = tripId
//                 )
//             }
//         } catch (e: Exception) {
//             Log.e(TAG, "Trip parse error: ${e.message}")
//         }
//     }

//     val eventData = Arguments.createMap().apply {
//         putInt("statusCode", response.code)
//         putBoolean("success", response.isSuccessful)
//         putString("response", responseBody)
//         putDouble("timestamp", System.currentTimeMillis().toDouble())
//         putMap("body", bodyDebug)
//     }

//     sendEvent("onTripApiResponse", eventData)
// }
//     })
// }

private fun sendEntryFormData(
    kind: String, // "trip" | "missing"

    // COMMON
    date: String?,
    typeOfDayId: Int?,
    isCommissionDay: Boolean,
    isRemoteWork: Boolean,
    remoteHours: Int?,
    isTravelling: Boolean,
    tripTypeId: Int?,
    tripModeId: Int?,
    confirmationNo: String?,
    vendor: String?,
    hasProof: Boolean,
    proofType: String?,
    notes: String?,
    creationType: String?,
    remoteLocation: String?,
    state: String?,
    isUpdated: Boolean?,

    // TRIP ONLY
    originCity: String? = null,
    originState: String?,
    originLat: Double?,
    originLng: Double?,
    destinationCity: String? = null,
    destinationState: String?,
    destinationLat: Double?,
    destinationLng: Double?,
    startDate: Long? = null,
    endDate: Long? = null,
    // county change only
    originCounty: String? = null,
    destinationCounty: String? = null,
) {

    fun s(v: String?) = v ?: ""
    fun i(v: Int?) = v?.toString() ?: ""
    fun d(v: Double?) = v?.toString() ?: ""
    fun b(v: Boolean) = if (v) "true" else "false"

    val body = MultipartBody.Builder()
        .setType(MultipartBody.FORM)

        // ===== SAME AS JS =====
        .addFormDataPart("kind", kind)
        .addFormDataPart("date", s(date))
        // .addFormDataPart("typeOfDayId", i(typeOfDayId))
        .addFormDataPart("typeOfDayId", 1.toString())
        .addFormDataPart("isCommissionDay", b(isCommissionDay))
        .addFormDataPart("isRemoteWork", b(isRemoteWork))
        .addFormDataPart("remoteHours", i(remoteHours))
        .addFormDataPart("isTravelling", b(isTravelling))
        .addFormDataPart("tripTypeId", i(tripTypeId))
        .addFormDataPart("tripModeId", i(tripModeId))
        .addFormDataPart("confirmationNo", s(confirmationNo))
        .addFormDataPart("vendor", s(vendor))
        .addFormDataPart("hasProof", b(hasProof))
        .addFormDataPart("proofType", "other")
        .addFormDataPart("notes", s(notes))
        .addFormDataPart("creationType", s(creationType))
        .addFormDataPart("remoteLocation", s(remoteLocation))
        .addFormDataPart("attachments", "[]")


        // if (typeOfDayId != null) {
        //     body.addFormDataPart("typeOfDayId", typeOfDayId.toString())
        // }

    // ===== MISSING DAY =====
    if (kind == "missing") {
        body.addFormDataPart("state", s(state))
        body.addFormDataPart("originCity", s(originCity))
        body.addFormDataPart("destinationCity", s(destinationCity))

        body.addFormDataPart("originCounty", s(originCounty))
        body.addFormDataPart("destinationCounty", s(destinationCounty))
    }

    // ===== TRIP =====
    if (kind == "trip") {
        body
            .addFormDataPart("originCity", s(originCity))
            .addFormDataPart("originState", s(originState))
            .addFormDataPart("originLat", d(originLat))
            .addFormDataPart("originLng", d(originLng))

            .addFormDataPart("destinationCity", s(destinationCity))
            .addFormDataPart("destinationState", s(destinationState))
            .addFormDataPart("destinationLat", d(destinationLat))
            .addFormDataPart("destinationLng", d(destinationLng))
            startDate?.let {
                body.addFormDataPart("startDate", formatDate(it))
            }
        
            endDate?.let {
                body.addFormDataPart("endDate", formatDate(it))
            }
        
    }
    if (kind == "county_change") {
        body
            .addFormDataPart("originCounty", s(originCounty))
            .addFormDataPart("originState", s(originState))
            .addFormDataPart("originLat", d(originLat))
            .addFormDataPart("originLng", d(originLng))

            .addFormDataPart("destinationCounty", s(destinationCounty))
            .addFormDataPart("destinationState", s(destinationState))
            .addFormDataPart("destinationLat", d(destinationLat))
            .addFormDataPart("destinationLng", d(destinationLng))
            startDate?.let {
                body.addFormDataPart("startDate", formatDate(it))
            }
        
            endDate?.let {
                body.addFormDataPart("endDate", formatDate(it))
            }
        
    }

    if (kind == "city_change") {
        body
            .addFormDataPart("originCity", s(originCity))
            .addFormDataPart("originState", s(originState))
            .addFormDataPart("originLat", d(originLat))
            .addFormDataPart("originLng", d(originLng))
    
            .addFormDataPart("destinationCity", s(destinationCity))
            .addFormDataPart("destinationState", s(destinationState))
            .addFormDataPart("destinationLat", d(destinationLat))
            .addFormDataPart("destinationLng", d(destinationLng))
    
        startDate?.let {
            body.addFormDataPart("startDate", formatDate(it))
        }
    
        endDate?.let {
            body.addFormDataPart("endDate", formatDate(it))
        }
    }

    if (kind == "county_change") {
        val debugData = Arguments.createMap().apply {
            putString("kind", kind)
            putString("date", date)
            putString("originCounty", originCounty)
            putString("originState", originState)
            putString("destinationCounty", destinationCounty)
            putString("destinationState", destinationState)
            putDouble("originLat", originLat ?: 0.0)
            putDouble("originLng", originLng ?: 0.0)
            putDouble("destinationLat", destinationLat ?: 0.0)
            putDouble("destinationLng", destinationLng ?: 0.0)
            putString("startDate", startDate?.let { formatDate(it) })
            putString("endDate", endDate?.let { formatDate(it) })
        }
        sendEvent("onCityChangeDebug", debugData)
    }

    if (kind == "city_change") {

        val debugData = Arguments.createMap().apply {
    
            putString("kind", kind)
            putString("date", date)
    
            putString("originCity", originCity)
            putString("originState", originState)
    
            putString("destinationCity", destinationCity)
            putString("destinationState", destinationState)
    
            putDouble("originLat", originLat ?: 0.0)
            putDouble("originLng", originLng ?: 0.0)
    
            putDouble("destinationLat", destinationLat ?: 0.0)
            putDouble("destinationLng", destinationLng ?: 0.0)
    
            putString(
                "startDate",
                startDate?.let { formatDate(it) }
            )
    
            putString(
                "endDate",
                endDate?.let { formatDate(it) }
            )
        }
    
        sendEvent("onRealCityChangeDebug", debugData)
    }
    

    val request = Request.Builder()
        // .url("https://stage.mydomigo.com/api/trips")
        .url("https://stage.mydomigo.com/api/trip-days")
        .post(body.build())
        .addHeader("Authorization", "Bearer $domigoToken")
        .build()

    // httpClient.newCall(request).enqueue(object : okhttp3.Callback {

    //     override fun onFailure(call: Call, e: IOException) {
    //         Log.e(TAG, "❌ API failed: ${e.message}")
    //     }

    //     override fun onResponse(call: Call, response: Response) {
    //         Log.d(TAG, "✅ API success: ${response.code}")
    //     }
    // })
    val queuePayload = JSONObject().apply {
        put("kind", kind)
        put("date", date ?: "")
        put("originCity", originCity ?: "")
        put("originState", originState ?: "")
        put("originLat", originLat ?: 0.0)
        put("originLng", originLng ?: 0.0)
        put("destinationCity", destinationCity ?: "")
        put("destinationState", destinationState ?: "")
        put("destinationLat", destinationLat ?: 0.0)
        put("destinationLng", destinationLng ?: 0.0)
        put("startDate", startDate?.let { formatDate(it) } ?: "")
        put("endDate", endDate?.let { formatDate(it) } ?: "")
        put("creationType", creationType ?: "automatic")
        put("state", state ?: "")
    }

    httpClient.newCall(request).enqueue(object : okhttp3.Callback {

        override fun onFailure(call: Call, e: IOException) {
            Log.e(TAG, "❌ Entry API failed: ${e.message}")
            enqueueToOfflineQueue(queuePayload)

            val errorData = Arguments.createMap().apply {
                putBoolean("success", false)
                putString("error", e.message)
                putString("kind", kind)
                putString("date", date)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
    
            sendEvent("onTripApiError", errorData)
        }
    
        override fun onResponse(call: Call, response: Response) {
            val responseBody = response.body?.string() ?: ""
    
            if (!response.isSuccessful) {
                Log.e(TAG, "❌ Entry API error: ${response.code}")
                enqueueToOfflineQueue(queuePayload)
            } else {
                Log.d(TAG, "✅ Entry API success: ${response.code}")
            }

            val eventData = Arguments.createMap().apply {
                putBoolean("success", response.isSuccessful)
                putInt("statusCode", response.code)
                putString("response", responseBody)
                putString("kind", kind)
                putString("date", date)
                putDouble("timestamp", System.currentTimeMillis().toDouble())
            }
    
            sendEvent("onTripApiResponse", eventData)
        }
    })
}



fun createMissingDay() {

    if (previousStateCode.isNullOrEmpty()) {
        Log.d(TAG, "❌ Missing day skipped: state not available")
        return
    }

    val today = SimpleDateFormat(
        "yyyy-MM-dd",
        Locale.getDefault()
    ).format(Date())

    Log.d(TAG, "🌙 Creating missing day for $today")

    sendEntryFormData(
        kind = "missing",
        date = today,
        typeOfDayId = null,
        isCommissionDay = false,
        isRemoteWork = false,
        remoteHours = 0,
        isTravelling = false,
        tripTypeId = 1,
        tripModeId = 1,
        confirmationNo = "",
        vendor = "",
        hasProof = false,
        proofType = "other",
        notes = "",
        creationType = "automatic",
        remoteLocation = "",
        isUpdated=false,
        // state = previousStateName,
        state = currentStateName,

        // trip fields empty
        // originCity = previousCity,
        originCity = previousCityName.ifBlank { previousCity },
        originState = null,
        originLat = null,
        originLng = null,
        originCounty = previousCountyName,
        destinationCounty = previousCountyName,
        // destinationCity = previousCity,
        destinationCity = previousCityName.ifBlank { previousCity },
        destinationState = null,
        destinationLat = null,
        destinationLng = null
    )

    // 🔁 Next day ke liye alarm dobara lagao
    scheduleMidnightMissingDay()
}

// ==================== State Persistence (Gap 1) ====================

private fun saveStateToPrefs() {
    prefs.edit().apply {
        putString(PREF_PREV_STATE_CODE, previousStateCode)
        putString(PREF_PREV_STATE_NAME, previousStateName)
        putString(PREF_PREV_CITY, previousCity)
        putString(PREF_PREV_COUNTRY, previousCountryCode)
        putFloat(PREF_PREV_LAT, (previousLat ?: 0.0).toFloat())
        putFloat(PREF_PREV_LNG, (previousLng ?: 0.0).toFloat())
        putLong(PREF_PREV_ENTER_TIME, previousEnterTime)
        putString(PREF_CURRENT_STATE, currentStateName)
        putString(PREF_PREV_COUNTY_NAME, previousCountyName)
        putString(PREF_PREV_COUNTY_FIPS, previousCountyFips)
        putLong(PREF_PREV_COUNTY_ENTER, previousCountyEnterTime)

        putString(PREF_PREV_CITY_NAME, previousCityName)
        putString(PREF_PREV_CITY_FIPS, previousCityFips)
        putLong(PREF_PREV_CITY_ENTER, previousCityEnterTime)
        putString(PREF_LAST_TRACKED_DATE,
            SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()))
        apply()
    }
}

private fun loadStateFromPrefs() {
    previousStateCode = prefs.getString(PREF_PREV_STATE_CODE, "") ?: ""
    previousStateName = prefs.getString(PREF_PREV_STATE_NAME, "") ?: ""
    previousCity = prefs.getString(PREF_PREV_CITY, "") ?: ""
    previousCountryCode = prefs.getString(PREF_PREV_COUNTRY, "") ?: ""
    val lat = prefs.getFloat(PREF_PREV_LAT, 0f).toDouble()
    val lng = prefs.getFloat(PREF_PREV_LNG, 0f).toDouble()
    previousLat = if (lat != 0.0) lat else null
    previousLng = if (lng != 0.0) lng else null
    previousEnterTime = prefs.getLong(PREF_PREV_ENTER_TIME, 0L)
    currentStateName = prefs.getString(PREF_CURRENT_STATE, "") ?: ""
    lastHoursApiTime = prefs.getLong(PREF_LAST_HOURS_API_TIME, 0L)
    previousCountyName = prefs.getString(PREF_PREV_COUNTY_NAME, "") ?: ""
    previousCountyFips = prefs.getString(PREF_PREV_COUNTY_FIPS, "") ?: ""
    previousCountyEnterTime = prefs.getLong(PREF_PREV_COUNTY_ENTER, 0L)

    previousCityName = prefs.getString(PREF_PREV_CITY_NAME, "") ?: ""
    previousCityFips = prefs.getString(PREF_PREV_CITY_FIPS, "") ?: ""
    previousCityEnterTime = prefs.getLong(PREF_PREV_CITY_ENTER, 0L)
    Log.d(TAG, "Loaded persisted state: code=$previousStateCode name=$previousStateName")
}

// ==================== Native Offline Queue (Gap 2) ====================

private fun enqueueToOfflineQueue(payload: JSONObject) {
    try {
        val raw = prefs.getString(OFFLINE_QUEUE_KEY, "[]") ?: "[]"
        val queue = JSONArray(raw)
        // 🚫 DUPLICATE QUEUE CHECK
        val newKey = payload.optString("originState") + "_" + payload.optString("destinationState")

        for (i in 0 until queue.length()) {
            val existing = queue.getJSONObject(i).getJSONObject("payload")
            val existingKey = existing.optString("originState") + "_" + existing.optString("destinationState")

            if (existingKey == newKey) {
                Log.d(TAG, "🚫 Duplicate queue skipped")
                return
            }
        }
        val entry = JSONObject().apply {
            put("payload", payload)
            put("retryCount", 0)
            put("timestamp", System.currentTimeMillis())
        }
        queue.put(entry)
        prefs.edit().putString(OFFLINE_QUEUE_KEY, queue.toString()).apply()
        Log.d(TAG, "Offline queue: enqueued event, queue size=${queue.length()}")
    } catch (e: Exception) {
        Log.w(TAG, "Offline queue: enqueue failed", e)
    }
}

private fun flushOfflineQueue() {
    try {
        val raw = prefs.getString(OFFLINE_QUEUE_KEY, "[]") ?: "[]"
        val queue = JSONArray(raw)
        if (queue.length() == 0) return
        Log.d(TAG, "Offline queue: flushing ${queue.length()} events")
        val remaining = JSONArray()
        for (i in 0 until queue.length()) {
            val entry = queue.getJSONObject(i)
            val payload = entry.getJSONObject("payload")
            val retryCount = entry.getInt("retryCount")
            if (retryCount >= MAX_OFFLINE_RETRIES) {
                Log.w(TAG, "Offline queue: dropping event after $MAX_OFFLINE_RETRIES retries")
                continue
            }
            val success = sendQueuedEntry(payload)
            if (!success) {
                entry.put("retryCount", retryCount + 1)
                remaining.put(entry)
            }
        }
        prefs.edit().putString(OFFLINE_QUEUE_KEY, remaining.toString()).apply()
    } catch (e: Exception) {
        Log.w(TAG, "Offline queue: flush failed", e)
    }
}

private fun sendQueuedEntry(payload: JSONObject): Boolean {
    if (domigoToken.isEmpty()) return false
    // City enrichment before retry
        if (isInternetAvailable()) {
            val lat = payload.optDouble("destinationLat", 0.0)
            val lng = payload.optDouble("destinationLng", 0.0)

            if (lat != 0.0 && lng != 0.0) {
                try {
                    val url = "$GOOGLE_GEOCODING_URL?latlng=$lat,$lng&language=en&key=$googleApiKey"
                    val request = Request.Builder().url(url).build()
                    val response = httpClient.newCall(request).execute()

                    if (response.isSuccessful) {
                        val body = response.body?.string()
                        if (body != null) {
                            val json = JSONObject(body)
                            val results = json.getJSONArray("results")
                            if (results.length() > 0) {
                                val components = results.getJSONObject(0)
                                    .getJSONArray("address_components")

                                for (i in 0 until components.length()) {
                                    val comp = components.getJSONObject(i)
                                    val types = comp.getJSONArray("types")
                                    for (j in 0 until types.length()) {
                                        if (types.getString(j) == "locality") {
                                            payload.put("destinationCity",
                                                comp.getString("long_name"))
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "City enrichment failed")
                }
            }
        }
    val kind = payload.optString("kind", "trip")
    val builder = MultipartBody.Builder().setType(MultipartBody.FORM)
        .addFormDataPart("kind", kind)
        .addFormDataPart("date", payload.optString("date", ""))
        .addFormDataPart("typeOfDayId", "1")
        .addFormDataPart("isCommissionDay", "false")
        .addFormDataPart("isRemoteWork", "false")
        .addFormDataPart("remoteHours", "0")
        .addFormDataPart("isTravelling", if (kind == "trip") "true" else "false")
        .addFormDataPart("tripTypeId", "1")
        .addFormDataPart("tripModeId", "1")
        .addFormDataPart("confirmationNo", "")
        .addFormDataPart("vendor", "")
        .addFormDataPart("hasProof", "false")
        .addFormDataPart("proofType", "other")
        .addFormDataPart("notes", "")
        .addFormDataPart("creationType", payload.optString("creationType", "automatic"))
        .addFormDataPart("remoteLocation", "")
        .addFormDataPart("attachments", "[]")
    if (kind == "missing") {
        builder.addFormDataPart("state", payload.optString("state", ""))
    }
    if (kind == "trip") {
        builder.addFormDataPart("originCity", payload.optString("originCity", ""))
        builder.addFormDataPart("originState", payload.optString("originState", ""))
        builder.addFormDataPart("originLat", payload.optString("originLat", ""))
        builder.addFormDataPart("originLng", payload.optString("originLng", ""))
        builder.addFormDataPart("destinationCity", payload.optString("destinationCity", ""))
        builder.addFormDataPart("destinationState", payload.optString("destinationState", ""))
        builder.addFormDataPart("destinationLat", payload.optString("destinationLat", ""))
        builder.addFormDataPart("destinationLng", payload.optString("destinationLng", ""))
        val sd = payload.optString("startDate", "")
        if (sd.isNotEmpty()) builder.addFormDataPart("startDate", sd)
        val ed = payload.optString("endDate", "")
        if (ed.isNotEmpty()) builder.addFormDataPart("endDate", ed)
    }
    val request = Request.Builder()
        .url("https://stage.mydomigo.com/api/trip-days")
        .post(builder.build())
        .addHeader("Authorization", "Bearer $domigoToken")
        .build()
    return try {
        val response = httpClient.newCall(request).execute()
        response.isSuccessful
    } catch (e: Exception) {
        false
    }
}

// ==================== Missing Day Backfill (Gap 5) ====================

private fun backfillMissingDays() {
    val lastDate = prefs.getString(PREF_LAST_TRACKED_DATE, null) ?: return
    val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
    val stateForBackfill = currentStateName.ifEmpty { previousStateName }
    if (stateForBackfill.isEmpty()) return
    try {
        val last = sdf.parse(lastDate) ?: return
        val cal = Calendar.getInstance().apply { time = last }
        cal.add(Calendar.DAY_OF_MONTH, 1)
        val today = sdf.format(Date())
        while (sdf.format(cal.time) < today) {
            val gapDate = sdf.format(cal.time)
            Log.d(TAG, "Backfilling missing day: $gapDate")
            sendEntryFormData(
                kind = "missing", date = gapDate, typeOfDayId = null,
                isCommissionDay = false, isRemoteWork = false, remoteHours = 0,
                isTravelling = false, tripTypeId = 1, tripModeId = 1,
                confirmationNo = "", vendor = "", hasProof = false, proofType = "other",
                notes = "", creationType = "automatic", remoteLocation = "",
                isUpdated = false,
                state = stateForBackfill,
                originCity = previousCityName.ifBlank { previousCity },
                originState = null, originLat = null, originLng = null,
                destinationCity = previousCityName.ifBlank { previousCity },
                destinationState = null, destinationLat = null, destinationLng = null,
                originCounty = previousCountyName,
                destinationCounty = previousCountyName,
            )
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        prefs.edit().putString(PREF_LAST_TRACKED_DATE, today).apply()
    } catch (e: Exception) {
        Log.w(TAG, "Backfill failed", e)
    }
}

// ==================== Local GeoJSON Detection (Option B) ====================

// Loads state boundaries from bundled assets. Supports two shapes:
//   • New US format (src/geo/states.json → us-states.json): root is a JSONArray of
//     { id, name, bbox, geometry }. bbox enables fast prefiltering.
//   • Old GeoJSON FeatureCollection (India): root is an object with a "features" array.
private fun loadGeoJsonFeatures(): JSONArray {
    geoJsonFeatures?.let { return it }
    val fileName = when (geofencingCountry) {
        "IN" -> "india-states.geojson"
        else -> "us-states.json"
    }
    try {
        val raw = context.assets.open(fileName).bufferedReader().use { it.readText() }
        val features = if (raw.trimStart().startsWith("[")) {
            JSONArray(raw)
        } else {
            JSONObject(raw).getJSONArray("features")
        }
        geoJsonFeatures = features
        Log.d(TAG, "GeoJSON loaded: ${features.length()} features from $fileName")
        return features
    } catch (e: Exception) {
        Log.w(TAG, "Failed to load GeoJSON $fileName", e)
        return JSONArray()
    }
}

// Phase 2: state + county detection. Data-class results carry both FIPS and name so
// Phase 3 can key county files on FIPS without re-running state detection.
data class StateMatch(val fips: String?, val name: String, val countryCode: String)
data class CountyMatch(val fips: String, val name: String)
data class CityMatch(val fips: String, val name: String)
data class CanadianProvince(
    val code: String,
    val name: String,
    val minLng: Double,
    val minLat: Double,
    val maxLng: Double,
    val maxLat: Double
)

// Per-state county feature cache. Lazily populated on first lookup for each state;
// avoids re-parsing the counties/<FIPS>.json file on every tick.
private val countyFeatureCache: MutableMap<String, JSONArray> = mutableMapOf()
private val cityFeatureCache: MutableMap<String, JSONArray> = mutableMapOf()

private fun bboxSkips(feature: JSONObject, lat: Double, lng: Double): Boolean {
    val bbox = feature.optJSONArray("bbox") ?: return false
    if (bbox.length() != 4) return false
    val minX = bbox.getDouble(0); val minY = bbox.getDouble(1)
    val maxX = bbox.getDouble(2); val maxY = bbox.getDouble(3)
    return lng < minX || lng > maxX || lat < minY || lat > maxY
}

private fun pointInGeometry(lat: Double, lng: Double, geometry: JSONObject): Boolean {
    val coords = geometry.getJSONArray("coordinates")
    return when (geometry.getString("type")) {
        "Polygon" -> pointInPolygonRings(lat, lng, coords)
        "MultiPolygon" -> {
            for (p in 0 until coords.length()) {
                if (pointInPolygonRings(lat, lng, coords.getJSONArray(p))) return true
            }
            false
        }
        else -> false
    }
}

private val canadianProvinceBounds = listOf(
    CanadianProvince("YT", "Yukon", -141.1, 60.0, -123.7, 69.8),
    CanadianProvince("NT", "Northwest Territories", -136.6, 60.0, -101.9, 78.9),
    CanadianProvince("NU", "Nunavut", -121.0, 60.0, -52.0, 84.0),
    CanadianProvince("BC", "British Columbia", -139.2, 48.2, -114.0, 60.1),
    CanadianProvince("AB", "Alberta", -120.1, 48.9, -109.9, 60.1),
    CanadianProvince("SK", "Saskatchewan", -110.1, 48.9, -101.2, 60.1),
    CanadianProvince("MB", "Manitoba", -102.1, 48.9, -88.8, 60.1),
    CanadianProvince("NL", "Newfoundland and Labrador", -67.9, 46.5, -52.0, 60.6),
    CanadianProvince("ON", "Ontario", -95.3, 41.5, -74.2, 56.9),
    CanadianProvince("QC", "Quebec", -79.9, 44.8, -57.0, 62.7),
    CanadianProvince("NB", "New Brunswick", -69.2, 44.5, -63.7, 48.2),
    CanadianProvince("NS", "Nova Scotia", -66.6, 43.2, -59.5, 47.2),
    CanadianProvince("PE", "Prince Edward Island", -64.7, 45.8, -61.8, 47.1)
)

private fun isNorthAmericaGeofencing(): Boolean {
    return geofencingCountry == "US" || geofencingCountry == "CA" || geofencingCountry == "NA"
}

private fun detectCanadianProvince(lat: Double, lng: Double): StateMatch? {
    if (!isNorthAmericaGeofencing()) return null
    val province = canadianProvinceBounds.firstOrNull {
        lng >= it.minLng && lng <= it.maxLng && lat >= it.minLat && lat <= it.maxLat
    } ?: return null
    return StateMatch(province.code, province.name, "CA")
}

private fun detectStateFromGeoJSON(lat: Double, lng: Double): StateMatch? {
    val features = loadGeoJsonFeatures()
    val isIN = geofencingCountry == "IN"
    val detectedCountry = if (isIN) "IN" else "US"
    for (i in 0 until features.length()) {
        val feature = features.getJSONObject(i)
        if (bboxSkips(feature, lat, lng)) continue
        if (!pointInGeometry(lat, lng, feature.getJSONObject("geometry"))) continue

        val name: String? = if (isIN) {
            feature.getJSONObject("properties").optString("ST_NM", null)
        } else {
            feature.optString("name", null)
        }
        // val fips: String? = if (isIN) null else feature.optString("id", null)
        val fips: String? = if (isIN) {
            null
        } else {
            if (feature.has("id")) feature.getString("id") else null
        }
        if (name == null) return null
        return StateMatch(fips, name, detectedCountry)
    }
    return detectCanadianProvince(lat, lng)
}

// Loads counties for the given state FIPS (e.g. "06" for CA) from
// assets/counties/<FIPS>.json. Returns null if the file is missing (e.g. India,
// which doesn't bundle county data).
private fun loadCountyFeatures(stateFips: String): JSONArray? {
    countyFeatureCache[stateFips]?.let { return it }
    return try {
        val raw = context.assets.open("counties/$stateFips.json").bufferedReader().use { it.readText() }
        val features = JSONArray(raw)
        countyFeatureCache[stateFips] = features
        Log.d(TAG, "Counties loaded: ${features.length()} features for state $stateFips")
        features
    } catch (e: Exception) {
        Log.w(TAG, "No county data for state $stateFips", e)
        null
    }
}

private fun loadCityFeatures(stateName: String): JSONArray? {
    val safeStateName =
        stateName.replace(" ", "")
    cityFeatureCache[safeStateName]?.let {
        return it
    }
    return try {
        val raw = context.assets
            .open("cities/$safeStateName.json")
            .bufferedReader()
            .use { it.readText() }

        val json = JSONObject(raw)
        val features =
            json.getJSONArray("features")
        cityFeatureCache[safeStateName] = features
        Log.d(TAG,"Cities loaded: ${features.length()} for $safeStateName")
        features
    } catch (e: Exception) {
        Log.e( TAG,"Failed loading city data for $safeStateName",e)
        null
    }
}

private fun detectCountyFromGeoJSON(stateFips: String, lat: Double, lng: Double): CountyMatch? {
    val features = loadCountyFeatures(stateFips) ?: return null
    for (i in 0 until features.length()) {
        val feature = features.getJSONObject(i)
        if (bboxSkips(feature, lat, lng)) continue
        if (!pointInGeometry(lat, lng, feature.getJSONObject("geometry"))) continue
        val fips = feature.optString("id", null) ?: continue
        val name = feature.optString("name", null) ?: continue
        return CountyMatch(fips, name)
    }
    return null
}

private fun detectCityFromGeoJSON(
    stateName: String,
    lat: Double,
    lng: Double
): CityMatch? {

    val features = loadCityFeatures(stateName) ?: return null

    for (i in 0 until features.length()) {

        val feature = features.getJSONObject(i)

        if (bboxSkips(feature, lat, lng)) continue

        if (!pointInGeometry(
                lat,
                lng,
                feature.getJSONObject("geometry")
            )
        ) continue

        val properties = feature.getJSONObject("properties")

        val cityName =
            properties.optString("NAME", null) ?: continue

        val cityFips =
            properties.optString("GEOID", cityName)

        return CityMatch(
            cityFips,
            cityName
        )
    }

    return null
}

private fun pointInPolygonRings(lat: Double, lng: Double, rings: JSONArray): Boolean {
    if (rings.length() == 0) return false
    val outer = rings.getJSONArray(0)
    if (!pointInRing(lat, lng, outer)) return false
    for (h in 1 until rings.length()) {
        if (pointInRing(lat, lng, rings.getJSONArray(h))) return false
    }
    return true
}

private fun pointInRing(lat: Double, lng: Double, ring: JSONArray): Boolean {
    var inside = false
    val n = ring.length()
    var j = n - 1
    for (i in 0 until n) {
        val xi = ring.getJSONArray(i).getDouble(0); val yi = ring.getJSONArray(i).getDouble(1)
        val xj = ring.getJSONArray(j).getDouble(0); val yj = ring.getJSONArray(j).getDouble(1)
        if (((yi > lat) != (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) inside = !inside
        j = i
    }
    return inside
}

// Entry point for the local_native geofencing path. Runs on every location tick
// (per LocationModule's processLocationInBackground dispatch) when GEOFENCING_MODE == "local_native".
//
// Flow:
//   1. Polygon-detect the state from bundled GeoJSON (no network).
//   2. Emit a heartbeat ping to our own /api/locations endpoint.
//   3. Emit onAddressResolved to JS for UI.
//   4. First-time init: set previous* and return.
//   5. Same state: return (no Google, no trip).
//   6. State changed + online: reverse-geocode via Google for city enrichment;
//      sendToDomigoAPI in its success path creates the trip and updates state.
//   7. State changed + offline: debounce / min-stay / dedupe guards, then create
//      the trip locally (destinationCity left blank) and update state.
private fun processWithLocalGeoJSON(lat: Double, lng: Double) {
    checkAndSendHoursAPI(lat, lng)
    val match = detectStateFromGeoJSON(lat, lng)
    println("🔍 MATCH DEBUG → ${match?.name} | fips=${match?.fips}")
    if (match == null) {
        Log.w(TAG, "local_native: no state detected for $lat,$lng")
        println("❌ STATE DETECTION FAILED for $lat,$lng")
        return
    }


    // Name is the authoritative key used throughout previousStateName comparisons.
    // match.fips is threaded through for Phase 3 (county detection keys on FIPS).
    val detectedState = match.name
    val detectedCountry = match.countryCode
    if (!currentStateName.equals(detectedState, ignoreCase = true)) {
        currentStateName = detectedState
        saveStateToPrefs()
    }
    val county = if (detectedCountry == "US") {
        match.fips?.let { detectCountyFromGeoJSON(it, lat, lng) }
    } else {
        null
    }
    val newState = detectedState.trim()
    val oldState = previousStateName.trim()
    Log.d(TAG, "DEBUG → OLD=$oldState NEW=$newState")

    println("📍 STATE: old=$oldState new=$newState, fips=${match.fips}")
    println("📍 cityChangeEventsEnabled = $cityChangeEventsEnabled")

    // Heartbeat to our own API (itself gated by LOCATION_PING_INTERVAL + state change inside sendLocationPing).
    sendLocationPing(lat, lng, detectedState, match.fips ?: detectedState, detectedCountry)

    // Surface to JS for UI (no Google).
    val addressData = Arguments.createMap().apply {
        putDouble("latitude", lat); putDouble("longitude", lng)
        putString("city",  county?.name ?: ""); putString("state", detectedState)
        putString("stateCode", match.fips ?: ""); putString("countryCode", detectedCountry)
        putString("fullAddress", ""); putDouble("timestamp", System.currentTimeMillis().toDouble())
    }
    sendEvent("onAddressResolved", addressData)

    // First-time init.
    if (previousStateName.isEmpty()) {
        val now = System.currentTimeMillis()
        previousStateName = detectedState
        previousStateCode = match.fips ?: detectedState
        previousCountryCode = detectedCountry
        previousLat = lat
        previousLng = lng
        previousEnterTime = now

        if (detectedCountry == "US") {
            match.fips?.let { stateFips ->
                detectCountyFromGeoJSON(stateFips, lat, lng)?.let { county ->
                    previousCountyFips = county.fips
                    previousCountyName = county.name
                    previousCountyEnterTime = now
                }
            }

            detectCityFromGeoJSON(match.name, lat, lng)?.let { city ->
                previousCityFips = city.fips
                previousCityName = city.name
                previousCityEnterTime = now
                if (previousCity.isBlank()) {
                    previousCity = city.name
                }
            }
        }

        saveStateToPrefs()
        Log.d(TAG, "📍 Initial state set: $detectedState")
        return
    }

    // 🔥 Root guard: same state → no Google call, no trip. Fixes the ~180 req/hr Google bill.
    // if (newState.equals(oldState, ignoreCase = true)) {
    //     Log.d(TAG, "🏠 Same state — skipping (no Google call, no trip)")
    //     return
    // }
    if (newState.equals(oldState, ignoreCase = true)) {
        println("📍 Same state detected - checking county change")
        if (!cityChangeEventsEnabled) {
            println("❌ City change events DISABLED")
            return
        }
        println("✅ City change events ENABLED")
        if (detectedCountry != "US") {
            println("County/city change detection is only enabled for US boundary data")
            return
        }
    
        // val stateFips = match.fips ?: return
        val stateFips = match.fips ?: run {
            Log.e(TAG, "❌ FIPS missing for ${match.name}")
            println("❌ FIPS is NULL for state ${match.name}")
            return
        }
        println("📍 Looking for county with state FIPS: $stateFips")
        val county = detectCountyFromGeoJSON(stateFips, lat, lng)
        ?: return
    
            // FIRST TIME COUNTY SEED
            if (previousCountyFips.isEmpty()) {
            
                previousCountyFips = county.fips
                previousCountyName = county.name
                previousCountyEnterTime = System.currentTimeMillis()
            
                // ALSO SEED CITY
                val city = detectCityFromGeoJSON(
                    match.name,
                    lat,
                    lng
                )
            
                if (city != null) {
                    previousCityFips = city.fips
                    previousCityName = city.name
                    previousCityEnterTime = System.currentTimeMillis()
                }
            
                return
            }
            
            // COUNTY CHANGED
            if (county.fips != previousCountyFips) {
            
                handleCountyTransition(
                    match,
                    county,
                    lat,
                    lng
                )
            
                val city = detectCityFromGeoJSON(
                    match.name,
                    lat,
                    lng
                )
            
                if (city != null) {
                    handleDetectedCityAfterCountyChange(match, county, city, lat, lng)
                } else {
                    reverseGeocodeCityAfterCountyChange(match, county, lat, lng)
                }
            
                return
            }
            
            // SAME COUNTY → CHECK CITY
            val city = detectCityFromGeoJSON(
                match.name,
                lat,
                lng
            ) ?: return
            
            // FIRST TIME CITY SEED
            if (previousCityFips.isEmpty()) {
            
                previousCityFips = city.fips
                previousCityName = city.name
                previousCityEnterTime = System.currentTimeMillis()
            
                return
            }
            
            // SAME CITY
            if (city.fips == previousCityFips) {
                return
            }
            
            // CITY CHANGED
            handleCityTransition(
                match,
                county,
                city,
                lat,
                lng
            )
        return
    }

    // State changed → online: enrich city via Google (and let its success path post the trip + update state).
    if (isInternetAvailable()) {
        val stateTripStartTime =
            if (previousCityEnterTime > 0L)
                previousCityEnterTime
            else
                previousEnterTime
        val stateTripOriginCity = previousCityName.ifBlank { previousCity }
        val stateTripEndTime = System.currentTimeMillis()

        if (detectedCountry == "US") {
            sendUsBoundaryTripsForStateChange(match, lat, lng, stateTripEndTime)
        } else {
            previousCountyFips = ""
            previousCountyName = ""
            previousCountyEnterTime = 0L
            previousCityFips = ""
            previousCityName = ""
            previousCityEnterTime = 0L
        }
        reverseGeocodeInBackground(lat, lng, match, newState, stateTripOriginCity, stateTripStartTime, stateTripEndTime)
        return
    }

    // State changed → offline: guard, then create trip locally.
    Log.d(TAG, "Offline — creating trip with basic state only")
    stateChangeDetectedTime = 0L

    // Minimum stay in the previous state (avoids spurious trips during transit noise).
    val stayDuration = System.currentTimeMillis() - previousEnterTime
    if (stayDuration < MIN_STAY_TIME) {
        Log.d(TAG, "⏱️ Ignoring short stay")
        return
    }

    // Trip-level dedupe keyed on (origin, destination, origin-enter-time).
    val tripKey = "${oldState}_${newState}_${previousEnterTime}"
    if (tripKey == lastTripKey) {
        Log.d(TAG, "🚫 Duplicate trip blocked")
        return
    }
    if (isTransitionInProgress) {
        Log.d(TAG, "⛔ Transition already in progress")
        return
    }
    isTransitionInProgress = true

    Log.d(TAG, "🚗 STATE CHANGED: $oldState → $newState")

    // Snapshot origin before mutating previous*.
    val originStateSafe = previousStateName
    val originLatSafe = previousLat
    val originLngSafe = previousLng
    val originCitySafe = previousCityName.ifBlank { previousCity }
    // val originCitySafe = previousCity
    val originEnterTimeSafe = previousEnterTime
    val tripStartTime =
    if (previousCityEnterTime > 0L)
        previousCityEnterTime
    else
        previousEnterTime
    val stateTripEndTime = System.currentTimeMillis()

    if (detectedCountry == "US") {
        sendUsBoundaryTripsForStateChange(match, lat, lng, stateTripEndTime)
    }

    // Resolve destination city from bundled GeoJSON — works fully offline, no Google call needed.
    val destinationCityOffline = detectCityFromGeoJSON(newState, lat, lng)

    // Commit new state before firing the trip API.
    previousStateName = newState
    previousStateCode = match.fips ?: newState
    previousCountryCode = detectedCountry
    previousLat = lat
    previousLng = lng
    previousEnterTime = stateTripEndTime
    saveStateToPrefs()
    if (detectedCountry == "US") {
        match.fips?.let { fips ->
            val county = detectCountyFromGeoJSON(fips, lat, lng)
            if (county != null) {
                previousCountyFips = county.fips
                previousCountyName = county.name
                previousCountyEnterTime = stateTripEndTime

                Log.d(TAG, "County seeded after state change: ${county.name}")
            }
        }
        if (destinationCityOffline != null) {
            previousCityFips = destinationCityOffline.fips
            previousCityName = destinationCityOffline.name
            previousCityEnterTime = stateTripEndTime
            Log.d(TAG, "City seeded after state change: ${destinationCityOffline.name}")
        } else {
            previousCityFips = ""
            previousCityName = ""
            previousCityEnterTime = 0L
        }
    } else {
        previousCountyFips = ""
        previousCountyName = ""
        previousCountyEnterTime = 0L
        previousCityFips = ""
        previousCityName = ""
        previousCityEnterTime = 0L
    }
    lastTripKey = tripKey

    sendEntryFormData(
        kind = "trip",
        date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
        typeOfDayId = null,
        isCommissionDay = false,
        isRemoteWork = false,
        remoteHours = 0,
        isTravelling = true,
        tripTypeId = 1,
        tripModeId = 1,
        confirmationNo = "",
        vendor = "",
        hasProof = false,
        proofType = "other",
        notes = "",
        creationType = "automatic",
        remoteLocation = "",
        state = null,
        isUpdated = false,
        originCity = originCitySafe,
        originState = originStateSafe,
        originLat = originLatSafe,
        originLng = originLngSafe,
        destinationCity = destinationCityOffline?.name ?: newState,
        destinationState = newState,
        destinationLat = lat,
        destinationLng = lng,
        startDate = tripStartTime,
        endDate = stateTripEndTime
    )

    isTransitionInProgress = false
}

private fun sendUsBoundaryTripsForStateChange(
    state: StateMatch,
    lat: Double,
    lng: Double,
    now: Long
) {
    if (!cityChangeEventsEnabled || state.countryCode != "US") return

    val stateFips = state.fips ?: return
    val newCounty = detectCountyFromGeoJSON(stateFips, lat, lng)
    val newCity = detectCityFromGeoJSON(state.name, lat, lng)
    val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
    val originLatSafe = previousLat
    val originLngSafe = previousLng

    if (newCounty != null && previousCountyFips.isNotEmpty() && newCounty.fips != previousCountyFips) {
        val originCounty = previousCountyName
        val originCountyStart = if (previousCountyEnterTime > 0L) previousCountyEnterTime else previousEnterTime
        val countyKey = "state_${previousCountyFips}_${newCounty.fips}_$originCountyStart"

        if (countyKey != lastCityChangeKey) {
            lastCityChangeKey = countyKey
            Log.d(TAG, "COUNTY CHANGED WITH STATE: $originCounty -> ${newCounty.name}")

            sendEntryFormData(
                kind = "county_change",
                date = today,
                typeOfDayId = null,
                isCommissionDay = false,
                isRemoteWork = false,
                remoteHours = 0,
                isTravelling = false,
                tripTypeId = 1,
                tripModeId = 1,
                confirmationNo = "",
                vendor = "",
                hasProof = false,
                proofType = "other",
                notes = "",
                creationType = "automatic",
                remoteLocation = "",
                state = state.name,
                isUpdated = false,
                originCounty = originCounty,
                originState = previousStateName,
                originLat = originLatSafe,
                originLng = originLngSafe,
                destinationCounty = newCounty.name,
                destinationState = state.name,
                destinationLat = lat,
                destinationLng = lng,
                startDate = originCountyStart,
                endDate = now
            )
        }
    }

    if (newCity != null) {
        sendCityChangeByName(
            stateName = state.name,
            destinationCityName = newCity.name,
            destinationCityKey = newCity.fips,
            lat = lat,
            lng = lng,
            now = now,
            originStateName = previousStateName,
            originLatSafe = originLatSafe,
            originLngSafe = originLngSafe
        )
    } else {
        reverseGeocodeCityForStateChange(state, lat, lng, now, originLatSafe, originLngSafe)
    }

    if (newCounty != null) {
        previousCountyFips = newCounty.fips
        previousCountyName = newCounty.name
        previousCountyEnterTime = now
    }

    if (newCity != null) {
        previousCityFips = newCity.fips
        previousCityName = newCity.name
        previousCityEnterTime = now
    }
}

private fun handleDetectedCityAfterCountyChange(
    state: StateMatch,
    county: CountyMatch,
    city: CityMatch,
    lat: Double,
    lng: Double
) {
    val originCity = previousCityName.ifBlank { previousCity }
    if (previousCityFips.isEmpty()) {
        if (originCity.isNotBlank() && !city.name.equals(originCity, ignoreCase = true)) {
            handleCityTransition(state, county, city, lat, lng)
        } else {
            previousCityFips = city.fips
            previousCityName = city.name
            previousCityEnterTime = System.currentTimeMillis()
        }
    } else if (city.fips != previousCityFips) {
        handleCityTransition(state, county, city, lat, lng)
    }
}

private fun reverseGeocodeCityAfterCountyChange(
    state: StateMatch,
    county: CountyMatch,
    lat: Double,
    lng: Double
) {
    reverseGeocodeCityName(lat, lng) { cityName ->
        if (cityName.isBlank()) return@reverseGeocodeCityName
        handleDetectedCityAfterCountyChange(
            state,
            county,
            CityMatch(cityName, cityName),
            lat,
            lng
        )
    }
}

private fun reverseGeocodeCityForStateChange(
    state: StateMatch,
    lat: Double,
    lng: Double,
    now: Long,
    originLatSafe: Double?,
    originLngSafe: Double?
) {
    reverseGeocodeCityName(lat, lng) { cityName ->
        if (cityName.isBlank()) return@reverseGeocodeCityName
        sendCityChangeByName(
            stateName = state.name,
            destinationCityName = cityName,
            destinationCityKey = cityName,
            lat = lat,
            lng = lng,
            now = now,
            originStateName = previousStateName,
            originLatSafe = originLatSafe,
            originLngSafe = originLngSafe
        )
    }
}

private fun reverseGeocodeCityName(
    lat: Double,
    lng: Double,
    onCity: (String) -> Unit
) {
    if (!isInternetAvailable() || googleApiKey.isBlank()) return

    val url = "$GOOGLE_GEOCODING_URL?latlng=$lat,$lng&language=en&key=$googleApiKey"
    val request = Request.Builder().url(url).build()

    httpClient.newCall(request).enqueue(object : okhttp3.Callback {
        override fun onFailure(call: Call, e: IOException) {
            Log.w(TAG, "City fallback geocode failed: ${e.message}")
        }

        override fun onResponse(call: Call, response: Response) {
            try {
                val body = response.body?.string() ?: return
                if (!response.isSuccessful) return

                val json = JSONObject(body)
                if (json.optString("status") != "OK") return

                val results = json.optJSONArray("results") ?: return
                for (i in 0 until results.length()) {
                    val city = extractCityName(results.getJSONObject(i).getJSONArray("address_components"))
                    if (city.isNotBlank()) {
                        onCity(city)
                        return
                    }
                }
            } catch (e: Exception) {
                Log.w(TAG, "City fallback parse failed: ${e.message}")
            }
        }
    })
}

private fun extractCityName(components: JSONArray): String {
    var locality = ""
    var postalTown = ""
    var sublocality = ""
    var neighborhood = ""
    var adminLevel3 = ""

    for (i in 0 until components.length()) {
        val component = components.getJSONObject(i)
        val longName = component.optString("long_name", "")
        val types = component.getJSONArray("types")
        for (j in 0 until types.length()) {
            when (types.getString(j)) {
                "locality" -> locality = longName
                "postal_town" -> postalTown = longName
                "sublocality", "sublocality_level_1" -> sublocality = longName
                "neighborhood" -> neighborhood = longName
                "administrative_area_level_3" -> adminLevel3 = longName
            }
        }
    }

    return locality.ifBlank { postalTown.ifBlank { sublocality.ifBlank { neighborhood.ifBlank { adminLevel3 } } } }
}

private fun sendCityChangeByName(
    stateName: String,
    destinationCityName: String,
    destinationCityKey: String,
    lat: Double,
    lng: Double,
    now: Long,
    originStateName: String,
    originLatSafe: Double?,
    originLngSafe: Double?
) {
    val originCity = previousCityName.ifBlank { previousCity }
    val originCityStart = if (previousCityEnterTime > 0L) previousCityEnterTime else previousEnterTime
    val originCityKey = previousCityFips.ifBlank { originCity }
    val cityChanged = originCity.isNotBlank() && !destinationCityName.equals(originCity, ignoreCase = true)
    val cityKey = "city_${originCityKey}_${destinationCityKey}_$originCityStart"

    if (!cityChanged || cityKey == lastCityChangeKey) {
        if (originCity.isBlank()) {
            previousCityFips = destinationCityKey
            previousCityName = destinationCityName
            previousCityEnterTime = now
        }
        return
    }

    lastCityChangeKey = cityKey
    Log.d(TAG, "CITY CHANGED: $originCity -> $destinationCityName")

    sendEntryFormData(
        kind = "city_change",
        date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
        typeOfDayId = null,
        isCommissionDay = false,
        isRemoteWork = false,
        remoteHours = 0,
        isTravelling = false,
        tripTypeId = 1,
        tripModeId = 1,
        confirmationNo = "",
        vendor = "",
        hasProof = false,
        proofType = "other",
        notes = "",
        creationType = "automatic",
        remoteLocation = "",
        state = stateName,
        isUpdated = false,
        originCity = originCity,
        originState = originStateName,
        originLat = originLatSafe,
        originLng = originLngSafe,
        destinationCity = destinationCityName,
        destinationState = stateName,
        destinationLat = lat,
        destinationLng = lng,
        startDate = originCityStart,
        endDate = now
    )

    previousCityFips = destinationCityKey
    previousCityName = destinationCityName
    previousCityEnterTime = now
    previousCity = destinationCityName
    saveStateToPrefs()
}


private fun handleCountyTransition(
    state: StateMatch,
    newCounty: CountyMatch,
    lat: Double,
    lng: Double
) {
    val now = System.currentTimeMillis()
    countyChangeDetectedTime = 0L

    // // min stay
    // if (now - previousCountyEnterTime < MIN_COUNTY_STAY_MS) {
    //     Log.d(TAG, "⏱️ County stay too short")
    //     return
    // }

    val key = "${previousCountyFips}_${newCounty.fips}_$previousCountyEnterTime"
    if (key == lastCityChangeKey) {
        Log.d(TAG, "🚫 Duplicate city change")
        return
    }

    lastCityChangeKey = key

    val originCounty = previousCountyName
    val originEnterTime = previousCountyEnterTime

    Log.d(TAG, "🏙️ COUNTY CHANGED: $originCounty → ${newCounty.name}")


    // 🔥 SEND TO JS
    val eventData = Arguments.createMap().apply {
        putString("fromCounty", originCounty)
        putString("toCounty", newCounty.name)
        putString("state", state.name)
        putDouble("lat", lat)
        putDouble("lng", lng)
        putDouble("timestamp", now.toDouble())
    }

    sendEvent("onCityChangeDetected", eventData)

    // update state
    previousCountyEnterTime = System.currentTimeMillis()
    previousCountyFips = newCounty.fips
    previousCountyName = newCounty.name

    // 🔥 API CALL
    sendEntryFormData(
        kind = "county_change",
        date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date()),
        typeOfDayId = null,
        isCommissionDay = false,
        isRemoteWork = false,
        remoteHours = 0,
        isTravelling = false,
        tripTypeId = 1,
        tripModeId = 1,
        confirmationNo = "",
        vendor = "",
        hasProof = false,
        proofType = "other",
        notes = "",
        creationType = "automatic",
        remoteLocation = "",
        state = state.name,
        isUpdated = false,

        originCounty = originCounty,
        originState = state.name,
        originLat = previousLat,
        originLng = previousLng,

        destinationCounty = newCounty.name,
        destinationState = state.name,
        destinationLat = lat,
        destinationLng = lng,

        startDate = originEnterTime,
        endDate = now
    )
}

private fun handleCityTransition(
    state: StateMatch,
    county: CountyMatch,
    newCity: CityMatch,
    lat: Double,
    lng: Double
) {

    val now = System.currentTimeMillis()

    val key =
        "${previousCityFips.ifBlank { previousCityName.ifBlank { previousCity } }}_${newCity.fips}_${if (previousCityEnterTime > 0L) previousCityEnterTime else previousEnterTime}"

    if (key == lastCityChangeKey) {
        return
    }

    lastCityChangeKey = key

    val originCity = previousCityName.ifBlank { previousCity }
    val originEnterTime = if (previousCityEnterTime > 0L) previousCityEnterTime else previousEnterTime

    Log.d(
        TAG,
        "🏙️ CITY CHANGED: $originCity → ${newCity.name}"
    )

    val eventData = Arguments.createMap().apply {

        putString("fromCity", originCity)
        putString("toCity", newCity.name)

        putString("county", county.name)
        putString("state", state.name)

        putDouble("lat", lat)
        putDouble("lng", lng)
    }

    sendEvent(
        "onRealCityChangeDetected",
        eventData
    )

    previousCityFips = newCity.fips
    previousCityName = newCity.name
    val newEnterTime = now

    previousCityFips = newCity.fips
    previousCityName = newCity.name
    previousCityEnterTime = newEnterTime
    previousCity = newCity.name
    saveStateToPrefs()

    sendEntryFormData(
        kind = "city_change",

        date = SimpleDateFormat(
            "yyyy-MM-dd",
            Locale.getDefault()
        ).format(Date()),

        typeOfDayId = null,
        isCommissionDay = false,
        isRemoteWork = false,
        remoteHours = 0,
        isTravelling = false,

        tripTypeId = 1,
        tripModeId = 1,

        confirmationNo = "",
        vendor = "",

        hasProof = false,
        proofType = "other",

        notes = "",
        creationType = "automatic",
        remoteLocation = "",

        state = state.name,
        isUpdated = false,

        originCity = originCity,
        originState = state.name,
        originLat = previousLat,
        originLng = previousLng,

        destinationCity = newCity.name,
        destinationState = state.name,
        destinationLat = lat,
        destinationLng = lng,

        startDate = originEnterTime,
        endDate = now
    )
}

}

class LocationForegroundService : Service() {
    private val CHANNEL_ID = "location_service_domigo"
    private val NOTIFICATION_ID = 1

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }

    override fun onDestroy() {
        super.onDestroy()
        stopForeground(true)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Domigo Location Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Tracks your location in the background for Domigo app"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val notificationIntent = packageManager?.getLaunchIntentForPackage(packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Domigo Location Tracking")
            .setContentText("Tracking your location in the background")
            .setSmallIcon(getNotificationIcon())
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .setSilent(true)
            .build()
    }

    private fun getNotificationIcon(): Int {
        return resources.getIdentifier("ic_launcher", "mipmap", packageName)
    }
}
