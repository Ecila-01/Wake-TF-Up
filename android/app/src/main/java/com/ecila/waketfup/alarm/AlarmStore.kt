package com.ecila.waketfup.alarm

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.ecila.waketfup.MainActivity
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

/** Native storage owns schedules independently of the JavaScript process. */
object AlarmStore {
  fun preferences(context: Context) = context.getSharedPreferences("wake_tf_up_alarms", Context.MODE_PRIVATE)
  @Synchronized fun all(context: Context) = JSONArray(preferences(context).getString("alarms", "[]"))
  @Synchronized fun active(context: Context) = JSONArray(preferences(context).getString("active", "[]"))
  private fun write(context: Context, key: String, value: JSONArray) {
    check(preferences(context).edit().putString(key, value.toString()).commit()) { "Couldn't save alarm. Try again." }
  }
  private fun manager(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
  fun canSchedule(context: Context) = Build.VERSION.SDK_INT < 31 || manager(context).canScheduleExactAlarms()
  private fun find(array: JSONArray, id: Int): JSONObject? {
    for (i in 0 until array.length()) if (array.getJSONObject(i).getInt("id") == id) return array.getJSONObject(i)
    return null
  }
  private fun without(array: JSONArray, id: Int): JSONArray {
    val result = JSONArray()
    for (i in 0 until array.length()) if (array.getJSONObject(i).getInt("id") != id) result.put(array.getJSONObject(i))
    return result
  }
  fun findActive(context: Context, id: Int) = find(active(context), id)
  private fun pending(context: Context, id: Int): PendingIntent = PendingIntent.getBroadcast(
    context, id, Intent(context, AlarmReceiver::class.java).putExtra("alarmId", id),
    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
  )
  fun nextAt(alarm: JSONObject, now: Long = System.currentTimeMillis()): Long {
    val days = alarm.getJSONArray("days")
    for (offset in 0..7) {
      val date = Calendar.getInstance().apply {
        timeInMillis = now
        add(Calendar.DAY_OF_YEAR, offset)
        set(Calendar.HOUR_OF_DAY, alarm.getInt("hour")); set(Calendar.MINUTE, alarm.getInt("minute"))
        set(Calendar.SECOND, 0); set(Calendar.MILLISECOND, 0)
      }
      var matches = days.length() == 0
      for (i in 0 until days.length()) if (days.getInt(i) == date.get(Calendar.DAY_OF_WEEK) - 1) matches = true
      if (date.timeInMillis > now && matches) return date.timeInMillis
    }
    error("No next alarm time found")
  }
  private fun schedule(context: Context, alarm: JSONObject) {
    check(canSchedule(context)) { "Allow Alarms & reminders in Settings, then try again." }
    val show = PendingIntent.getActivity(context, alarm.getInt("id"), Intent(context, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    manager(context).setAlarmClock(AlarmManager.AlarmClockInfo(alarm.getLong("nextAt"), show), pending(context, alarm.getInt("id")))
  }
  @Synchronized fun save(context: Context, input: JSONObject) {
    val id = input.getInt("id")
    require(id > 0 && input.getInt("hour") in 0..23 && input.getInt("minute") in 0..59) { "Invalid alarm time" }
    require(input.getString("challenge") in listOf("normal", "qr")) { "Invalid dismissal method" }
    val sound = input.optString("soundId", "digital_beep")
    AlarmSounds.validate(context, sound)
    val days = input.getJSONArray("days")
    require(days.length() <= 7)
    for (i in 0 until days.length()) require(days.getInt(i) in 0..6)
    require(findActive(context, id) == null) { "Dismiss this alarm before editing it." }
    val alarm = JSONObject(input.toString()).put("snoozed", false).put("soundId", sound)
    val old = find(all(context), id)
    alarm.put("nextAt", if (alarm.getBoolean("enabled")) nextAt(alarm) else 0)
    if (alarm.getBoolean("enabled")) schedule(context, alarm) else manager(context).cancel(pending(context, id))
    try { write(context, "alarms", without(all(context), id).put(alarm)) } catch (error: Exception) {
      if (old != null && old.optBoolean("enabled")) schedule(context, old) else manager(context).cancel(pending(context, id))
      throw error
    }
  }
  @Synchronized fun delete(context: Context, id: Int) {
    require(findActive(context, id) == null) { "Dismiss this alarm before deleting it." }
    manager(context).cancel(pending(context, id))
    write(context, "alarms", without(all(context), id))
  }
  @Synchronized fun fire(context: Context, id: Int): Boolean {
    val alarm = find(all(context), id) ?: return false
    if (!alarm.optBoolean("enabled") || alarm.optLong("nextAt") > System.currentTimeMillis() + 1000) return false
    write(context, "active", without(active(context), id).put(JSONObject(alarm.toString())))
    alarm.put("snoozed", false)
    if (alarm.getJSONArray("days").length() > 0) {
      alarm.put("nextAt", nextAt(alarm)); schedule(context, alarm)
    } else { alarm.put("enabled", false).put("nextAt", 0) }
    write(context, "alarms", without(all(context), id).put(alarm))
    return true
  }
  @Synchronized fun removeActive(context: Context, id: Int) = write(context, "active", without(active(context), id))
  @Synchronized fun snooze(context: Context, id: Int) {
    val alarm = find(all(context), id) ?: error("Alarm not found")
    alarm.put("enabled", true).put("snoozed", true).put("nextAt", System.currentTimeMillis() + 5 * 60000)
    schedule(context, alarm)
    write(context, "alarms", without(all(context), id).put(alarm)); removeActive(context, id)
  }
  @Synchronized fun restore(context: Context) {
    if (!canSchedule(context)) return
    val alarms = all(context)
    val now = System.currentTimeMillis()
    for (i in 0 until alarms.length()) {
      val alarm = alarms.getJSONObject(i)
      if (!alarm.optBoolean("enabled")) continue
      if (alarm.optBoolean("snoozed")) {
        if (alarm.optLong("nextAt") <= now) alarm.put("nextAt", now + 1000)
      } else if (alarm.getJSONArray("days").length() > 0) {
        alarm.put("nextAt", nextAt(alarm))
      } else if (alarm.optLong("nextAt") <= now) {
        alarm.put("enabled", false).put("nextAt", 0); continue
      } else { alarm.put("nextAt", nextAt(alarm)) }
      schedule(context, alarm)
    }
    write(context, "alarms", alarms)
  }
}
