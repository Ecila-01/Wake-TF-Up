package com.ecila.waketfup.alarm

import android.app.*
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.media.MediaPlayer
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.ecila.waketfup.MainActivity
import com.ecila.waketfup.R

class AlarmService : Service() {
  private var player: MediaPlayer? = null
  private var focusRequest: AudioFocusRequest? = null
  private var playingSound: String? = null
  private val attributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val active = AlarmStore.active(this)
    if (active.length() == 0) { stopSelf(); return START_NOT_STICKY }
    createChannel()
    val open = PendingIntent.getActivity(this, 100, Intent(this, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    }, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    val alarm = active.getJSONObject(0)
    val notification = NotificationCompat.Builder(this, "wake_alarm_v2")
      .setSmallIcon(R.drawable.ic_alarm_notification)
      .setContentTitle(alarm.optString("label").ifBlank { "Wake TF Up" })
      .setContentText(if (alarm.optString("challenge") == "qr") "Scan your wake-up QR to dismiss" else "Your alarm is ringing. Tap to dismiss or snooze.")
      .setCategory(NotificationCompat.CATEGORY_ALARM).setPriority(NotificationCompat.PRIORITY_MAX)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC).setOngoing(true).setAutoCancel(false)
      .setContentIntent(open).setFullScreenIntent(open, true).build()
    startForeground(1, notification)
    val sound = alarm.optString("soundId", "digital_beep")
    if (player == null || playingSound != sound) {
      player?.release(); player = null
      startSound(sound)
    }
    return START_STICKY
  }

  private fun startSound(sound: String) {
    try {
      AlarmSounds.stopPreview()
      val audio = getSystemService(AudioManager::class.java)
      if (Build.VERSION.SDK_INT >= 26) {
        focusRequest?.let { audio.abandonAudioFocusRequest(it) }
        focusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
          .setAudioAttributes(attributes).setOnAudioFocusChangeListener { }.build()
        audio.requestAudioFocus(focusRequest!!)
      }
      val prepared = try { AlarmSounds.prepare(this, sound) } catch (error: Exception) {
        Log.e("WakeTFUp", "Selected sound unavailable; using Digital Beep", error)
        AlarmSounds.prepare(this, "digital_beep")
      }
      player = prepared.apply {
        isLooping = true
        start()
      }
      playingSound = sound
    } catch (error: Exception) { Log.e("WakeTFUp", "Couldn't play alarm tone", error) }
  }

  override fun onDestroy() {
    player?.release(); player = null
    if (Build.VERSION.SDK_INT >= 26) focusRequest?.let { getSystemService(AudioManager::class.java).abandonAudioFocusRequest(it) }
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }
  override fun onBind(intent: Intent?): IBinder? = null
  private fun createChannel() {
    val channel = NotificationChannel("wake_alarm_v2", "Ringing alarms", NotificationManager.IMPORTANCE_HIGH).apply {
      description = "Wake-up alarms and lock-screen alerts"
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      setSound(null, null)
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
