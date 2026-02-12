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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone
import java.util.Calendar


class LocationModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val context: Context = reactContext
    private lateinit var locationManager: LocationManager
    private lateinit var locationListener: LocationListener
    private var isTracking = false

    init {
        LocationModuleHolder.module = this
    }

    // HTTP client for background network calls
    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()

    // Configuration
    private var locationInterval: Long = 20000L 
    private var locationDistance: Float = 0f
    private var googleApiKey: String = ""
    private var domigoToken: String = ""
    private var apiUrl: String = ""

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


    companion object {
        private const val TAG = "LocationModule"
        private const val NOTIFICATION_ID = 1
        private const val CHANNEL_ID = "location_service_domigo"
        private const val GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
        private const val FOUR_HOURS_MS = 4 * 60 * 60 * 1000 // 4 hours in milliseconds
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
            
            Log.d(TAG, "Config updated - Interval: $locationInterval, API Key: ${if (googleApiKey.isNotEmpty()) "SET" else "NOT SET"}")
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

        // Check if API key is set
        if (googleApiKey.isEmpty()) {
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



private fun scheduleMidnightMissingDay() {

    val calendar = Calendar.getInstance().apply {
        timeInMillis = System.currentTimeMillis()
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
        // Perform reverse geocoding in background
        reverseGeocodeInBackground(location.latitude, location.longitude)
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
                                sendToDomigoAPI(lat, lng, city, state,stateCode,countryCode, fullAddress)
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

        if (previousStateCode.isEmpty()) {
            previousStateCode = stateCode
            previousCountryCode = countryCode
            previousStateName = state
            previousLat = lat
            previousLng = lng
            previousCity = city
            previousEnterTime = System.currentTimeMillis()
            Log.d(TAG, "📍 Initial state captured: $stateCode")
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
    if (stateCode == previousStateCode && countryCode == previousCountryCode) {
        Log.d(TAG, "🏠 Same state ($stateCode), skipping trip")
    } else {
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
            stateId = null,
    
            originCity = previousCity,
            originState = previousStateName,
            originLat = previousLat,
            originLng = previousLng,
    
            destinationCity = city,
            destinationState = state,
            destinationLat = lat,
            destinationLng = lng
        )
    
        // UPDATE STATE AFTER TRIP
        previousStateCode = stateCode
        previousCountryCode = countryCode
        previousStateName = state
        previousLat = lat
        previousLng = lng
        previousCity = city
        previousEnterTime = System.currentTimeMillis()
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
//     stateId = null,

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
    stateId: String?,

    // TRIP ONLY
    originCity: String?,
    originState: String?,
    originLat: Double?,
    originLng: Double?,
    destinationCity: String?,
    destinationState: String?,
    destinationLat: Double?,
    destinationLng: Double?
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
        body.addFormDataPart("stateId", s(stateId))
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
    httpClient.newCall(request).enqueue(object : okhttp3.Callback {

        override fun onFailure(call: Call, e: IOException) {
            Log.e(TAG, "❌ Entry API failed: ${e.message}")
    
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
    
            Log.d(TAG, "✅ Entry API success: ${response.code}")
    
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
        tripTypeId = null,
        tripModeId = null,
        confirmationNo = "",
        vendor = "",
        hasProof = false,
        proofType = "other",
        notes = "",
        creationType = "automatic",
        remoteLocation = "",
        stateId = previousStateName,

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