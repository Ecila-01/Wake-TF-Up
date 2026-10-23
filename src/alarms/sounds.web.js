import { Asset } from 'expo-asset';
import catalog from '../../assets/sounds/catalog.json';
export const BUILTIN_SOUNDS = catalog;
export const DEFAULT_SOUND = 'digital_beep';
const assets = {
  digital_beep: require('../../assets/sounds/digital_beep.mp3'),
  electronic_alarm: require('../../assets/sounds/electronic_alarm.mp3'),
  classic_alarm: require('../../assets/sounds/classic_alarm.mp3'),
  synth_alarm: require('../../assets/sounds/synth_alarm.mp3'),
  rapid_alarm: require('../../assets/sounds/rapid_alarm.mp3'),
  warning_beep: require('../../assets/sounds/warning_beep.mp3'),
  bedside_beep: require('../../assets/sounds/bedside_beep.mp3'),
  clock_radio: require('../../assets/sounds/clock_radio.mp3'),
  digital_clock: require('../../assets/sounds/digital_clock.mp3'),
  lofi_clock: require('../../assets/sounds/lofi_clock.mp3'),
};
function database() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wakeTFUpAudio', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sounds', { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Browser audio storage is unavailable. Try a normal browser window.'));
  });
}
async function stored(operation, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('sounds', operation === 'put' ? 'readwrite' : 'readonly');
      const request = transaction.objectStore('sounds')[operation](...(value === undefined ? [] : [value]));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = transaction.onabort = () => reject(new Error('Could not save audio in this browser. Check available storage.'));
    });
  } finally { db.close(); }
}
export async function getImportedSounds() { return (await stored('getAll')).map(({ id, name }) => ({ id, name })); }
function validateFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const player = new Audio();
    const finish = error => { clearTimeout(timeout); player.onloadedmetadata = player.onerror = null; player.removeAttribute('src'); player.load(); URL.revokeObjectURL(url); error ? reject(error) : resolve(); };
    const timeout = setTimeout(() => finish(new Error('Could not read this audio. Try MP3, WAV, OGG, or M4A.')), 10000);
    player.onloadedmetadata = () => { player.onloadedmetadata = player.onerror = null; finish(player.duration > 0 ? null : new Error('Choose a playable audio file.')); };
    player.onerror = () => { player.onloadedmetadata = player.onerror = null; finish(new Error('Unsupported audio. Try MP3, WAV, OGG, or M4A.')); };
    player.preload = 'metadata'; player.src = url;
  });
}
export function importSound() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'audio/*';
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      try {
        if (file.size > 25 * 1024 * 1024) throw new Error('Choose an audio file smaller than 25 MB.');
        await validateFile(file);
        const sound = { id: `custom_${crypto.randomUUID()}`, name: file.name, blob: file };
        await stored('put', sound);
        resolve({ id: sound.id, name: sound.name });
      } catch (error) { reject(error); }
    };
    input.click();
  });
}
let preview;
let previewUrl;
let stopTimer;
let generation = 0;
export function stopSoundPreview() {
  generation++;
  clearTimeout(stopTimer);
  if (preview) { preview.pause(); preview.removeAttribute('src'); preview.load(); preview = null; }
  if (previewUrl) { URL.revokeObjectURL(previewUrl); previewUrl = null; }
}
export async function previewSound(id) {
  stopSoundPreview();
  const current = generation;
  let url;
  if (assets[id]) url = Asset.fromModule(assets[id]).uri;
  else {
    const sound = await stored('get', id);
    if (current !== generation) return;
    if (!sound?.blob) throw new Error('This audio is missing. Import it again.');
    previewUrl = URL.createObjectURL(sound.blob); url = previewUrl;
  }
  preview = new Audio(url); preview.loop = true;
  try { await preview.play(); } catch { stopSoundPreview(); throw new Error('Could not play this sound. Try another audio file.'); }
  if (current === generation) stopTimer = setTimeout(stopSoundPreview, 5000);
}
