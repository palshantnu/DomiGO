package com.gohome.domigo

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log

/**
 * BOOT RECEIVER — Auto-restarts location tracking after phone reboot (Gap 4)
 *
 * PURPOSE:
 *   After the phone restarts, the foreground location service is killed.
 *   Without this receiver, tracking only resumes when the user manually opens the app.
 *   This receiver listens for BOOT_COMPLETED and restarts LocationForegroundService
 *   automatically, so tracking continues seamlessly.
 *
 * GUARD:
 *   Only starts the service if SharedPreferences flag DOMIGO_TRACKING_ENABLED == "1".
 *   This prevents the service from starting if the user had tracking disabled.
 *
 * REGISTRATION:
 *   Registered in AndroidManifest.xml with BOOT_COMPLETED intent filter.
 *   Requires RECEIVE_BOOT_COMPLETED permission (also in manifest).
 *
 * iOS EQUIVALENT:
 *   Not needed — iOS uses startMonitoringSignificantLocationChanges() which
 *   automatically survives app termination and device reboot.
 */
class BootReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action != Intent.ACTION_BOOT_COMPLETED) return

        val prefs = context.getSharedPreferences("domigo_location", Context.MODE_PRIVATE)
        val trackingEnabled = prefs.getString("DOMIGO_TRACKING_ENABLED", "0")

        if (trackingEnabled != "1") {
            Log.d("BootReceiver", "Tracking not enabled, skipping service restart")
            return
        }

        Log.d("BootReceiver", "Boot completed — restarting LocationForegroundService")
        val serviceIntent = Intent(context, LocationForegroundService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(serviceIntent)
        } else {
            context.startService(serviceIntent)
        }
    }
}
