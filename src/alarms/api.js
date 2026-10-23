import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { nextOccurrence, validateAlarm } from './model';

const native = Platform.OS === 'android' ? NativeModules.AlarmModule : null;
const PREVIEW_KEY = 'wakeTFUp:previewAlarms';
export const isNativeAlarm = Boolean(native?.getState);

async function previewAlarms() {
  const json = await AsyncStorage.getItem(PREVIEW_KEY);
  const alarms = json ? JSON.parse(json) : [];
  if (!Array.isArray(alarms)) throw new Error('Saved preview alarms could not be read. Your data has not been overwritten.');
  return alarms;
}

export async function getState() {
  if (isNativeAlarm) return JSON.parse(await native.getState());
  return { alarms: await previewAlarms(), active: [], exact: false, fullScreen: false, notifications: false };
}

export async function saveAlarm(alarm) {
  validateAlarm(alarm);
  if (isNativeAlarm) return native.saveAlarm(JSON.stringify(alarm));
  const alarms = await previewAlarms();
  const saved = { ...alarm, snoozed: false, nextAt: alarm.enabled ? nextOccurrence(alarm) : 0 };
  await AsyncStorage.setItem(PREVIEW_KEY, JSON.stringify([...alarms.filter(a => a.id !== alarm.id), saved]));
}

export async function deleteAlarm(id) {
  if (isNativeAlarm) return native.deleteAlarm(id);
  await AsyncStorage.setItem(PREVIEW_KEY, JSON.stringify((await previewAlarms()).filter(a => a.id !== id)));
}

export const setQrToken = token => isNativeAlarm ? native.setQrToken(token) : Promise.resolve();
export const dismissAlarm = (id, token = '') => native?.dismissAlarm(id, token);
export const snoozeAlarm = id => native?.snoozeAlarm(id);
export const requestExact = () => native?.requestExactAlarmPermission();
export const requestFullScreen = () => native?.requestFullScreenPermission();
