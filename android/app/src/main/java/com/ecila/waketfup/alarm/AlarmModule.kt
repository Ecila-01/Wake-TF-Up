package com.ecila.waketfup.alarm

import android.app.NotificationManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.*
import org.json.JSONObject
import com.ecila.waketfup.MainActivity
import android.app.Activity
import android.provider.OpenableColumns
import java.util.UUID

class AlarmModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var importPromise: Promise? = null
  private val pickerRequest = 4812
  init {
    context.addLifecycleEventListener(object : LifecycleEventListener {
      override fun onHostResume() {}
      override fun onHostPause() { AlarmSounds.stopPreview() }
      override fun onHostDestroy() {
        AlarmSounds.stopPreview()
        importPromise?.reject("IMPORT_CANCELLED", "Audio import was interrupted. Try again.")
        importPromise = null
      }
    })
    context.addActivityEventListener(object : BaseActivityEventListener() {
      override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != pickerRequest) return
        val promise = importPromise ?: return
        importPromise = null
        if (resultCode != Activity.RESULT_OK) { promise.resolve(null); return }
        val uri = data?.data
        if (uri == null) { promise.reject("IMPORT_ERROR", "No audio file was selected."); return }
        Thread {
          val id = "custom_${UUID.randomUUID()}"
          val target = AlarmSounds.customFile(context, id)
          try {
            var name = "Imported audio"
            context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use {
              if (it.moveToFirst()) name = it.getString(0) ?: name
            }
            target.parentFile?.mkdirs()
            context.contentResolver.openInputStream(uri)?.use { input ->
              target.outputStream().use { output ->
                val buffer = ByteArray(8192)
                var total = 0L
                while (true) {
                  val count = input.read(buffer)
                  if (count < 0) break
                  total += count
                  require(total <= 25 * 1024 * 1024) { "Choose an audio file smaller than 25 MB." }
                  output.write(buffer, 0, count)
                }
              }
            } ?: error("Couldn't read this file. Download it to your device first.")
            AlarmSounds.prepare(context, id).release()
            val sound = JSONObject().put("id", id).put("name", name.take(120))
            synchronized(AlarmSounds) {
              val sounds = AlarmSounds.imports(context).put(sound)
              check(AlarmStore.preferences(context).edit().putString("sounds", sounds.toString()).commit())
            }
            promise.resolve(sound.toString())
          } catch (error: Exception) {
            target.delete()
            promise.reject("IMPORT_ERROR", error.message ?: "Couldn't import this audio. Try MP3, WAV, OGG, or M4A.", error)
          }
        }.start()
      }
    })
  }
  @ReactMethod fun getImportedSounds(promise: Promise) = perform(promise) { AlarmSounds.imports(context).toString() }
  @ReactMethod fun importSound(promise: Promise) {
    val activity = context.currentActivity
    if (activity == null) { promise.reject("IMPORT_ERROR", "Open the app and try again."); return }
    activity.runOnUiThread {
      if (importPromise != null) { promise.reject("IMPORT_ERROR", "An audio picker is already open."); return@runOnUiThread }
      AlarmSounds.stopPreview()
      importPromise = promise
      try {
        activity.startActivityForResult(Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          type = "audio/*"
          putExtra(Intent.EXTRA_LOCAL_ONLY, true)
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }, pickerRequest)
      } catch (error: Exception) { importPromise = null; promise.reject("IMPORT_ERROR", "Couldn't open the audio picker.", error) }
    }
  }
  @ReactMethod fun previewSound(id: String, promise: Promise) = perform(promise) { AlarmSounds.preview(context, id); null }
  @ReactMethod fun stopSoundPreview() { AlarmSounds.stopPreview() }
  override fun getName() = "AlarmModule"
  override fun initialize() {
    super.initialize()
    // Restore on UI startup, never Application.onCreate: that also runs immediately
    // before a cold-start alarm broadcast, and would mark the due alarm as missed.
    try {
      AlarmStore.restore(context)
      if (AlarmStore.active(context).length() > 0) {
        val intent = Intent(context, AlarmService::class.java)
        if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(intent) else context.startService(intent)
      }
    } catch (error: Exception) { android.util.Log.e("WakeTFUp", "Couldn't restore alarms", error) }
  }

  @ReactMethod fun getState(promise: Promise) = perform(promise) {
    JSONObject().put("alarms", AlarmStore.all(context)).put("active", AlarmStore.active(context))
      .put("exact", AlarmStore.canSchedule(context))
      .put("notifications", context.getSystemService(NotificationManager::class.java).areNotificationsEnabled())
      .put("fullScreen", Build.VERSION.SDK_INT < 34 || context.getSystemService(NotificationManager::class.java).canUseFullScreenIntent())
      .toString()
  }
  @ReactMethod fun saveAlarm(json: String, promise: Promise) = perform(promise) {
    AlarmStore.save(context, JSONObject(json)); null
  }
  @ReactMethod fun deleteAlarm(id: Int, promise: Promise) = perform(promise) {
    AlarmStore.delete(context, id); null
  }
  @ReactMethod fun setQrToken(token: String, promise: Promise) = perform(promise) {
    check(AlarmStore.preferences(context).edit().putString("qrToken", token).commit()); null
  }
  @ReactMethod fun dismissAlarm(id: Int, token: String, promise: Promise) = perform(promise) {
    val alarm = AlarmStore.findActive(context, id) ?: error("This alarm is no longer ringing.")
    if (alarm.optString("challenge") == "qr") {
      val expected = AlarmStore.preferences(context).getString("qrToken", null)
      require(!expected.isNullOrEmpty() && token == expected) { "That QR doesn't match. Try your wake-up QR." }
    }
    AlarmStore.removeActive(context, id)
    updateWindow()
    if (AlarmStore.active(context).length() == 0) context.stopService(Intent(context, AlarmService::class.java))
    else context.startService(Intent(context, AlarmService::class.java))
    null
  }
  @ReactMethod fun snoozeAlarm(id: Int, promise: Promise) = perform(promise) {
    val active = AlarmStore.findActive(context, id) ?: error("This alarm is no longer ringing.")
    require(active.optString("challenge") != "qr") { "QR alarms must be scanned to dismiss." }
    AlarmStore.snooze(context, id)
    updateWindow()
    if (AlarmStore.active(context).length() == 0) context.stopService(Intent(context, AlarmService::class.java))
    else context.startService(Intent(context, AlarmService::class.java))
    null
  }
  @ReactMethod fun requestExactAlarmPermission() {
    if (Build.VERSION.SDK_INT >= 31 && !AlarmStore.canSchedule(context)) {
      context.startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:${context.packageName}"))
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
  @ReactMethod fun requestFullScreenPermission() {
    val action = if (Build.VERSION.SDK_INT >= 34) Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT else Settings.ACTION_APPLICATION_DETAILS_SETTINGS
    context.startActivity(Intent(action, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
  }
  private fun perform(promise: Promise, block: () -> Any?) {
    try { promise.resolve(block()) } catch (error: Exception) {
      promise.reject("ALARM_ERROR", error.message ?: "Unable to update alarm", error)
    }
  }
  private fun updateWindow() {
    (context.currentActivity as? MainActivity)?.let { activity -> activity.runOnUiThread { activity.applyAlarmWindow() } }
  }
}
