package com.ecila.waketfup.alarm

import android.content.Context
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import com.ecila.waketfup.R
import java.io.File
import org.json.JSONArray

object AlarmSounds {
  val builtins = mapOf(
    "digital_beep" to R.raw.digital_beep, "electronic_alarm" to R.raw.electronic_alarm,
    "classic_alarm" to R.raw.classic_alarm, "synth_alarm" to R.raw.synth_alarm,
    "rapid_alarm" to R.raw.rapid_alarm, "warning_beep" to R.raw.warning_beep,
    "bedside_beep" to R.raw.bedside_beep, "clock_radio" to R.raw.clock_radio,
    "digital_clock" to R.raw.digital_clock, "lofi_clock" to R.raw.lofi_clock
  )
  val attributes: AudioAttributes = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build()
  fun imports(context: Context) = JSONArray(AlarmStore.preferences(context).getString("sounds", "[]"))
  fun customFile(context: Context, id: String): File {
    require(Regex("custom_[a-f0-9-]{36}").matches(id)) { "Choose a valid audio file." }
    return File(File(context.filesDir, "alarm_sounds"), id)
  }
  fun validate(context: Context, id: String) {
    require(builtins.containsKey(id) || (id.startsWith("custom_") && customFile(context, id).isFile)) {
      "This sound is missing. Import it again or choose a built-in sound."
    }
  }
  fun prepare(context: Context, id: String): MediaPlayer {
    val player = MediaPlayer()
    try {
      player.setAudioAttributes(attributes)
      player.setWakeMode(context, PowerManager.PARTIAL_WAKE_LOCK)
      val resource = builtins[id]
      if (resource != null) context.resources.openRawResourceFd(resource).use {
        player.setDataSource(it.fileDescriptor, it.startOffset, it.length)
      } else player.setDataSource(customFile(context, id).absolutePath)
      player.prepare()
      require(player.duration > 0) { "Choose a playable audio file." }
      return player
    } catch (error: Exception) { player.release(); throw error }
  }
  private val handler = Handler(Looper.getMainLooper())
  private var preview: MediaPlayer? = null
  private val stop = Runnable { stopPreview() }
  @Synchronized fun stopPreview() {
    handler.removeCallbacks(stop)
    preview?.release(); preview = null
  }
  @Synchronized fun preview(context: Context, id: String) {
    stopPreview()
    check(AlarmStore.active(context).length() == 0) { "Dismiss the ringing alarm before previewing sounds." }
    preview = prepare(context, id).apply { isLooping = true; start() }
    handler.postDelayed(stop, 5000)
  }
}
