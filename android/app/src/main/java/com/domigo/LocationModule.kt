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
    private var locationInterval: Long = 20000L 
    private var locationDistance: Float = 0f
    private var googleApiKey: String = ""
    private var domigoToken: String = ""
    private var apiUrl: String = ""
    private var geofencingMode: String = ""
    private var geofencingCountry: String = ""

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

    private var lastGeocodeTime: Long = 0L

    // GeoJSON cache for local_native mode
    private var geoJsonFeatures: JSONArray? = null


    companion object {
        private const val TAG = "LocationModule"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "location_service_domigo"
        private const val GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
        private const val FOUR_HOURS_MS = 4 * 60 * 60 * 1000
        private const val GEOCODE_INTERVAL = 45 * 60 * 1000L
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
                geofencingCountry = config.getString("geofencingCountry") ?: ""
            }
            
            Log.d(TAG, "Config updated - Interval: $locationInterval, Mode: $geofencingMode, Country: $geofencingCountry")

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

    private fun setupLocationListener() {
        locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
        locationListener = object : LocationListener {
            override fun onLocationChanged(location: Location) {
                Log.d(TAG, "New location: ${location.latitude}, ${location.longitude}, Accuracy: ${location.accuracy}")
                
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
    

    
        lastGeocodeTime = currentTime

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
            reverseGeocodeInBackground(location.latitude, location.longitude)
        }
    }

    private fun reverseGeocodeInBackground(lat: Double, lng: Double) {
        val url = "$GOOGLE_GEOCODING_URL?latlng=$lat,$lng&language=en&key=$googleApiKey"
        
        val request = Request.Builder()
            .url(url)
            .build()

        httpClient.newCall(request).enqueue(object : okhttp3.Callback {
            override fun onFailure(call: okhttp3.Call, e: IOException) {
                Log.e(TAG, "Reverse geocoding failed: ${e.message}")
                sendEvent("onLocationError", Arguments.createMap().apply {
                    putString("error", "Reverse geocoding failed: ${e.message}")
                })
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
                                
                                // Send to Domigo API with conditions
                                // sendToDomigoAPI(lat, lng, city, state,stateCode,countryCode, fullAddress)
                                if (geofencingMode == "local_native") {

                                    if (state.equals(previousStateName, ignoreCase = true)) {
                                        isTransitionInProgress = false
                                        return
                                    }
                                
                                    val originStateSafe = previousStateName
                                    val originLatSafe = previousLat
                                    val originLngSafe = previousLng
                                    val originCitySafe = previousCity
                                    val originEnterTimeSafe = previousEnterTime
                                
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
                                        isUpdated=false,
                                
                                        originCity = originCitySafe,
                                        originState = originStateSafe,
                                        originLat = originLatSafe,
                                        originLng = originLngSafe,
                                
                                        destinationCity = city,
                                        destinationState = state,
                                        destinationLat = lat,
                                        destinationLng = lng,
                                
                                        startDate = originEnterTimeSafe,
                                        endDate = System.currentTimeMillis()
                                    )
                                
                                    // 🔥 UPDATE STATE HERE (Online case)
                                    previousStateName = state
                                    previousStateCode = stateCode
                                    previousCountryCode = countryCode
                                    previousLat = lat
                                    previousLng = lng
                                    previousCity = city
                                    previousEnterTime = System.currentTimeMillis()
                                    saveStateToPrefs()
                                
                                    isTransitionInProgress = false
                                    return
                                }
                            }
                        } else {
                            Log.e(TAG, "Google Geocoding API error: $status")
                            sendEvent("onLocationError", Arguments.createMap().apply {
                                putString("error", "Geocoding API error: $status")
                            })
                        }
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing reverse geocode response: ${e.message}")
                    sendEvent("onLocationError", Arguments.createMap().apply {
                        putString("error", "Geocoding parse error: ${e.message}")
                    })
                }
            }
        })
    }



    private fun sendToDomigoAPI(lat: Double, lng: Double, city: String, state: String, stateCode: String, countryCode: String, address: String) {
       

        val currentTime = System.currentTimeMillis()
        val timeDifference = currentTime - lastApiTime
        val stateChanged = state != lastState
        val sameState = stateCode == previousStateCode
        val sameCountry = countryCode == previousCountryCode
        val timePassed = timeDifference >= FOUR_HOURS_MS

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
        if (geofencingMode == "local_native") {
            return
        }

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
        // if (stateCode == previousStateCode) {
        //     Log.d(TAG, "🏠 Same state ($stateCode) — Trip NOT created")
        //     return
        // }
    
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
    
            originCity = toEnglishSafe(previousCity),
            originState = toEnglishSafe(previousStateName),
            originLat = previousLat,
            originLng = previousLng,
    
            destinationCity = toEnglishSafe(city),
            destinationState = toEnglishSafe(state),
            destinationLat = lat,
            destinationLng = lng,
    
            startDate = previousEnterTime,
            endDate = System.currentTimeMillis()
        )
    
        previousStateCode = stateCode
        previousCountryCode = countryCode
        previousStateName = state
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousEnterTime = System.currentTimeMillis()
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
//         .url("http://3.91.116.18:4001/api/trips")  // replace with your addTrip URL
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
    originCity: String?,
    originState: String?,
    originLat: Double?,
    originLng: Double?,
    destinationCity: String?,
    destinationState: String?,
    destinationLat: Double?,
    destinationLng: Double?,
    startDate: Long? = null,
    endDate: Long? = null
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

    val request = Request.Builder()
        // .url("http://3.91.116.18:4001/api/trips")
        .url("http://3.91.116.18:4001/api/trip-days")
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
        originCity = null,
        originState = null,
        originLat = null,
        originLng = null,
        destinationCity = null,
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
    Log.d(TAG, "Loaded persisted state: code=$previousStateCode name=$previousStateName")
}

// ==================== Native Offline Queue (Gap 2) ====================

private fun enqueueToOfflineQueue(payload: JSONObject) {
    try {
        val raw = prefs.getString(OFFLINE_QUEUE_KEY, "[]") ?: "[]"
        val queue = JSONArray(raw)
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
        .url("http://3.91.116.18:4001/api/trip-days")
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
                originCity = null, originState = null, originLat = null, originLng = null,
                destinationCity = null, destinationState = null, destinationLat = null, destinationLng = null
            )
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        prefs.edit().putString(PREF_LAST_TRACKED_DATE, today).apply()
    } catch (e: Exception) {
        Log.w(TAG, "Backfill failed", e)
    }
}

// ==================== Local GeoJSON Detection (Option B) ====================

private fun loadGeoJsonFeatures(): JSONArray {
    geoJsonFeatures?.let { return it }
    val fileName = when (geofencingCountry) {
        "IN" -> "india-states.geojson"
        else -> "us-states.json"
    }
    try {
        val json = context.assets.open(fileName).bufferedReader().use { it.readText() }
        val root = JSONObject(json)
        val features = root.getJSONArray("features")
        geoJsonFeatures = features
        Log.d(TAG, "GeoJSON loaded: ${features.length()} features from $fileName")
        return features
    } catch (e: Exception) {
        Log.w(TAG, "Failed to load GeoJSON $fileName", e)
        return JSONArray()
    }
}

private fun detectStateFromGeoJSON(lat: Double, lng: Double): String? {
    val features = loadGeoJsonFeatures()
    val nameKey = if (geofencingCountry == "IN") "ST_NM" else "name"
    for (i in 0 until features.length()) {
        val feature = features.getJSONObject(i)
        val geometry = feature.getJSONObject("geometry")
        val type = geometry.getString("type")
        val coords = geometry.getJSONArray("coordinates")
        val inside = when (type) {
            "Polygon" -> pointInPolygonRings(lat, lng, coords)
            "MultiPolygon" -> {
                var found = false
                for (p in 0 until coords.length()) {
                    if (pointInPolygonRings(lat, lng, coords.getJSONArray(p))) { found = true; break }
                }
                found
            }
            else -> false
        }
        if (inside) return feature.getJSONObject("properties").optString(nameKey, null)
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

private fun processWithLocalGeoJSON(lat: Double, lng: Double) {
    val detectedState = detectStateFromGeoJSON(lat, lng)

    if (detectedState == null) {
        Log.w(TAG, "local_native: no state detected for $lat,$lng")
        return
    }
    currentStateName = detectedState
    // val detectedState = detectStateFromGeoJSON(lat, lng)
    // if (detectedState == null) { Log.w(TAG, "local_native: no state detected for $lat,$lng"); return }
    // currentStateName = detectedState
    val addressData = Arguments.createMap().apply {
        putDouble("latitude", lat); putDouble("longitude", lng)
        putString("city", ""); putString("state", detectedState)
        putString("stateCode", ""); putString("countryCode", geofencingCountry)
        putString("fullAddress", ""); putDouble("timestamp", System.currentTimeMillis().toDouble())
    }
    // if (previousEnterTime == 0L) {
    //     previousLat = lat; previousLng = lng
    //     previousStateName = detectedState; previousStateCode = detectedState
    //     previousCountryCode = geofencingCountry; previousEnterTime = System.currentTimeMillis()
    //     saveStateToPrefs()
    //     Log.d(TAG, "local_native: initialized state=$detectedState")
    // }
    sendEvent("onAddressResolved", addressData)
        // First time initialize
        if (previousStateName.isEmpty()) {
            previousStateName = detectedState
            previousStateCode = detectedState
            previousCountryCode = geofencingCountry
            previousLat = lat
            previousLng = lng
            previousEnterTime = System.currentTimeMillis()
            saveStateToPrefs()
    
            Log.d(TAG, "📍 Initial state set: $detectedState")
            return
        }
    
        // Strong comparison
        if (detectedState.trim().equals(previousStateName.trim(), ignoreCase = true)) {
            Log.d(TAG, "🏠 Same state ($detectedState) — skipping")
            return
        }

        if (stateChangeDetectedTime == 0L) {
            stateChangeDetectedTime = System.currentTimeMillis()
            isTransitionInProgress = false
            return
        }
        
        val diff = System.currentTimeMillis() - stateChangeDetectedTime
        if (diff < 5000) {
            return
        }
        
        stateChangeDetectedTime = 0L

        if (isTransitionInProgress) {
            Log.d(TAG, "⛔ Transition already in progress — skipping")
            return
        }

        isTransitionInProgress = true

        Log.d(TAG, "🚗 STATE CHANGED: $previousStateName → $detectedState")



    
        // reverseGeocodeInBackground(lat, lng)
        if (isInternetAvailable()) {
            reverseGeocodeInBackground(lat, lng)
            return  // ❗ Important
        } 
            Log.d(TAG, "Offline — creating trip with basic state only")

            // SAFE COPY of origin
            // -------- OFFLINE CASE --------
            val originStateSafe = previousStateName
            val originLatSafe = previousLat
            val originLngSafe = previousLng
            val originCitySafe = previousCity
            val originEnterTimeSafe = previousEnterTime
        
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
        
                originCity = previousCity,
                originState = previousStateName,
                originLat = previousLat,
                originLng = previousLng,
        
                destinationCity = "",
                destinationState = detectedState,
                destinationLat = lat,
                destinationLng = lng,
        
                startDate = previousEnterTime,
                endDate = System.currentTimeMillis()
            )
        
            // IMPORTANT: Update previous state AFTER trip creation
            previousStateName = detectedState
            previousStateCode = detectedState
            previousCountryCode = geofencingCountry
            previousLat = lat
            previousLng = lng
            previousEnterTime = System.currentTimeMillis()
            saveStateToPrefs()

            isTransitionInProgress = false

    // sendToDomigoAPI(lat, lng, "", detectedState, detectedState, geofencingCountry, "")
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