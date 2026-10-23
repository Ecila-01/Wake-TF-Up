package com.ecila.waketfup.alarm

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

class AlarmRestoreReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
      AlarmStore.preferences(context).edit().remove("active").commit()
    }
    try { AlarmStore.restore(context) } catch (error: Exception) { Log.e("WakeTFUp", "Couldn't restore alarms", error) }
  }
}
