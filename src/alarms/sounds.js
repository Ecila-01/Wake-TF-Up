import { NativeModules } from 'react-native';
import catalog from '../../assets/sounds/catalog.json';

export const BUILTIN_SOUNDS = catalog;
export const DEFAULT_SOUND = 'digital_beep';
const native = NativeModules.AlarmModule;
export async function getImportedSounds() {
  return native?.getImportedSounds ? JSON.parse(await native.getImportedSounds()) : [];
}
export async function importSound() {
  if (!native?.importSound) throw new Error('Rebuild the Android app to import audio.');
  const json = await native.importSound();
  return json ? JSON.parse(json) : null;
}
export async function previewSound(id) {
  if (!native?.previewSound) throw new Error('Rebuild the Android app to preview sounds.');
  await native.previewSound(id);
}
export function stopSoundPreview() { native?.stopSoundPreview?.(); }
